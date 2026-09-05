import { Target } from 'lucide-react';

export default function RootCauseCard({ rootCause, finalStatus }) {
  if (!rootCause) return null;

  const statusMessages = {
    SETTLED: { color: 'border-emerald-500/30 bg-emerald-500/5', icon: '✓', label: 'Resolved' },
    DELAYED: { color: 'border-amber-500/30 bg-amber-500/5', icon: '⏳', label: 'Pending Resolution' },
    PAYMENT_FAILED: { color: 'border-red-500/30 bg-red-500/5', icon: '✗', label: 'Failed' },
    SETTLEMENT_FAILED: { color: 'border-red-500/30 bg-red-500/5', icon: '✗', label: 'Failed' },
    LEDGER_MISMATCH: { color: 'border-orange-300 bg-orange-500/5', icon: '⚠', label: 'Mismatch' },
    DATA_MISMATCH: { color: 'border-orange-300 bg-orange-500/5', icon: '⚠', label: 'Mismatch' },
    UNKNOWN: { color: 'border-slate-400/30 bg-slate-500/15', icon: '?', label: 'Unknown' },
  };

  const config = statusMessages[finalStatus] || statusMessages.UNKNOWN;

  return (
    <div className={`glass-card p-5 border ${config.color} animate-slide-up`}>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
          Root Cause
        </h3>
      </div>
      <p className="text-sm text-slate-800 leading-relaxed">{rootCause}</p>
    </div>
  );
}
