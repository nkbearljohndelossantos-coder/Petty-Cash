import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ServerIssueBanner = () => {
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    const handleIssue = (event) => {
      setIssue({
        status: event.detail?.status,
        message: event.detail?.message || 'The server is temporarily unavailable.',
      });
    };

    window.addEventListener('petty-cash:server-issue', handleIssue);
    return () => window.removeEventListener('petty-cash:server-issue', handleIssue);
  }, []);

  if (!issue) return null;

  return (
    <div className="fixed left-1/2 top-3 z-[9999] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-lg border border-amber-200 bg-white px-4 py-3 shadow-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900">
            Server issue {issue.status ? `(${issue.status})` : ''}
          </p>
          <p className="text-xs font-semibold text-slate-600">
            {issue.message} Please retry after a moment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIssue(null)}
          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss server issue"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ServerIssueBanner;
