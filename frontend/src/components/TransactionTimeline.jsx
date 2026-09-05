import { CreditCard, Building2, BookOpen, Clock } from 'lucide-react';

/* ─── Color maps ─────────────────────────────────────────────────────────── */
const SYSTEM_CONFIG = {
  gateway: {
    label: 'Gateway',
    Icon: CreditCard,
    dot: 'bg-blue-500',
    line: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-600',
  },
  bank: {
    label: 'Bank',
    Icon: Building2,
    dot: 'bg-purple-500',
    line: 'border-purple-500/20',
    badge: 'bg-purple-500/10 text-purple-400',
  },
  ledger: {
    label: 'Ledger',
    Icon: BookOpen,
    dot: 'bg-cyan-500',
    line: 'border-cyan-500/20',
    badge: 'bg-cyan-500/10 text-cyan-400',
  },
};

const STATUS_DOT = {
  SUCCESS:      'bg-emerald-400',
  SETTLED:      'bg-emerald-400',
  POSTED:       'bg-emerald-400',
  PENDING:      'bg-amber-400',
  FAILED:       'bg-red-400',
  REJECTED:     'bg-red-400',
  REVERSED:     'bg-orange-400',
  CANCELLED:    'bg-slate-300',
  NOT_INITIATED:'bg-slate-300',
};

const STATUS_TEXT = {
  SUCCESS:       { color: 'text-emerald-600', label: 'Success' },
  SETTLED:       { color: 'text-emerald-600', label: 'Settled' },
  POSTED:        { color: 'text-emerald-600', label: 'Posted' },
  PENDING:       { color: 'text-amber-400',   label: 'Pending' },
  FAILED:        { color: 'text-red-400',     label: 'Failed' },
  REJECTED:      { color: 'text-red-400',     label: 'Rejected' },
  REVERSED:      { color: 'text-orange-600',  label: 'Reversed' },
  CANCELLED:     { color: 'text-slate-600',   label: 'Cancelled' },
  NOT_INITIATED: { color: 'text-slate-600',   label: 'Not Initiated' },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatTs(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return ts; }
}

function formatDate(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

/* ─── Timeline Event ─────────────────────────────────────────────────────── */
function TimelineEvent({ event, index, total }) {
  const sys = SYSTEM_CONFIG[event.system] || SYSTEM_CONFIG.gateway;
  const dotColor = STATUS_DOT[event.status] || 'bg-slate-300';
  const statusText = STATUS_TEXT[event.status] || { color: 'text-slate-600', label: event.status };
  const isLast = index === total - 1;

  return (
    <div
      className="relative flex gap-4 animate-step-in"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div className={`relative w-3.5 h-3.5 rounded-full flex-shrink-0 ${dotColor} ring-2 ring-slate-950 z-10 mt-1`} />
        {/* Connector */}
        {!isLast && (
          <div className="w-px flex-1 bg-slate-100 mt-1 mb-0 min-h-[20px]" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 pb-4 ${isLast ? 'pb-0' : ''}`}>
        {/* Time + system */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {event.timestamp && (
            <>
              <span className="text-[10px] text-slate-600 font-mono">{formatDate(event.timestamp)}</span>
              <span className="text-[10px] text-slate-600 font-mono font-semibold">{formatTs(event.timestamp)}</span>
            </>
          )}
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${sys.badge}`}>
            {sys.label}
          </span>
          <span className={`text-[9px] font-semibold uppercase tracking-wider ${statusText.color}`}>
            {statusText.label}
          </span>
        </div>

        {/* Event description */}
        <p className="text-[13px] text-slate-600 leading-snug">{event.event}</p>
      </div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export default function TransactionTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="glass-card p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-4 h-4 text-blue-600" />
        <h3 className="section-heading">Transaction Timeline</h3>
        <span className="ml-auto text-[10px] text-slate-600">{timeline.length} events</span>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4 pb-3 border-b border-slate-200/50 flex-wrap">
        {Object.entries(SYSTEM_CONFIG).map(([key, sys]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${sys.dot}`} />
            <span className="text-[10px] text-slate-600">{sys.label}</span>
          </div>
        ))}
      </div>

      {/* Events */}
      <div>
        {timeline.map((event, idx) => (
          <TimelineEvent
            key={idx}
            event={event}
            index={idx}
            total={timeline.length}
          />
        ))}
      </div>
    </div>
  );
}
