import { StatsChart, TotalCard, StatCard } from './DashboardView';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsView({ stats, statsLoading }) {
  if (statsLoading) {
    return (
      <div className="animate-fade-in p-12 text-center">
        <p className="text-[13px] text-slate-500">Loading analytics...</p>
      </div>
    );
  }

  if (!stats) return null;

  const statRows = [
    { key: 'settled',           label: 'Settled',    value: stats.settled },
    { key: 'delayed',           label: 'Delayed',    value: stats.delayed },
    { key: 'failed',            label: 'Failed',     value: stats.failed },
    { key: 'mismatched',        label: 'Mismatch',   value: stats.mismatched },
    { key: 'payment_pending',   label: 'Pending',    value: stats.payment_pending },
    { key: 'payment_cancelled', label: 'Cancelled',  value: stats.payment_cancelled },
    { key: 'unknown',           label: 'Unknown',    value: stats.unknown },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-blue-100">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-slate-800">Analytics Dashboard</h2>
          <p className="text-[12px] text-slate-500">System-wide transaction metrics and trends</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TotalCard stats={stats} />
        {statRows.slice(0, 3).map(({ key, label, value }) => (
          <StatCard key={key} label={label} value={value} type={key} total={stats.total_transactions} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* We reuse StatsChart but place it in a larger container here */}
          <StatsChart stats={stats} />
        </div>
        
        <div className="glass-card p-5">
          <h3 className="text-[13px] font-bold text-slate-800 mb-4">Other Metrics</h3>
          <div className="space-y-3">
            {statRows.slice(3).map(({ key, label, value }) => {
              const pct = stats.total_transactions > 0 ? Math.round((value / stats.total_transactions) * 100) : 0;
              return (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[12px] font-medium text-slate-600">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-800">{value}</span>
                    <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
