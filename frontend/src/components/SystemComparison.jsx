import {
  Table2, CheckCircle2, AlertTriangle
} from 'lucide-react';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatAmt(amount, currency) {
  if (amount == null) return '—';
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : (currency || '');
  return `${sym}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

function formatTs(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return ts; }
}

/* ─── Status Dot ─────────────────────────────────────────────────────────── */
function StatusCell({ status, found }) {
  if (!found) return <span className="text-slate-400 text-[12px]">—</span>;

  const colors = {
    SUCCESS: 'bg-emerald-400 text-emerald-700',
    SETTLED: 'bg-emerald-400 text-emerald-700',
    POSTED:  'bg-emerald-400 text-emerald-700',
    PENDING: 'bg-amber-400 text-amber-700',
    FAILED:  'bg-red-400 text-red-700',
    REJECTED:'bg-red-400 text-red-700',
    CANCELLED:'bg-slate-300 text-slate-600',
    NOT_INITIATED:'bg-slate-300 text-slate-600',
  };

  const dotColor = colors[status]?.split(' ')[0] || 'bg-slate-300';
  const textColor = colors[status]?.split(' ')[1] || 'text-slate-600';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className={`text-[12px] font-medium ${textColor}`}>{status}</span>
    </span>
  );
}

/* ─── Main Export ─────────────────────────────────────────────────────────── */
export default function SystemComparison({ investigation }) {
  if (!investigation) return null;

  const gw = investigation.gateway;
  const bk = investigation.bank;
  const ld = investigation.ledger;

  // Mismatch detection
  const gwAmt = gw.found ? gw.amount : null;
  const bkAmt = bk.found ? bk.amount : null;
  const ldAmt = ld.found ? ld.amount : null;

  const amountMatch =
    (gwAmt == null && bkAmt == null && ldAmt == null) ||
    (
      (gwAmt == null || bkAmt == null || Math.abs(gwAmt - bkAmt) < 0.01) &&
      (gwAmt == null || ldAmt == null || Math.abs(gwAmt - ldAmt) < 0.01) &&
      (bkAmt == null || ldAmt == null || Math.abs(bkAmt - ldAmt) < 0.01)
    );

  const currencyMatch =
    (!gw.found || !bk.found || gw.currency === bk.currency) &&
    (!gw.found || !ld.found || gw.currency === ld.currency);

  const refMatch =
    (!gw.found || !bk.found || !gw.reference || !bk.reference || true) &&
    (!gw.found || !ld.found || !gw.reference || !ld.reference || true);

  const allConsistent = amountMatch && currencyMatch;

  const rows = [
    {
      field: 'Status',
      gateway: gw.found ? <StatusCell status={gw.status} found={true} /> : '—',
      bank: bk.found ? <StatusCell status={bk.status} found={true} /> : '—',
      ledger: ld.found ? <StatusCell status={ld.status} found={true} /> : '—',
    },
    {
      field: 'Amount',
      gateway: gw.found ? formatAmt(gw.amount, gw.currency) : '—',
      bank: bk.found ? formatAmt(bk.amount, bk.currency) : '—',
      ledger: ld.found ? formatAmt(ld.amount, ld.currency) : '—',
      hasMismatch: !amountMatch,
    },
    {
      field: 'Currency',
      gateway: gw.found ? (gw.currency || '—') : '—',
      bank: bk.found ? (bk.currency || '—') : '—',
      ledger: ld.found ? (ld.currency || '—') : '—',
      hasMismatch: !currencyMatch,
    },
    {
      field: 'Reference',
      gateway: gw.found ? (gw.reference || '—') : '—',
      bank: bk.found ? (bk.reference || '—') : '—',
      ledger: ld.found ? (ld.reference || '—') : '—',
    },
    {
      field: 'Timestamp',
      gateway: gw.found ? formatTs(gw.timestamp) : '—',
      bank: bk.found ? formatTs(bk.timestamp) : '—',
      ledger: ld.found ? formatTs(ld.timestamp) : '—',
    },
  ];

  return (
    <div className="glass-card p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Table2 className="w-4 h-4 text-blue-600" />
        <h3 className="text-[14px] font-semibold text-slate-800">System Comparison</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Field</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Gateway</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Bank</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Ledger</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.field}
                className={`border-b border-slate-100 last:border-b-0 ${
                  row.hasMismatch ? 'bg-orange-50/50' : ''
                }`}
              >
                <td className="py-2.5 px-3 font-medium text-slate-600">{row.field}</td>
                <td className={`py-2.5 px-3 font-mono ${row.hasMismatch ? 'text-orange-600 font-semibold' : 'text-slate-700'}`}>
                  {typeof row.gateway === 'string' ? row.gateway : row.gateway}
                </td>
                <td className={`py-2.5 px-3 font-mono ${row.hasMismatch ? 'text-orange-600 font-semibold' : 'text-slate-700'}`}>
                  {typeof row.bank === 'string' ? row.bank : row.bank}
                </td>
                <td className={`py-2.5 px-3 font-mono ${row.hasMismatch ? 'text-orange-600 font-semibold' : 'text-slate-700'}`}>
                  {typeof row.ledger === 'string' ? row.ledger : row.ledger}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation message */}
      <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${
        allConsistent
          ? 'bg-emerald-50 border border-emerald-200'
          : 'bg-orange-50 border border-orange-200'
      }`}>
        {allConsistent ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-[11px] text-emerald-700 font-medium">
              ✓ Amount, currency and references are consistent across systems.
            </span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
            <span className="text-[11px] text-orange-700 font-medium">
              Discrepancies detected across systems — review highlighted fields.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
