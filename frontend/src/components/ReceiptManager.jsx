import React, { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Camera, Download, Eye, FileImage, FileText, Loader2, Trash2, Upload, X } from 'lucide-react';
import api from '../services/api';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** unit)).toFixed(unit ? 1 : 0)} ${units[unit]}`;
};

const ReceiptManager = ({ transactionId, receipts = [], canManage, onChange, notify }) => {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [items, setItems] = useState(receipts);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => setItems(receipts), [receipts]);

  const sync = (next) => {
    setItems(next);
    onChange?.(next);
  };

  const uploadFiles = async (files) => {
    if (!files.length) return;
    const data = new FormData();
    data.append('transaction_id', transactionId);
    files.forEach((file) => data.append('receipts', file));
    setUploading(true);
    try {
      const res = await api.post('/petty-cash/receipts/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      sync(res.data || []);
      notify?.(`${files.length} receipt${files.length > 1 ? 's' : ''} uploaded securely.`);
      return true;
    } catch (err) {
      notify?.(err?.message || 'Receipt upload failed.', 'error');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    await uploadFiles(files);
    event.target.value = '';
  };

  const autoCropReceipt = (image, mimeType) => {
    const longestSide = Math.max(image.width, image.height);
    const scale = Math.min(1, 2200 / longestSide);
    const sourceWidth = Math.round(image.width * scale);
    const sourceHeight = Math.round(image.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, sourceWidth, sourceHeight);

    const pixels = context.getImageData(0, 0, sourceWidth, sourceHeight).data;
    const corners = [[2, 2], [sourceWidth - 3, 2], [2, sourceHeight - 3], [sourceWidth - 3, sourceHeight - 3]];
    const background = corners.reduce((total, [x, y]) => {
      const offset = (y * sourceWidth + x) * 4;
      return [total[0] + pixels[offset], total[1] + pixels[offset + 1], total[2] + pixels[offset + 2]];
    }, [0, 0]).map((value) => value / corners.length);

    let left = sourceWidth;
    let top = sourceHeight;
    let right = 0;
    let bottom = 0;
    for (let y = 0; y < sourceHeight; y += 4) {
      for (let x = 0; x < sourceWidth; x += 4) {
        const offset = (y * sourceWidth + x) * 4;
        const distance = Math.abs(pixels[offset] - background[0]) + Math.abs(pixels[offset + 1] - background[1]) + Math.abs(pixels[offset + 2] - background[2]);
        if (distance > 120) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }

    const cropWidth = right - left;
    const cropHeight = bottom - top;
    // Keep the original framing when the camera already fills the frame or no
    // clear receipt boundary is detected.
    if (cropWidth < sourceWidth * 0.45 || cropHeight < sourceHeight * 0.45) {
      return { dataUrl: canvas.toDataURL(mimeType, 0.9), width: sourceWidth, height: sourceHeight };
    }

    const padding = Math.round(Math.min(cropWidth, cropHeight) * 0.035);
    const x = Math.max(0, left - padding);
    const y = Math.max(0, top - padding);
    const width = Math.min(sourceWidth - x, cropWidth + (padding * 2));
    const height = Math.min(sourceHeight - y, cropHeight + (padding * 2));
    const cropped = document.createElement('canvas');
    cropped.width = width;
    cropped.height = height;
    cropped.getContext('2d').drawImage(canvas, x, y, width, height, 0, 0, width, height);
    return { dataUrl: cropped.toDataURL(mimeType, 0.9), width, height };
  };

  const convertCaptureToPdf = (imageFile) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the captured receipt.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to process the captured receipt.'));
      image.onload = () => {
        const mimeType = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const cropped = autoCropReceipt(image, mimeType);
        const landscape = cropped.width > cropped.height;
        const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4', compress: true });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const scale = Math.min((pageWidth - 12) / cropped.width, (pageHeight - 12) / cropped.height);
        const width = cropped.width * scale;
        const height = cropped.height * scale;
        pdf.addImage(cropped.dataUrl, imageFile.type === 'image/png' ? 'PNG' : 'JPEG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height, undefined, 'FAST');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        resolve(new File([pdf.output('blob')], `receipt-capture-${stamp}.pdf`, { type: 'application/pdf' }));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(imageFile);
  });

  const capture = async (event) => {
    const image = event.target.files?.[0];
    if (!image) return;
    setUploading(true);
    try {
      const pdf = await convertCaptureToPdf(image);
      if (pdf.size > 10 * 1024 * 1024) {
        throw new Error('The generated receipt PDF is over the 10MB upload limit. Please retake the photo closer to the receipt.');
      }
      // Keep a copy on the device that captured the receipt as well as the
      // protected server copy linked to the voucher.
      const localUrl = URL.createObjectURL(pdf);
      const localCopy = document.createElement('a');
      localCopy.href = localUrl;
      localCopy.download = pdf.name;
      localCopy.click();
      setTimeout(() => URL.revokeObjectURL(localUrl), 1000);
      const uploaded = await uploadFiles([pdf]);
      if (uploaded) notify?.('Receipt PDF saved to this device and uploaded securely.');
    } catch (err) {
      notify?.(err?.message || 'Unable to capture receipt.', 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const openFile = async (receipt, download = false) => {
    try {
      const blob = await api.get(`/petty-cash/receipts/${receipt.id}/${download ? 'download' : 'view'}`, { responseType: 'blob' });
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = receipt.original_filename;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        setPreview({ url, type: receipt.file_type, name: receipt.original_filename });
      }
    } catch (err) {
      notify?.(err?.message || 'Unable to open receipt.', 'error');
    }
  };

  const remove = async (receipt) => {
    if (!window.confirm(`Delete receipt "${receipt.original_filename}"? Its audit record will be retained.`)) return;
    try {
      await api.delete(`/petty-cash/receipts/${receipt.id}`);
      sync(items.filter((item) => item.id !== receipt.id));
      notify?.('Receipt removed and recorded in the audit trail.');
    } catch (err) {
      notify?.(err?.message || 'Unable to delete receipt.', 'error');
    }
  };

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Liquidation Receipts</p>
          <p className="text-xs text-slate-500 mt-1">JPG, PNG, or PDF up to 10MB. Stored in protected server storage.</p>
        </div>
        {canManage && <div className="flex items-center gap-1">
          <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading} className="p-2 text-erp-blue hover:bg-blue-50 rounded-lg" title="Capture receipt with camera">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="p-2 text-erp-blue hover:bg-blue-50 rounded-lg" title="Upload receipt file"><Upload size={18} /></button>
        </div>}
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={upload} />
        <input ref={cameraRef} type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" onChange={capture} />
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? <p className="p-4 text-xs text-slate-500">No receipt uploaded yet.</p> : items.map((receipt) => (
          <div key={receipt.id} className="p-3 flex items-center gap-3">
            {receipt.file_type === 'application/pdf' ? <FileText size={18} className="text-rose-500" /> : <FileImage size={18} className="text-erp-blue" />}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{receipt.original_filename}</p>
              <p className="text-[10px] text-slate-500">{formatSize(receipt.file_size)} · {receipt.uploader_name || 'User'} · {new Date(receipt.uploaded_at).toLocaleString()}</p>
            </div>
            <button type="button" onClick={() => openFile(receipt)} className="p-2 text-slate-500 hover:text-erp-blue hover:bg-blue-50 rounded-lg" title="Preview receipt"><Eye size={16} /></button>
            <button type="button" onClick={() => openFile(receipt, true)} className="p-2 text-slate-500 hover:text-erp-blue hover:bg-blue-50 rounded-lg" title="Download receipt"><Download size={16} /></button>
            {canManage && <button type="button" onClick={() => remove(receipt)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete receipt"><Trash2 size={16} /></button>}
          </div>
        ))}
      </div>
      {preview && <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-slate-950/70" onClick={closePreview}>
        <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
          <div className="h-12 px-4 flex items-center justify-between border-b"><p className="text-sm font-bold truncate">{preview.name}</p><button type="button" onClick={closePreview} className="p-2 rounded-lg hover:bg-slate-100" title="Close preview"><X size={18} /></button></div>
          {preview.type === 'application/pdf' ? <iframe title={preview.name} src={preview.url} className="w-full h-[calc(85vh-3rem)]" /> : <img src={preview.url} alt={preview.name} className="w-full h-[calc(85vh-3rem)] object-contain bg-slate-100" />}
        </div>
      </div>}
    </div>
  );
};

export default ReceiptManager;
