import { History, ChevronRight, CheckCircle2, Clock, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

const STATUS_CONFIG = {
  SETTLED:           { label: 'Settled',            dot: 'bg-emerald-400', text: 'text-emerald-600' },
  DELAYED:           { label: 'Delayed',             dot: 'bg-amber-400',   text: 'text-amber-400' },
  PAYMENT_FAILED:    { label: 'Pmt. Failed',         dot: 'bg-red-400',     text: 'text-red-400' },
  SETTLEMENT_FAILED: { label: 'Sttl. Failed',        dot: 'bg-red-400',     text: 'text-red-400' },
  LEDGER_MISMATCH:   { label: 'Ledger Mismatch',     dot: 'bg-orange-400',  text: 'text-orange-600' },
  DATA_MISMATCH:     { label: 'Data Mismatch',        dot: 'bg-orange-400',  text: 'text-orange-600' },
  UNKNOWN:           { label: 'Unknown',              dot: 'bg-slate-300',   text: 'text-slate-600' },
  PAYMENT_PENDING:   { label: 'Pending',              dot: 'bg-amber-400',   text: 'text-amber-400' },
  PAYMENT_CANCELLED: { label: 'Cancelled',            dot: 'bg-slate-300',   text: 'text-slate-600' },
};

function formatTime(ts) {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `${diffH}h ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function formatAmt(amount, currency) {
  if (amount == null) return null;
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : (currency || '');
  return `${sym}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function InvestigationHistory({ history, onReInvestigate, loading }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="glass-card p-5 animate-slide-in-left">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-slate-600" />
        <h3 className="section-heading">Recent Investigations</h3>
        <span className="ml-auto text-[10px] text-slate-600">{history.length} this session</span>
      </div>

      <div className="space-y-1">
        {history.map((item, idx) => {
          const conf = STATUS_CONFIG[item.final_status] || STATUS_CONFIG.UNKNOWN;
          const amt = formatAmt(item.amount, item.currency);

          return (
            <button
              key={`${item.transaction_id}-${idx}`}
              onClick={() => !loading && onReInvestigate(item.transaction_id)}
              disabled={loading}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100/50 transition-all group disabled:opacity-50 animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-2.5">
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${conf.dot}`} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[12px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                      {item.transaction_id}
                    </span>
                    {amt && (
                      <span className="text-[10px] text-slate-600">{amt}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold ${conf.text}`}>{conf.label}</span>
                    <span className="text-[10px] text-slate-600">{formatTime(item.investigatedAt)}</span>
                  </div>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
