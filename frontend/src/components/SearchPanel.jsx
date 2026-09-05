import { useState, useRef, useEffect } from 'react';
import {
  Search, Calendar, ArrowRight, Zap, X, Filter,
  Copy, Check, ChevronDown
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUCCESS', label: 'Gateway Success' },
  { value: 'FAILED', label: 'Gateway Failed' },
  { value: 'PENDING', label: 'Gateway Pending' },
  { value: 'CANCELLED', label: 'Gateway Cancelled' },
];

const STATUS_COLORS = {
  SETTLED:          'text-emerald-600 border-emerald-500/30 bg-emerald-500/8',
  DELAYED:          'text-amber-400   border-amber-500/30   bg-amber-500/8',
  SETTLEMENT_FAILED:'text-red-400     border-red-500/30     bg-red-500/8',
  PAYMENT_FAILED:   'text-red-400     border-red-500/30     bg-red-500/8',
  LEDGER_MISMATCH:  'text-orange-600  border-orange-300  bg-orange-500/8',
  DATA_MISMATCH:    'text-orange-600  border-orange-300  bg-orange-500/8',
  UNKNOWN:          'text-slate-600   border-slate-400/30   bg-slate-500/15',
  PAYMENT_PENDING:  'text-amber-400   border-amber-500/30   bg-amber-500/8',
  PAYMENT_CANCELLED:'text-slate-600   border-slate-400/30   bg-slate-500/15',
};

const STATUS_DOT = {
  SETTLED:          'bg-emerald-400',
  DELAYED:          'bg-amber-400',
  SETTLEMENT_FAILED:'bg-red-400',
  PAYMENT_FAILED:   'bg-red-400',
  LEDGER_MISMATCH:  'bg-orange-400',
  DATA_MISMATCH:    'bg-orange-400',
  UNKNOWN:          'bg-slate-300',
  PAYMENT_PENDING:  'bg-amber-400',
  PAYMENT_CANCELLED:'bg-slate-300',
};

function CopyButton({ text, size = 'sm' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="btn-ghost !p-1 !rounded-md"
      title="Copy to clipboard"
      aria-label="Copy transaction ID"
    >
      {copied
        ? <Check className="w-3 h-3 text-emerald-600" />
        : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function SearchPanel({ onInvestigate, loading, demoTransactions }) {
  const [transactionId, setTransactionId] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [activeTab, setActiveTab] = useState('id');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'id' && transactionId.trim()) {
      onInvestigate(transactionId.trim());
    } else if (activeTab === 'date' && searchDate) {
      onInvestigate(null, searchDate, statusFilter || null);
    }
  };

  const handleClear = () => {
    setTransactionId('');
    setSearchDate('');
    setStatusFilter('');
    inputRef.current?.focus();
  };

  const handleDemoClick = (txnId) => {
    setTransactionId(txnId);
    setActiveTab('id');
    onInvestigate(txnId);
  };

  const canSubmit = activeTab === 'id' ? transactionId.trim().length > 0 : !!searchDate;
  const hasFilters = statusFilter || searchDate || transactionId;

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Panel Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-blue-100">
          <Search className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-[15px] font-semibold text-slate-800">Investigate Transaction</h2>
      </div>
      <p className="text-[11px] text-slate-500 mb-4 ml-9">Query multi-system payment logs</p>

      {/* Search Mode Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-50/60 rounded-lg p-1">
        <button
          id="tab-id"
          onClick={() => setActiveTab('id')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'id'
              ? 'bg-blue-100 text-blue-600 border border-blue-300'
              : 'text-slate-600 hover:text-slate-600'
          }`}
        >
          Transaction ID
        </button>
        <button
          id="tab-date"
          onClick={() => setActiveTab('date')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'date'
              ? 'bg-blue-100 text-blue-600 border border-blue-300'
              : 'text-slate-600 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-3 h-3" />
          Date Search
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Search Input */}
        {activeTab === 'id' ? (
          <div className="relative">
            <input
              id="transaction-id-input"
              ref={inputRef}
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
              placeholder="e.g. TXN100001"
              className="input-base font-mono pr-9"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
            {transactionId && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-600 transition-colors"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              id="date-search-input"
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="input-base"
              disabled={loading}
            />

            {/* Status filter for date search */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-600 transition-colors"
            >
              <Filter className="w-3 h-3" />
              {showFilters ? 'Hide filters' : 'Add filters'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-base text-sm"
                disabled={loading}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Investigate Button */}
        <button
          id="investigate-button"
          type="submit"
          disabled={loading || !canSubmit}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Investigating…</span>
            </>
          ) : (
            <>
              <span>Investigate Transaction</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Clear all */}
        {hasFilters && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="w-full text-xs text-slate-600 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </form>

      {/* Demo Scenarios */}
      {demoTransactions && demoTransactions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-200/60">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="section-heading">Demo Scenarios</span>
          </div>
          <div className="space-y-1.5">
            {demoTransactions.map((demo) => {
              const dotColor = STATUS_DOT[demo.final_status] || 'bg-slate-300';
              const textColor = STATUS_COLORS[demo.final_status] || STATUS_COLORS.UNKNOWN;
              return (
                <button
                  key={demo.transaction_id}
                  id={`demo-${demo.transaction_id}`}
                  onClick={() => handleDemoClick(demo.transaction_id)}
                  disabled={loading}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-150 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed glass-card-hover ${textColor}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                      <span className="text-[11px] font-medium truncate">
                        {demo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-mono text-[10px] opacity-60">
                        {demo.transaction_id}
                      </span>
                      <CopyButton text={demo.transaction_id} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {demoTransactions.length > 3 && (
            <button className="mt-3 text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
              View All Demo Scenarios
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
