import { AlertTriangle, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';

const SEVERITY_CONFIG = {
  HIGH:   {
    icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/20',
    label: 'HIGH',
    labelColor: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
  MEDIUM: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/20',
    label: 'MED',
    labelColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  LOW:    {
    icon: AlertCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-500/8',
    border: 'border-blue-300',
    label: 'LOW',
    labelColor: 'text-blue-600 bg-blue-100 border-blue-300',
  },
  INFO:   {
    icon: Info,
    color: 'text-slate-600',
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/30',
    label: 'INFO',
    labelColor: 'text-slate-600 bg-slate-500/15 border-slate-400/30',
  },
};

function ExceptionItem({ exc, index }) {
  const config = SEVERITY_CONFIG[exc.severity] || SEVERITY_CONFIG.INFO;
  const Icon = config.icon;
  const isHigh = exc.severity === 'HIGH';

  return (
    <div
      className={`p-3.5 rounded-lg border transition-all duration-200 ${config.border} ${config.bg} ${
        isHigh ? 'animate-step-in' : 'animate-fade-in'
      }`}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color} ${isHigh ? 'animate-pulse-slow' : ''}`} />
        <div className="min-w-0 flex-1">
          {/* Message + severity badge */}
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <span className={`text-[12px] font-semibold ${config.color} leading-snug flex-1`}>
              {exc.message}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border flex-shrink-0 ${config.labelColor}`}>
              {config.label}
            </span>
          </div>

          {/* Code chip */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-slate-600 bg-slate-50/60 px-1.5 py-0.5 rounded">
              {exc.code}
            </span>
          </div>

          {/* Impact */}
          <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
            <span className="font-medium text-slate-600">Impact: </span>
            {exc.impact}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ExceptionList({ exceptions }) {
  const highCount = exceptions?.filter(e => e.severity === 'HIGH').length || 0;
  const total = exceptions?.length || 0;

  return (
    <div className="glass-card p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="section-heading">Exceptions & Uncertainty</h3>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-1.5">
            {highCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                {highCount} HIGH
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-500/15 text-slate-600 border border-slate-400/30">
              {total} total
            </span>
          </div>
        )}
      </div>

      {(!exceptions || exceptions.length === 0) ? (
        <div className="flex items-center gap-2.5 py-4 px-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-emerald-600">No exceptions detected</div>
            <div className="text-[11px] text-slate-600 mt-0.5">All cross-system checks passed</div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {exceptions.map((exc, idx) => (
            <ExceptionItem key={idx} exc={exc} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
