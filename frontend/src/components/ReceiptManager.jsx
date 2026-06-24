import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileImage, FileText, Loader2, Trash2, Upload, X } from 'lucide-react';
import api from '../services/api';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** unit)).toFixed(unit ? 1 : 0)} ${units[unit]}`;
};

const ReceiptManager = ({ transactionId, receipts = [], canManage, onChange, notify }) => {
  const inputRef = useRef(null);
  const [items, setItems] = useState(receipts);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => setItems(receipts), [receipts]);

  const sync = (next) => {
    setItems(next);
    onChange?.(next);
  };

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const data = new FormData();
    data.append('transaction_id', transactionId);
    files.forEach((file) => data.append('receipts', file));
    setUploading(true);
    try {
      const res = await api.post('/petty-cash/receipts/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      sync(res.data || []);
      notify?.(`${files.length} receipt${files.length > 1 ? 's' : ''} uploaded securely.`);
    } catch (err) {
      notify?.(err?.message || 'Receipt upload failed.', 'error');
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
        {canManage && <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="p-2 text-erp-blue hover:bg-blue-50 rounded-lg" title="Upload receipt">
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        </button>}
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={upload} />
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
