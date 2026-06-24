const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { logActivity } = require('../utils/logService');
const { RECEIPT_ROOT } = require('../middleware/receiptUpload');

const PRIVILEGED_ROLES = new Set(['Finance', 'Admin', 'Super Admin', 'Accounting']);
const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || null;

const hasValidFileSignature = (file) => {
  const bytes = fs.readFileSync(file.path).subarray(0, 8);
  if (file.mimetype === 'application/pdf') return bytes.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/png') return bytes.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
};
const discardUploadedFiles = (files) => files.forEach((file) => fs.unlink(file.path, () => {}));

const canAccessTransaction = (user, transaction) =>
  PRIVILEGED_ROLES.has(user.role) || transaction.created_by === user.id;

const findReceipt = async (id) => db('petty_cash_receipts as receipts')
  .join('expenses as expenses', 'receipts.transaction_id', 'expenses.id')
  .select('receipts.*', 'expenses.created_by')
  .where('receipts.id', id)
  .whereNull('receipts.deleted_at')
  .first();

const resolveFile = (receipt) => {
  const filePath = path.resolve(RECEIPT_ROOT, '..', receipt.file_path);
  const expectedRoot = `${RECEIPT_ROOT}${path.sep}`;
  if (!filePath.startsWith(expectedRoot)) throw new Error('Invalid receipt file path');
  return filePath;
};

exports.uploadReceipts = async (req, res) => {
  const transactionId = Number(req.body.transaction_id);
  if (!transactionId || !req.files?.length) {
    return res.status(400).json({ success: false, message: 'A transaction and at least one receipt are required.' });
  }

  try {
    if (req.files.some((file) => !hasValidFileSignature(file))) {
      discardUploadedFiles(req.files);
      return res.status(400).json({ success: false, message: 'Receipt content does not match an allowed JPG, PNG, or PDF file type.' });
    }
    const transaction = await db('expenses').where({ id: transactionId }).first();
    if (!transaction) {
      discardUploadedFiles(req.files);
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    if (!canAccessTransaction(req.user, transaction)) {
      discardUploadedFiles(req.files);
      return res.status(403).json({ success: false, message: 'You are not authorized to upload receipts for this transaction.' });
    }

    const records = req.files.map((file) => ({
      transaction_id: transactionId,
      original_filename: path.basename(file.originalname),
      stored_filename: file.filename,
      file_path: path.posix.join('receipts', path.basename(path.dirname(file.destination)), path.basename(file.destination), file.filename),
      file_type: file.mimetype,
      file_size: file.size,
      uploaded_by: req.user.id,
      uploaded_at: db.fn.now(),
      ip_address: getIp(req)
    }));
    await db('petty_cash_receipts').insert(records);
    await logActivity(req.user.id, 'UPLOAD_RECEIPT', `Uploaded ${records.length} receipt(s) for transaction ID ${transactionId}`, getIp(req));

    const receipts = await db('petty_cash_receipts').where({ transaction_id: transactionId }).whereNull('deleted_at').orderBy('uploaded_at', 'desc');
    res.status(201).json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to upload receipts.' });
  }
};

exports.listReceipts = async (req, res) => {
  try {
    const transaction = await db('expenses').where({ id: req.params.transactionId }).first();
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    if (!canAccessTransaction(req.user, transaction)) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const receipts = await db('petty_cash_receipts as receipts')
      .leftJoin('users', 'receipts.uploaded_by', 'users.id')
      .select('receipts.*', db.raw('COALESCE(users.full_name, users.username) as uploader_name'))
      .where('receipts.transaction_id', transaction.id)
      .whereNull('receipts.deleted_at')
      .orderBy('receipts.uploaded_at', 'desc');
    res.json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const serveReceipt = (download) => async (req, res) => {
  try {
    const receipt = await findReceipt(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found.' });
    if (!canAccessTransaction(req.user, receipt) && receipt.uploaded_by !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const filePath = resolveFile(receipt);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Receipt file is unavailable.' });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.type(receipt.file_type);
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(receipt.original_filename)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.viewReceipt = serveReceipt(false);
exports.downloadReceipt = serveReceipt(true);

exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await findReceipt(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found.' });
    if (!PRIVILEGED_ROLES.has(req.user.role)) return res.status(403).json({ success: false, message: 'Only Finance or Admin users can delete receipts.' });

    await db('petty_cash_receipts').where({ id: receipt.id }).update({
      deleted_by: req.user.id,
      deleted_at: db.fn.now(),
      deleted_ip_address: getIp(req)
    });
    await logActivity(req.user.id, 'DELETE_RECEIPT', `Soft-deleted receipt ${receipt.id} for transaction ID ${receipt.transaction_id}`, getIp(req));
    res.json({ success: true, message: 'Receipt deleted. The audit record and protected file were retained.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
