import {
  CreditCard, Building2, BookOpen,
  CheckCircle2, Clock, XCircle, AlertTriangle,
  MinusCircle, HelpCircle, ArrowRight
} from 'lucide-react';

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_ICONS = {
  SUCCESS:      { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-300', label: 'Success' },
  SETTLED:      { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-300', label: 'Settled' },
  POSTED:       { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-300', label: 'Posted' },
  PENDING:      { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   label: 'Pending' },
  FAILED:       { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Failed' },
  REJECTED:     { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Rejected' },
  REVERSED:     { icon: AlertTriangle,color: 'text-orange-600',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  label: 'Reversed' },
  CANCELLED:    { icon: MinusCircle,  color: 'text-slate-600',   bg: 'bg-slate-500/15',   border: 'border-slate-400/30',   label: 'Cancelled' },
  NOT_INITIATED:{ icon: MinusCircle,  color: 'text-slate-600',   bg: 'bg-slate-500/15',    border: 'border-slate-400/30',   label: 'Not Initiated' },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatTs(ts) {
  if (!ts) return 'N/A';
  try {
    const d = new Date(ts);
    const date = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} · ${time}`;
  } catch { return ts; }
}

function formatAmt(amount, currency) {
  if (amount == null) return null;
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : (currency || '');
  return `${sym}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/* ─── Missing state ──────────────────────────────────────────────────────── */
function MissingRecord({ title, icon: Icon, systemColor }) {
  return (
    <div className="glass-card p-5 border border-dashed border-slate-300/60 animate-slide-up">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`p-2 rounded-lg ${systemColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-semibold text-slate-600">{title}</h4>
      </div>
      <div className="flex items-center gap-2 py-3 px-3 bg-slate-50/50 rounded-lg border border-slate-200/60">
        <HelpCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <div>
          <div className="text-xs font-medium text-slate-600">Record Not Found</div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            No data received from this system
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Data row ───────────────────────────────────────────────────────────── */
function Row({ label, value, mono, highlight }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-1 ${highlight ? 'field-mismatch mx-0' : ''}`}>
      <span className="text-[11px] text-slate-600 flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-[12px] text-right ${mono ? 'font-mono' : ''} ${highlight ? 'text-orange-600 font-semibold' : 'text-slate-600'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

/* ─── Single system card ──────────────────────────────────────────────────── */
function SystemCard({ title, icon: Icon, finding, systemColor, systemKey, amountMismatch }) {
  if (!finding.found) {
    return <MissingRecord title={title} icon={Icon} systemColor={systemColor} />;
  }

  const conf = STATUS_ICONS[finding.status] || STATUS_ICONS.PENDING;
  const StatusIcon = conf.icon;
  const amtFormatted = formatAmt(finding.amount, finding.currency);

  return (
    <div className="glass-card p-5 animate-slide-up glass-card-hover">
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${systemColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-slate-900 leading-tight">{title}</h4>
          </div>
        </div>
        <span className={`badge ${conf.bg} ${conf.color} border ${conf.border}`}>
          <StatusIcon className="w-3 h-3" />
          {conf.label}
        </span>
      </div>

      {/* Info rows */}
      <div className="space-y-0.5 border-t border-slate-200/50 pt-3">
        {amtFormatted && (
          <Row
            label="Amount"
            value={`${amtFormatted} ${finding.currency || ''}`}
            highlight={amountMismatch}
          />
        )}
        {finding.reference && <Row label="Reference" value={finding.reference} mono />}
        {finding.reason && <Row label="Reason" value={finding.reason} />}
        {finding.failure_code && <Row label="Failure Code" value={finding.failure_code} mono />}
        <Row label="Timestamp" value={formatTs(finding.timestamp)} />
      </div>

      {/* Mismatch warning */}
      {amountMismatch && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-orange-600">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>Amount differs from gateway record</span>
        </div>
      )}
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export default function SystemStatusCard({ investigation }) {
  const gw = investigation.gateway;
  const bk = investigation.bank;
  const ld = investigation.ledger;

  // Detect amount mismatches for visual highlighting
  const gwAmt = gw.found ? gw.amount : null;
  const bkAmt = bk.found ? bk.amount : null;
  const ldAmt = ld.found ? ld.amount : null;

  const bankMismatch  = gwAmt != null && bkAmt != null && Math.abs(gwAmt - bkAmt) > 0.01;
  const ledgerMismatch = gwAmt != null && ldAmt != null && Math.abs(gwAmt - ldAmt) > 0.01;

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="section-heading">System Records</span>
        <div className="flex items-center gap-1 text-[10px] text-slate-600">
          <div className="w-3 h-px bg-slate-300" />
          Gateway
          <ArrowRight className="w-2.5 h-2.5 mx-0.5" />
          Bank
          <ArrowRight className="w-2.5 h-2.5 mx-0.5" />
          Ledger
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SystemCard
          title="Payment Gateway"
          icon={CreditCard}
          finding={gw}
          systemColor="bg-blue-100 text-blue-600"
          systemKey="gateway"
          amountMismatch={false}
        />
        <SystemCard
          title="Bank Settlement"
          icon={Building2}
          finding={bk}
          systemColor="bg-purple-500/10 text-purple-400"
          systemKey="bank"
          amountMismatch={bankMismatch}
        />
        <SystemCard
          title="Internal Ledger"
          icon={BookOpen}
          finding={ld}
          systemColor="bg-cyan-500/10 text-cyan-400"
          systemKey="ledger"
          amountMismatch={ledgerMismatch}
        />
      </div>
    </div>
  );
}
