import {
  CreditCard, Building2, BookOpen,
  CheckCircle2, Clock, XCircle, AlertTriangle,
  MinusCircle, HelpCircle, ArrowRight, Link2, ChevronDown
} from 'lucide-react';
import { useState } from 'react';

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_DISPLAY = {
  SUCCESS:      { label: 'Success',       icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  SETTLED:      { label: 'Settled',       icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  POSTED:       { label: 'Posted',        icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  PENDING:      { label: 'Pending',       icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  FAILED:       { label: 'Failed',        icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
  REJECTED:     { label: 'Rejected',      icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
  REVERSED:     { label: 'Reversed',      icon: AlertTriangle,color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200' },
  CANCELLED:    { label: 'Cancelled',     icon: MinusCircle,  color: 'text-slate-600',   bg: 'bg-slate-50',    border: 'border-slate-200' },
  NOT_INITIATED:{ label: 'Not Initiated', icon: MinusCircle,  color: 'text-slate-600',   bg: 'bg-slate-50',    border: 'border-slate-200' },
};

const SYSTEM_COLORS = {
  gateway: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', headerBg: 'bg-blue-100' },
  bank:    { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', headerBg: 'bg-purple-100' },
  ledger:  { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-600', headerBg: 'bg-cyan-100' },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatTs(ts) {
  if (!ts) return 'N/A';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
           ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return ts; }
}

function formatAmt(amount, currency) {
  if (amount == null) return 'N/A';
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : (currency || '');
  return `${sym}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/* ─── Evidence Card ──────────────────────────────────────────────────────── */
function EvidenceCard({ title, number, icon: Icon, finding, systemKey, index }) {
  const [expanded, setExpanded] = useState(true);
  const colors = SYSTEM_COLORS[systemKey];

  if (!finding.found) {
    return (
      <div
        className={`evidence-card border-dashed ${colors.border} ${colors.bg} animate-slide-up`}
        style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'both' }}
      >
        <div className={`evidence-card-header ${colors.headerBg}`}>
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${colors.icon}`} />
            <span className="text-[13px] font-semibold text-slate-800">
              {number}. {title}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 py-3 px-3 bg-slate-50 rounded-lg border border-slate-200">
            <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-600">Record not found</div>
              <div className="text-[10px] text-slate-400 mt-0.5">No data received from this system</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConf = STATUS_DISPLAY[finding.status] || STATUS_DISPLAY.PENDING;
  const StatusIcon = statusConf.icon;

  // Determine verification state
  const verificationLabel = finding.found
    ? (finding.status === 'PENDING' ? 'Processing delayed' : 'Record verified')
    : 'Record not found';
  const isVerified = finding.found && finding.status !== 'PENDING' && finding.status !== 'FAILED';

  return (
    <div
      className={`evidence-card ${colors.border} animate-slide-up`}
      style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'both' }}
    >
      {/* Card Header */}
      <div className={`evidence-card-header ${colors.headerBg}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${colors.icon}`} />
            <span className="text-[13px] font-semibold text-slate-800">
              {number}. {title}
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusConf.bg} ${statusConf.color} border ${statusConf.border}`}>
            <StatusIcon className="w-3 h-3" />
            {statusConf.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-2">
        <div className="evidence-field">
          <span className="evidence-label">Amount</span>
          <span className="evidence-value">{formatAmt(finding.amount, finding.currency)}</span>
        </div>
        <div className="evidence-field">
          <span className="evidence-label">Reference</span>
          <span className="evidence-value font-mono text-[11px]">{finding.reference || 'N/A'}</span>
        </div>
        <div className="evidence-field">
          <span className="evidence-label">Timestamp</span>
          <span className="evidence-value text-[11px]">{formatTs(finding.timestamp)}</span>
        </div>

        {/* Verification state */}
        <div className={`flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 ${
          isVerified ? 'text-emerald-600' : finding.status === 'PENDING' ? 'text-amber-600' : 'text-red-600'
        }`}>
          {isVerified ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : finding.status === 'PENDING' ? (
            <Clock className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          <span className="text-[11px] font-medium">{verificationLabel}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Arrow Connector ────────────────────────────────────────────────────── */
function ArrowConnector() {
  return (
    <div className="evidence-arrow">
      <div className="evidence-arrow-line" />
      <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
      <div className="evidence-arrow-line" />
    </div>
  );
}

/* ─── Main Export ─────────────────────────────────────────────────────────── */
export default function EvidenceChain({ investigation }) {
  if (!investigation) return null;

  const gw = investigation.gateway;
  const bk = investigation.bank;
  const ld = investigation.ledger;

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="w-4 h-4 text-blue-600" />
        <h3 className="text-[14px] font-semibold text-slate-800">Evidence Chain</h3>
      </div>
      <p className="text-[11px] text-slate-500 mb-5 ml-6">
        Step-by-step view of how this transaction was analyzed across systems
      </p>

      {/* Evidence Cards */}
      <div className="evidence-chain-grid">
        <EvidenceCard
          title="Payment Gateway"
          number={1}
          icon={CreditCard}
          finding={gw}
          systemKey="gateway"
          index={0}
        />
        <ArrowConnector />
        <EvidenceCard
          title="Bank Settlement"
          number={2}
          icon={Building2}
          finding={bk}
          systemKey="bank"
          index={1}
        />
        <ArrowConnector />
        <EvidenceCard
          title="Internal Ledger"
          number={3}
          icon={BookOpen}
          finding={ld}
          systemKey="ledger"
          index={2}
        />
      </div>
    </div>
  );
}
