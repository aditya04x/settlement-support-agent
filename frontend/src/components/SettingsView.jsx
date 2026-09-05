import { useState, useEffect } from 'react';
import { Settings, Cpu, Monitor, Info } from 'lucide-react';

export default function SettingsView({ health }) {
  // Initialize from localStorage or default to false
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('ssa_reduced_motion') === 'true';
  });

  const isDemo = health?.llm_provider === 'demo';

  useEffect(() => {
    localStorage.setItem('ssa_reduced_motion', reducedMotion);
    // Apply class to body for global CSS targeting
    if (reducedMotion) {
      document.body.classList.add('reduced-motion-override');
    } else {
      document.body.classList.remove('reduced-motion-override');
    }
  }, [reducedMotion]);

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-blue-100">
          <Settings className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-slate-800">Settings</h2>
          <p className="text-[12px] text-slate-500">Configure application preferences</p>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden divide-y divide-slate-100">
        
        {/* Backend Configuration (Read Only) */}
        <div className="p-6">
          <h3 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500" />
            Backend Configuration
          </h3>
          
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <p className="text-[13px] font-semibold text-slate-700">AI Assistant Mode</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
                Determines whether the AI Assistant uses a live LLM API or deterministic fallback responses. This is configured via backend environment variables.
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-[11px] font-bold ${
              isDemo ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {isDemo ? 'Demo Mode (Deterministic)' : `Live: ${health?.llm_provider || 'Unknown'}`}
            </div>
          </div>
        </div>

        {/* UI Preferences */}
        <div className="p-6">
          <h3 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-slate-500" />
            User Interface
          </h3>
          
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <p className="text-[13px] font-semibold text-slate-700">Reduced Motion</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
                Disable decorative animations and transitions across the application.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Authentication, API keys, and database configurations are managed securely via environment variables on the backend server and cannot be modified from the frontend dashboard.
        </p>
      </div>

    </div>
  );
}
