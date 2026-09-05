import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Clock, XCircle, AlertTriangle, HelpCircle,
  CreditCard, Ban, XOctagon, TrendingUp, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/* ─── Stat card config ────────────────────────────────────────────────────── */
const STAT_ICONS = {
  settled:           { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  delayed:           { icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-100',   border: 'border-amber-200' },
  failed:            { icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-100',     border: 'border-red-200' },
  mismatched:        { icon: AlertTriangle,color: 'text-orange-600',  bg: 'bg-orange-100',  border: 'border-orange-200' },
  unknown:           { icon: HelpCircle,   color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
  payment_failed:    { icon: XOctagon,     color: 'text-red-600',     bg: 'bg-red-100',     border: 'border-red-200' },
  payment_pending:   { icon: CreditCard,   color: 'text-amber-600',   bg: 'bg-amber-100',   border: 'border-amber-200' },
  payment_cancelled: { icon: Ban,          color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
};

/* ─── Animated counter ────────────────────────────────────────────────────── */
function AnimatedValue({ value }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = null;
    const duration = 700;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <span>{display}</span>;
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, type, total }) {
  const config = STAT_ICONS[type] || STAT_ICONS.unknown;
  const Icon = config.icon;
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={`glass-card p-3 border ${config.border} glass-card-hover animate-count-up`}
         style={{ animationFillMode: 'both' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg ${config.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        </div>
        <span className="text-[11px] text-slate-500 font-medium truncate">{label}</span>
      </div>
      <div className={`text-xl font-bold ${config.color}`}>
        <AnimatedValue value={value} />
      </div>
      {pct > 0 && (
        <div className="mt-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${config.bg}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 ml-2 font-medium">{pct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Total transactions card ─────────────────────────────────────────────── */
function TotalCard({ stats }) {
  return (
    <div className="glass-card p-3 border border-blue-200 glass-card-elevated animate-count-up">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-blue-100">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Total</span>
      </div>
      <div className="text-xl font-bold text-slate-800">
        <AnimatedValue value={stats.total_transactions} />
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <TrendingUp className="w-3 h-3 text-emerald-600" />
        <span className="text-[10px] text-emerald-600 font-medium">
          {stats.settlement_rate}% settled
        </span>
        <span className="text-[9px] text-slate-400 ml-1">vs last month</span>
      </div>
    </div>
  );
}

/* ─── Stats chart ─────────────────────────────────────────────────────────── */
function StatsChart({ stats }) {
  if (!stats) return null;

  const data = [
    { name: 'Delayed',   value: stats.delayed,           color: '#f59e0b' },
    { name: 'Settled',   value: stats.settled,           color: '#10b981' },
    { name: 'Mismatch',  value: stats.mismatched,        color: '#f97316' },
    { name: 'Pending',   value: stats.payment_pending,   color: '#d97706' },
    { name: 'Failed',    value: stats.failed + (stats.payment_failed || 0), color: '#ef4444' },
    { name: 'Unknown',   value: stats.unknown,           color: '#64748b' },
  ].filter(d => d.value > 0);

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status Distribution</h3>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barSize={28}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#0f172a',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardView({ stats, statsLoading }) {
  if (statsLoading) {
    return (
      <section aria-label="Dashboard statistics" className="animate-fade-in">
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-3 h-20 skeleton" />
          ))}
        </div>
      </section>
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
    <section aria-label="Dashboard statistics" className="animate-fade-in space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Stat cards */}
        <div className="lg:col-span-9">
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <TotalCard stats={stats} />
            {statRows.map(({ key, label, value }) => (
              <StatCard
                key={key}
                label={label}
                value={value}
                type={key}
                total={stats.total_transactions}
              />
            ))}
          </div>
        </div>
        {/* Chart */}
        <div className="lg:col-span-3">
          <StatsChart stats={stats} />
        </div>
      </div>
      
      {/* Informational Welcome Message */}
      <div className="glass-card p-8 text-center max-w-3xl mx-auto mt-8">
         <h2 className="text-[18px] font-bold text-slate-800 mb-2">Welcome to Settlement Support Agent</h2>
         <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
           Use the sidebar on the left to navigate through the application. You can investigate specific transactions, view overall system health, or check the complete list of available transactions.
         </p>
         <div className="flex flex-wrap justify-center gap-3">
           <span className="px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-medium">
             ✓ Multi-system Tracking
           </span>
           <span className="px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-medium">
             ✓ Deterministic Rules
           </span>
           <span className="px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[11px] font-medium">
             ✓ AI Diagnostics
           </span>
         </div>
      </div>
    </section>
  );
}

// Export for reuse in AnalyticsView
export { StatsChart, TotalCard, StatCard };
