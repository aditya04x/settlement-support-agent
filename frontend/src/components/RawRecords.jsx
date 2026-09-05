import { useState } from 'react';
import {
  Code, ChevronDown, ChevronUp, Copy, Check,
  CreditCard, Building2, BookOpen, AlertTriangle, HelpCircle
} from 'lucide-react';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatAmt(val) {
  if (val == null) return null;
  return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function CopyJsonButton({ data }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="btn-ghost !py-1 !px-2" title="Copy JSON">
      {copied
        ? <><Check className="w-3 h-3 text-emerald-600" /><span className="text-emerald-600">Copied</span></>
        : <><Copy className="w-3 h-3" /><span>Copy JSON</span></>}
    </button>
  );
}

/* ─── Missing record display ─────────────────────────────────────────────── */
function MissingRecord({ title }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-300/60">
      <HelpCircle className="w-5 h-5 text-slate-600 flex-shrink-0" />
      <div>
        <div className="text-sm font-semibold text-slate-600">{title} — Record Not Found</div>
        <div className="text-xs text-slate-600 mt-0.5">
          No record was received from this system for this transaction
        </div>
      </div>
    </div>
  );
}

/* ─── Field comparison row ───────────────────────────────────────────────── */
function FieldRow({ label, values, hasMismatch }) {
  return (
    <div className={`grid grid-cols-[140px_1fr] gap-3 py-1.5 ${
      hasMismatch ? 'bg-orange-500/5 rounded px-2 -mx-2' : ''
    }`}>
      <span className="text-[11px] text-slate-600 font-medium self-start pt-0.5">{label}</span>
      <div className="flex gap-2 flex-wrap">
        {values.map(({ system, value, isMismatch }, i) => (
          <div key={i} className={`inline-flex items-center gap-1.5 text-[11px] rounded px-1.5 py-0.5 ${
            isMismatch
              ? 'bg-orange-500/10 border border-orange-500/25 text-orange-600'
              : 'text-slate-600'
          }`}>
            <span className="text-[9px] uppercase font-bold text-slate-600">{system}</span>
            <span className="font-mono">{value ?? '—'}</span>
            {isMismatch && <AlertTriangle className="w-2.5 h-2.5 text-orange-600" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comparison view ────────────────────────────────────────────────────── */
function ComparisonView({ investigation }) {
  const gw = investigation.gateway;
  const bk = investigation.bank;
  const ld = investigation.ledger;

  const gwR = gw.raw_record;
  const bkR = bk.raw_record;
  const ldR = ld.raw_record;

  // Amount comparison
  const amounts = [
    gw.found && { system: 'GW',  value: formatAmt(gw.amount),  isMismatch: false },
    bk.found && { system: 'Bank', value: formatAmt(bk.amount),  isMismatch: gw.found && bk.found && Math.abs(gw.amount - bk.amount) > 0.01 },
    ld.found && { system: 'Ledger', value: formatAmt(ld.amount), isMismatch: gw.found && ld.found && Math.abs(gw.amount - ld.amount) > 0.01 },
  ].filter(Boolean);

  const hasAmtMismatch = amounts.some(a => a.isMismatch);

  // Currency comparison
  const currencies = [
    gw.found && { system: 'GW',    value: gw.currency, isMismatch: false },
    bk.found && { system: 'Bank',  value: bk.currency, isMismatch: gw.found && bk.found && gw.currency !== bk.currency },
    ld.found && { system: 'Ledger',value: ld.currency, isMismatch: gw.found && ld.found && gw.currency !== ld.currency },
  ].filter(Boolean);

  const hasCurrMismatch = currencies.some(c => c.isMismatch);

  // Status comparison
  const statuses = [
    gw.found && { system: 'GW',    value: gw.status || gwR?.gateway_status, isMismatch: false },
    bk.found && { system: 'Bank',  value: bk.status || bkR?.settlement_status, isMismatch: false },
    ld.found && { system: 'Ledger',value: ld.status || ldR?.ledger_status, isMismatch: false },
  ].filter(Boolean);

  return (
    <div className="space-y-0">
      {(hasAmtMismatch || hasCurrMismatch) && (
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-orange-500/8 rounded-lg border border-orange-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
          <span className="text-[11px] text-orange-600 font-medium">
            Cross-system discrepancies detected — highlighted below
          </span>
        </div>
      )}

      <div className="space-y-0 bg-slate-50/40 rounded-lg p-3 border border-slate-200/50">
        <FieldRow label="Amount" values={amounts} hasMismatch={hasAmtMismatch} />
        <FieldRow label="Currency" values={currencies} hasMismatch={hasCurrMismatch} />
        <FieldRow label="Status" values={statuses} hasMismatch={false} />
      </div>
    </div>
  );
}

/* ─── Raw JSON panel ─────────────────────────────────────────────────────── */
function RawPanel({ title, icon: Icon, iconColor, record, found }) {
  const [tab, setTab] = useState('pretty');

  if (!found) {
    return <MissingRecord title={title} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          <span className="text-[12px] font-semibold text-slate-600">{title}</span>
        </div>
        <CopyJsonButton data={record} />
      </div>
      <pre className="text-[11px] text-slate-600 font-mono overflow-x-auto bg-slate-100/60 p-3 rounded-lg border border-slate-200/50 whitespace-pre-wrap break-all leading-relaxed max-h-52 overflow-y-auto">
        {JSON.stringify(record, null, 2)}
      </pre>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export default function RawRecords({ investigation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('comparison');

  const tabs = [
    { id: 'comparison', label: 'Field Comparison' },
    { id: 'gateway',    label: 'Gateway' },
    { id: 'bank',       label: 'Bank' },
    { id: 'ledger',     label: 'Ledger' },
  ];

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      {/* Toggle button */}
      <button
        id="raw-records-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-100/30 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-slate-600 group-hover:text-slate-600 transition-colors" />
          <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-600 transition-colors">
            View Source Records
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100/60 text-slate-600 font-mono">
            RAW DATA
          </span>
        </div>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-slate-600" />
          : <ChevronDown className="w-4 h-4 text-slate-600" />}
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-200/50 animate-fade-in-fast">
          {/* Tab bar */}
          <div className="flex gap-1 mt-4 mb-4 bg-slate-50/60 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-300/60 text-slate-800'
                    : 'text-slate-600 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'comparison' && (
            <ComparisonView investigation={investigation} />
          )}
          {activeTab === 'gateway' && (
            <RawPanel
              title="Payment Gateway Record"
              icon={CreditCard}
              iconColor="text-blue-600"
              record={investigation.gateway.raw_record}
              found={investigation.gateway.found}
            />
          )}
          {activeTab === 'bank' && (
            <RawPanel
              title="Bank Settlement Record"
              icon={Building2}
              iconColor="text-purple-400"
              record={investigation.bank.raw_record}
              found={investigation.bank.found}
            />
          )}
          {activeTab === 'ledger' && (
            <RawPanel
              title="Internal Ledger Record"
              icon={BookOpen}
              iconColor="text-cyan-400"
              record={investigation.ledger.raw_record}
              found={investigation.ledger.found}
            />
          )}
        </div>
      )}
    </div>
  );
}
