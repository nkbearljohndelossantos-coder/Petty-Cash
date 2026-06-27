import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ServiceUnavailable = ({ title = 'Server temporarily unavailable', message, onRetry }) => (
  <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
    <div className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <AlertTriangle size={24} />
      </div>
      <h1 className="text-lg font-black text-slate-900">{title}</h1>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        {message || 'The Petty Cash server is not responding right now. Please try again in a moment.'}
      </p>
      <button
        type="button"
        onClick={onRetry || (() => window.location.reload())}
        className="btn-erp btn-erp-primary mx-auto mt-5"
      >
        <RefreshCw size={16} />
        Retry
      </button>
    </div>
  </div>
);

export default ServiceUnavailable;
