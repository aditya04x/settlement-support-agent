import { useState } from 'react';
import {
  Hash, IndianRupee, ShieldCheck, Target, BarChart3,
  Store, Copy, Check, AlertTriangle, Share2, Clock
} from 'lucide-react';

const STATUS_CONFIG = {
  SETTLED:          { label: 'Settled',          badge: 'badge-success',  glow: 'glow-success', dot: 'bg-emerald-400' },
  DELAYED:          { label: 'Delayed',           badge: 'badge-warning',  glow: 'glow-warning', dot: 'bg-amber-400' },
  PAYMENT_FAILED:   { label: 'Payment Failed',    badge: 'badge-danger',   glow: 'glow-danger',  dot: 'bg-red-400' },
  SETTLEMENT_FAILED:{ label: 'Settlement Failed', badge: 'badge-danger',   glow: 'glow-danger',  dot: 'bg-red-400' },
  LEDGER_MISMATCH:  { label: 'Ledger Mismatch',  badge: 'badge-mismatch', glow: '',             dot: 'bg-orange-400' },
  DATA_MISMATCH:    { label: 'Data Mismatch',     badge: 'badge-mismatch', glow: '',             dot: 'bg-orange-400' },
  UNKNOWN:          { label: 'Unknown',           badge: 'badge-neutral',  glow: '',             dot: 'bg-slate-300' },
  NOT_FOUND:        { label: 'Not Found',         badge: 'badge-neutral',  glow: '',             dot: 'bg-slate-300' },
  PAYMENT_PENDING:  { label: 'Payment Pending',   badge: 'badge-warning',  glow: 'glow-warning', dot: 'bg-amber-400' },
  PAYMENT_CANCELLED:{ label: 'Cancelled',         badge: 'badge-neutral',  glow: '',             dot: 'bg-slate-300' },
};

const CONFIDENCE_MAP = {
  HIGH:   { label: 'High',   pct: 92, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  MEDIUM: { label: 'Medium', pct: 65, color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-200',   bar: 'bg-amber-500' },
  LOW:    { label: 'Low',    pct: 35, color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-200',     bar: 'bg-red-500' },
};

function formatAmount(amount, currency) {
  if (amount == null) return 'N/A';
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : (currency || '');
  return `${sym}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="btn-ghost !p-1 !rounded-md ml-1"
      title="Copy to clipboard"
      aria-label="Copy"
    >
      {copied
        ? <Check className="w-3 h-3 text-emerald-600" />
        : <Copy className="w-3 h-3 text-slate-500" />}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <div className="section-heading">{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function TransactionSummary({ investigation }) {
  const [shared, setShared] = useState(false);
  const status = STATUS_CONFIG[investigation.final_status] || STATUS_CONFIG.UNKNOWN;
  const confidence = CONFIDENCE_MAP[investigation.confidence] || CONFIDENCE_MAP.LOW;

  const handleShare = async () => {
    const summary = `Transaction: ${investigation.transaction_id}\nAmount: ${formatAmount(investigation.amount, investigation.currency)}\nStatus: ${status.label}\nRoot Cause: ${investigation.root_cause || 'N/A'}\nConfidence: ${confidence.pct}%`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Transaction ${investigation.transaction_id}`, text: summary });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(summary).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const investigatedAt = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  return (
    <div className={`glass-card p-5 animate-slide-up ${status.glow}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.dot} animate-pulse-slow`} />
          <span className="text-[14px] font-semibold text-slate-800">Transaction Summary</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Investigated at: {investigatedAt}
          </span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 border border-slate-200 hover:border-blue-200"
          >
            {shared ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
            {shared ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
        {/* Transaction ID */}
        <Field label="Transaction ID">
          <div className="flex items-center gap-0.5">
            <span className="font-mono text-[13px] font-bold text-slate-800">
              {investigation.transaction_id}
            </span>
            <CopyButton text={investigation.transaction_id} />
          </div>
        </Field>

        {/* Amount */}
        <Field label="Amount">
          <div>
            <span className="text-[15px] font-bold text-slate-800">
              {formatAmount(investigation.amount, investigation.currency)}
            </span>
            {investigation.currency && (
              <span className="text-[11px] text-slate-500 ml-1">{investigation.currency}</span>
            )}
          </div>
        </Field>

        {/* Overall Status */}
        <Field label="Status">
          <span className={`badge ${status.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </Field>

        {/* Root Cause */}
        <Field label="Root Cause">
          <span className="text-[13px] font-semibold text-slate-700">
            {investigation.root_cause || 'N/A'}
          </span>
        </Field>

        {/* Investigation Confidence */}
        <Field label="Confidence">
          <div className="flex items-center gap-2">
            <span className={`text-[22px] font-bold ${confidence.color}`}>
              {confidence.pct}%
            </span>
          </div>
        </Field>
      </div>
    </div>
  );
}
