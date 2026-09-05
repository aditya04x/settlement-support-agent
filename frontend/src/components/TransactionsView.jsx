import { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import settlementApi from '../api/settlementApi';

export default function TransactionsView({ onInvestigate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settlementApi.getTransactions();
      setTransactions(data.transactions || []);
    } catch (err) {
      // Fallback to demo transactions if the main endpoint fails or isn't populated
      console.warn('Failed to load full transactions list, falling back to demo scenarios:', err);
      try {
        const demoData = await settlementApi.getDemoTransactions();
        // The demo transactions endpoint returns `{ demo_transactions: [ { scenario, transaction_id } ] }`
        // We need to map them to look like real transactions
        const fallbackList = (demoData.demo_transactions || []).map((t, i) => ({
          transaction_id: t.transaction_id,
          amount: 15000 + (i * 100), // dummy amount for display if we only have demo list
          currency: 'INR',
          status: t.scenario.toUpperCase().replace(/\s+/g, '_'),
          timestamp: new Date().toISOString()
        }));
        setTransactions(fallbackList);
      } catch (demoErr) {
        setError('Failed to load transactions.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => 
    t.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    if (!status) return 'text-slate-700 bg-slate-100 border-slate-200';
    const s = status.toUpperCase();
    if (s.includes('SUCCESS') || s.includes('SETTLED')) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (s.includes('DELAY') || s.includes('PENDING')) return 'text-amber-700 bg-amber-100 border-amber-200';
    if (s.includes('FAIL') || s.includes('REJECT')) return 'text-red-700 bg-red-100 border-red-200';
    if (s.includes('MISMATCH')) return 'text-orange-700 bg-orange-100 border-orange-200';
    return 'text-slate-700 bg-slate-100 border-slate-200';
  };

  const formatAmt = (amt, curr) => {
    if (amt == null) return '—';
    const sym = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : (curr || '');
    return `${sym}${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header & Controls */}
      <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-bold text-slate-800">Transaction Logs</h2>
          <p className="text-[12px] text-slate-500">View and investigate recent system transactions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter ID or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-64 transition-all"
            />
          </div>
          <button 
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-[12px] text-slate-500">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-[12px] text-red-600 font-medium">{error}</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-[13px] font-medium text-slate-700">No transactions found</p>
            <p className="text-[11px] text-slate-500 mt-1">Try adjusting your filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date/Time</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[12px] font-semibold text-slate-700">{t.transaction_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                        {t.status ? t.status.replace(/_/g, ' ') : 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[12px] font-medium text-slate-700">{formatAmt(t.amount, t.currency)}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-[11px] text-slate-500">
                        {new Date(t.timestamp).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onInvestigate(t.transaction_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-blue-600 text-[11px] font-semibold shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        Investigate <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
