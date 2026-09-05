import { Activity, Server, Database, BrainCircuit, CheckCircle2, XCircle } from 'lucide-react';

export default function SystemHealthView({ health }) {
  const isHealthy = health?.data_loaded === true;

  const systems = [
    { name: 'Payment Gateway', icon: Server, status: isHealthy ? 'Operational' : 'Degraded' },
    { name: 'Bank Settlement', icon: Database, status: isHealthy ? 'Operational' : 'Degraded' },
    { name: 'Internal Ledger', icon: Server, status: isHealthy ? 'Operational' : 'Degraded' },
    { name: 'Rules Engine', icon: BrainCircuit, status: isHealthy ? 'Operational' : 'Degraded' },
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-blue-100">
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-slate-800">System Health</h2>
          <p className="text-[12px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Simulated Status (Demo Environment)
          </p>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-800">Overall Status</h3>
            <p className="text-[11px] text-slate-500">Last checked: Just now</p>
          </div>
          <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 text-[12px] font-bold ${
            isHealthy ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isHealthy ? 'All Systems Operational' : 'Systems Degraded'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systems.map((sys, idx) => {
            const Icon = sys.icon;
            const ok = sys.status === 'Operational';
            return (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-700">{sys.name}</span>
                </div>
                <span className={`text-[11px] font-bold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
                  {sys.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Information Alert */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-3">
        <Activity className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[13px] font-semibold text-blue-800 mb-1">About System Health</h4>
          <p className="text-[12px] text-blue-600/80 leading-relaxed">
            This dashboard simulates real-time monitoring of connected financial systems. In a production environment, this would display live uptime, latency, and webhook delivery success rates across gateway and banking partners.
          </p>
        </div>
      </div>
    </div>
  );
}
