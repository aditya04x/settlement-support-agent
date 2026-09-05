import { useEffect, useState } from 'react';
import { Search, GitMerge, ShieldCheck, BarChart2, Target, Sparkles, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 'search',    icon: Search,      label: 'Searching Records',         sub: 'Querying payment gateway data' },
  { id: 'correlate', icon: GitMerge,    label: 'Correlating Systems',        sub: 'Linking gateway ↔ bank ↔ ledger' },
  { id: 'verify',    icon: ShieldCheck, label: 'Verifying Records',          sub: 'Checking data integrity' },
  { id: 'determine', icon: BarChart2,   label: 'Determining Status',         sub: 'Applying deterministic rules' },
  { id: 'identify',  icon: Target,      label: 'Identifying Root Cause',     sub: 'Analyzing exception patterns' },
  { id: 'generate',  icon: Sparkles,    label: 'Generating Explanation',     sub: 'Composing AI analysis' },
];

export default function InvestigationProgress() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Advance through steps over ~3s to match real investigation time
    const timings = [300, 600, 900, 1300, 1700, 2100];
    const timers = timings.map((delay, idx) =>
      setTimeout(() => setCurrentStep(idx), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="glass-card p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <div className="absolute inset-1 rounded-full bg-blue-100" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">Investigating Transaction</div>
          <div className="text-xs text-slate-600">Tracing records across all systems…</div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isComplete = idx < currentStep;
          const isActive = idx === currentStep;
          const isPending = idx > currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-300 ${
                isComplete ? 'step-complete' :
                isActive   ? 'step-active animate-step-in' :
                             'step-pending'
              }`}
              style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
            >
              {/* Icon or check */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                isComplete ? 'bg-emerald-500/20' :
                isActive   ? 'bg-blue-500/20' :
                             'bg-slate-100/50'
              }`}>
                {isComplete
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  : <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-600'}`} />
                }
              </div>

              {/* Labels */}
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-semibold ${
                  isComplete ? 'text-emerald-600' :
                  isActive   ? 'text-blue-300' :
                               'text-slate-600'
                }`}>
                  {step.label}
                </div>
                {isActive && (
                  <div className="text-[10px] text-slate-600 mt-0.5 animate-fade-in-fast">
                    {step.sub}
                  </div>
                )}
              </div>

              {/* Active spinner */}
              {isActive && (
                <div className="w-3 h-3 border border-blue-500/40 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span className="text-[10px] text-slate-600">
          All determinations are made by the rules engine, not AI
        </span>
      </div>
    </div>
  );
}
