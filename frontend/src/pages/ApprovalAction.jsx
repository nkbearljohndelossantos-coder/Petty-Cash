import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const ApprovalAction = ({ mode }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [expense, setExpense] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const approveStarted = useRef(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`${apiBase}/approval/token/${token}`);
        if (!res.data.success) throw new Error(res.data.message);
        const data = res.data.data;

        if (mode === 'approve' && data.action_type !== 'approve') {
          throw new Error('This link is not valid for approval');
        }
        if (mode === 'decline' && data.action_type !== 'decline') {
          throw new Error('This link is not valid for decline');
        }

        setExpense(data.expense);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Invalid or expired link');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token, mode]);

  useEffect(() => {
    if (mode === 'approve' && expense && !result && !error && !approveStarted.current) {
      approveStarted.current = true;
      handleApprove();
    }
  }, [mode, expense, result, error]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${apiBase}/approval/approve/${token}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (e) => {
    e.preventDefault();
    if (!declineReason.trim()) {
      setError('Please provide a reason for declining');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${apiBase}/approval/decline/${token}`, {
        reason: declineReason.trim()
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Decline failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (amount) =>
    `₱${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8 bg-gradient-to-r from-erp-blue to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} />
            <div>
              <h1 className="text-xl font-black tracking-tight">NKB Petty Cash</h1>
              <p className="text-sm text-blue-100 font-medium">Liquidation Approval Portal</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="animate-spin text-erp-blue" size={40} />
              <p className="text-sm font-bold text-slate-500">Verifying secure link...</p>
            </div>
          )}

          {!loading && error && !result && (
            <div className="text-center py-6">
              <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
              <h2 className="text-lg font-black text-slate-900 mb-2">Unable to Process</h2>
              <p className="text-sm text-slate-600">{error}</p>
            </div>
          )}

          {!loading && result && (
            <div className="text-center py-6">
              {mode === 'approve' ? (
                <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
              ) : (
                <XCircle className="mx-auto text-rose-500 mb-4" size={48} />
              )}
              <h2 className="text-lg font-black text-slate-900 mb-2">
                {mode === 'approve' ? 'Approval Recorded' : 'Decline Recorded'}
              </h2>
              <p className="text-sm text-slate-600 mb-4">{result.message}</p>
              {result.data?.expense && (
                <div className="bg-slate-50 rounded-2xl p-4 text-left text-sm">
                  <p><strong>Reference:</strong> {result.data.expense.reference_number || `PCV-${result.data.expense.id}`}</p>
                  <p><strong>Status:</strong> {result.data.status}</p>
                </div>
              )}
            </div>
          )}

          {!loading && !result && expense && mode === 'decline' && (
            <form onSubmit={handleDecline} className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2 text-sm">
                <p><strong>Reference:</strong> {expense.reference_number}</p>
                <p><strong>Requester:</strong> {expense.requested_by}</p>
                <p><strong>Department:</strong> {expense.department_name || 'N/A'}</p>
                <p><strong>Category:</strong> {expense.category_name || 'N/A'}</p>
                <p><strong>Amount:</strong> {formatAmount(expense.amount)}</p>
                <p><strong>Remarks:</strong> {expense.remarks || 'None'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Decline Reason (Required)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium h-28 resize-none focus:ring-2 focus:ring-rose-200 outline-none"
                  placeholder="Please explain why this liquidation is being declined..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-rose-600 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !declineReason.trim()}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-rose-700 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Decline'}
              </button>
            </form>
          )}

          {!loading && !result && expense && mode === 'approve' && submitting && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="animate-spin text-emerald-500" size={40} />
              <p className="text-sm font-bold text-slate-500">Processing approval...</p>
            </div>
          )}

          {(result || error) && (
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Go to Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ApprovalAction;
