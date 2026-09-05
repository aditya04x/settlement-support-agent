import {
  Bot, ShieldCheck, Lightbulb, MessageSquare,
  AlertCircle, User, FlaskConical, CheckCircle2
} from 'lucide-react';

/* ─── Section component ──────────────────────────────────────────────────── */
function Section({ icon: Icon, iconColor, label, children, accent }) {
  return (
    <div className={`space-y-2 ${accent ? `p-3.5 rounded-lg ${accent}` : ''}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="section-heading">{label}</span>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

export default function ExplanationCard({ explanation }) {
  if (!explanation) return null;

  return (
    <div className="glass-card p-5 animate-slide-up">
      {/* Card header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/15 to-blue-500/15 border border-violet-500/20">
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">AI Support Analysis</h3>
            <p className="text-[10px] text-slate-600 mt-0.5">Explains verified investigation findings</p>
          </div>
        </div>

        {/* Source badge */}
        <div className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-full border font-medium ${
          explanation.is_demo_mode
            ? 'bg-amber-500/8 text-amber-400 border-amber-500/20'
            : 'bg-emerald-500/8 text-emerald-600 border-emerald-300'
        }`}>
          {explanation.is_demo_mode
            ? <><FlaskConical className="w-3 h-3" /> Demo Mode</>
            : <><CheckCircle2 className="w-3 h-3" /> Live AI</>
          }
        </div>
      </div>

      {/* Anti-hallucination notice */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/60 rounded-lg border border-slate-200/60 mb-5">
        <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
        <span className="text-[10px] text-slate-600">
          This analysis is based exclusively on <strong className="text-slate-600">verified facts</strong> from the deterministic investigation.
          {explanation.is_demo_mode && ' No external AI API was called.'}
        </span>
      </div>

      {/* Content sections */}
      <div className="space-y-4">
        <Section icon={MessageSquare} iconColor="text-blue-600" label="Summary">
          <p className="text-[13px] text-slate-600 leading-relaxed">{explanation.summary}</p>
        </Section>

        <div className="divider" />

        <Section icon={ShieldCheck} iconColor="text-cyan-400" label="Root Cause Explanation">
          <p className="text-[13px] text-slate-600 leading-relaxed">{explanation.root_cause_explanation}</p>
        </Section>

        <div className="divider" />

        <Section
          icon={Lightbulb}
          iconColor="text-amber-400"
          label="Recommended Action"
          accent="bg-amber-500/5 border border-amber-500/10"
        >
          <p className="text-[13px] text-slate-600 leading-relaxed">{explanation.recommended_action}</p>
        </Section>

        <div className="divider" />

        <Section icon={User} iconColor="text-emerald-600" label="Customer-Friendly Explanation">
          <p className="text-[13px] text-slate-600 italic leading-relaxed">
            "{explanation.customer_friendly_explanation}"
          </p>
        </Section>

        {/* Uncertainties */}
        {explanation.uncertainties && explanation.uncertainties.length > 0 && (
          <>
            <div className="divider" />
            <Section
              icon={AlertCircle}
              iconColor="text-amber-400"
              label="Uncertainties"
              accent="bg-amber-500/5 border border-amber-500/10"
            >
              <ul className="space-y-1.5">
                {explanation.uncertainties.map((u, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-amber-300/80">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                    {u}
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
