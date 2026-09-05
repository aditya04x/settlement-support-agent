import { BarChart3, WifiOff, AlertOctagon, RefreshCw, SearchX, AlertTriangle } from 'lucide-react';
import SearchPanel           from './SearchPanel';
import TransactionSummary    from './TransactionSummary';
import TransactionTimeline   from './TransactionTimeline';
import ExplanationCard       from './ExplanationCard';
import ExceptionList         from './ExceptionList';
import RawRecords            from './RawRecords';
import InvestigationProgress from './InvestigationProgress';
import InvestigationHistory  from './InvestigationHistory';
import LoadingState          from './LoadingState';
import EvidenceChain         from './EvidenceChain';
import SystemComparison      from './SystemComparison';
import RootCauseRecommendation from './RootCauseRecommendation';

/* ─── Error state ─────────────────────────────────────────────────────────── */
function ErrorState({ error, onRetry }) {
  const isNotFound = error?.toLowerCase().includes('not found');
  const isNetwork  = error?.toLowerCase().includes('failed to fetch') || error?.toLowerCase().includes('network');
  const isInvalid  = error?.toLowerCase().includes('invalid');

  let Icon = AlertOctagon;
  let title = 'Investigation Error';
  let hint = error;
  let color = 'red';

  if (isNotFound) {
    Icon = SearchX;
    title = 'Transaction Not Found';
    hint = 'No records were found across gateway, bank, or ledger systems for this transaction ID. Please verify the ID is correct.';
    color = 'slate';
  } else if (isNetwork) {
    Icon = WifiOff;
    title = 'Backend Unavailable';
    hint = 'Cannot connect to the settlement API. Make sure the backend server is running on port 8000.';
    color = 'amber';
  } else if (isInvalid) {
    Icon = AlertTriangle;
    title = 'Invalid Transaction ID';
    hint = 'Transaction IDs must contain only letters, numbers, underscores or hyphens (e.g. TXN100001).';
    color = 'amber';
  }

  const colors = {
    red:   { border: 'border-red-200',   bg: 'bg-red-50',   icon: 'text-red-500',   btn: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' },
    amber: { border: 'border-amber-200', bg: 'bg-amber-50', icon: 'text-amber-500', btn: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200' },
    slate: { border: 'border-slate-200', bg: 'bg-slate-50', icon: 'text-slate-500', btn: 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200' },
  };
  const c = colors[color];

  return (
    <div className={`glass-card p-6 border ${c.border} ${c.bg} animate-fade-in`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-[14px] font-semibold mb-1 ${c.icon}`}>{title}</h3>
          <p className="text-[13px] text-slate-600 leading-relaxed">{hint}</p>
          {onRetry && !isNotFound && (
            <button
              onClick={onRetry}
              className={`mt-3 flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${c.btn}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty / ready state ─────────────────────────────────────────────────── */
function ReadyState() {
  return (
    <div className="glass-card p-12 text-center animate-fade-in">
      <div className="inline-flex p-4 rounded-2xl bg-blue-50 border border-blue-200 mb-5">
        <BarChart3 className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-800 mb-2">
        Ready to Investigate
      </h3>
      <p className="text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed">
        Enter a transaction ID or select a demo scenario to trace payment records
        across gateway, bank, and ledger systems.
      </p>
      <div className="mt-6 flex justify-center gap-3 flex-wrap">
        {[
          { label: 'Deterministic Rules Engine', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
          { label: 'Anti-Hallucination AI',      color: 'text-violet-600 bg-violet-50 border-violet-200' },
          { label: 'Multi-System Correlation',   color: 'text-blue-600 bg-blue-50 border-blue-200' },
        ].map(({ label, color }) => (
          <span key={label} className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${color}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function InvestigateView({
  loading,
  error,
  result,
  demoTransactions,
  history,
  handleInvestigate,
  handleRetry
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
      {/* ── Left sidebar: Search + History ── */}
      <div className="lg:col-span-4 space-y-4">
        <div className="sticky top-[72px] space-y-4">
          <SearchPanel
            onInvestigate={handleInvestigate}
            loading={loading}
            demoTransactions={demoTransactions}
          />
          <InvestigationHistory
            history={history}
            onReInvestigate={handleInvestigate}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Right: Results ── */}
      <div className="lg:col-span-8">
        {/* Initial / ready state */}
        {!loading && !result && !error && <ReadyState />}

        {/* Loading: show investigation pipeline animation */}
        {loading && (
          <div className="space-y-4">
            <InvestigationProgress />
            <LoadingState />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <ErrorState error={error} onRetry={handleRetry} />
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">
            <TransactionSummary investigation={result.investigation} />
            <EvidenceChain investigation={result.investigation} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TransactionTimeline timeline={result.timeline} />
              <SystemComparison investigation={result.investigation} />
            </div>

            <RootCauseRecommendation
              investigation={result.investigation}
              explanation={result.explanation}
            />

            <ExceptionList exceptions={result.investigation.exceptions} />
            <ExplanationCard explanation={result.explanation} />
            <RawRecords investigation={result.investigation} />
          </div>
        )}
      </div>
    </div>
  );
}
