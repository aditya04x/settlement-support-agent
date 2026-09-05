import { Target, Lightbulb, AlertTriangle } from 'lucide-react';

const CONFIDENCE_CONFIG = {
  HIGH:   { label: 'HIGH',   color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  MEDIUM: { label: 'MEDIUM', color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-200' },
  LOW:    { label: 'LOW',    color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-200' },
};

const ROOT_CAUSE_DESCRIPTIONS = {
  BANK_PROCESSING_DELAY: 'Payment successful but bank settlement is still pending.',
  SUCCESSFUL_SETTLEMENT: 'Transaction processed successfully across all systems.',
  GATEWAY_PAYMENT_FAILED: 'The payment gateway reported a failure for this transaction.',
  MISSING_BANK_RECORD: 'No settlement record found in the bank system.',
  MISSING_LEDGER_RECORD: 'The internal ledger has no record of this transaction.',
  AMOUNT_MISMATCH: 'The transaction amounts do not match across systems.',
  REFERENCE_MISMATCH: 'Transaction references differ between systems.',
  PAYMENT_CANCELLED: 'The payment was cancelled before settlement.',
  PAYMENT_PENDING: 'The payment is still being processed by the gateway.',
  UNKNOWN: 'Unable to determine the exact root cause.',
};

const RECOMMENDED_ACTIONS = {
  BANK_PROCESSING_DELAY: 'Monitor the settlement status and escalate if it remains pending beyond the expected SLA.',
  SUCCESSFUL_SETTLEMENT: 'No action required. Transaction has been fully settled.',
  GATEWAY_PAYMENT_FAILED: 'Contact the payment gateway to understand the failure reason. Consider retrying the transaction.',
  MISSING_BANK_RECORD: 'Escalate to the bank operations team to trace the missing settlement record.',
  MISSING_LEDGER_RECORD: 'Investigate why the ledger entry was not created and reconcile manually if needed.',
  AMOUNT_MISMATCH: 'Initiate a reconciliation review to identify the source of the discrepancy.',
  REFERENCE_MISMATCH: 'Verify the reference mapping between systems and correct any data entry errors.',
  PAYMENT_CANCELLED: 'Review the cancellation reason and process a refund if applicable.',
  PAYMENT_PENDING: 'Wait for the gateway to complete processing. Escalate if it exceeds normal processing time.',
  UNKNOWN: 'Conduct a manual review of all system records for this transaction.',
};

function getRootCauseKey(rootCause) {
  if (!rootCause) return 'UNKNOWN';
  const normalized = rootCause.toUpperCase().replace(/[\s-]+/g, '_');
  // Try exact match first
  if (ROOT_CAUSE_DESCRIPTIONS[normalized]) return normalized;
  // Fuzzy match
  if (normalized.includes('DELAY') || normalized.includes('PENDING')) return 'BANK_PROCESSING_DELAY';
  if (normalized.includes('SUCCESS') || normalized.includes('SETTLED')) return 'SUCCESSFUL_SETTLEMENT';
  if (normalized.includes('GATEWAY') && normalized.includes('FAIL')) return 'GATEWAY_PAYMENT_FAILED';
  if (normalized.includes('BANK') && (normalized.includes('MISS') || normalized.includes('NOT_FOUND'))) return 'MISSING_BANK_RECORD';
  if (normalized.includes('LEDGER') && (normalized.includes('MISS') || normalized.includes('NOT_FOUND'))) return 'MISSING_LEDGER_RECORD';
  if (normalized.includes('AMOUNT') && normalized.includes('MISMATCH')) return 'AMOUNT_MISMATCH';
  if (normalized.includes('CANCEL')) return 'PAYMENT_CANCELLED';
  if (normalized.includes('MISMATCH')) return 'REFERENCE_MISMATCH';
  return 'UNKNOWN';
}

export default function RootCauseRecommendation({ investigation, explanation }) {
  if (!investigation) return null;

  const rootCause = investigation.root_cause;
  const confidence = investigation.confidence || 'MEDIUM';
  const confConfig = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.MEDIUM;
  const rcKey = getRootCauseKey(rootCause);

  // Prefer explanation data if available, fallback to deterministic mapping
  const rootCauseDesc = explanation?.root_cause_explanation || ROOT_CAUSE_DESCRIPTIONS[rcKey] || 'Unable to determine root cause.';
  const recommendedAction = explanation?.recommended_action || RECOMMENDED_ACTIONS[rcKey] || 'Conduct a manual review.';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
      {/* Root Cause Card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-red-50">
            <Target className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-800">Root Cause</h3>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[13px] font-bold text-slate-800">
            {rootCause || 'Unknown'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confConfig.bg} ${confConfig.color} ${confConfig.border}`}>
            {confConfig.label}
          </span>
        </div>

        <p className="text-[12px] text-slate-600 leading-relaxed">
          {rootCauseDesc}
        </p>
      </div>

      {/* Recommended Action Card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-amber-50">
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-800">Recommended Action</h3>
        </div>

        <p className="text-[12px] text-slate-600 leading-relaxed">
          {recommendedAction}
        </p>
      </div>
    </div>
  );
}
