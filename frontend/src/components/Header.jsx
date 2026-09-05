import { useState } from 'react';
import {
  Activity, Shield, Cpu, Database, Search,
  Menu, Code2, User, CheckCircle2
} from 'lucide-react';

export default function Header({ health, onSearch, onToggleSidebar }) {
  const isDemo = health?.llm_provider === 'demo';
  const dataOk = health?.data_loaded;
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim() && onSearch) {
      onSearch(searchValue.trim().toUpperCase());
      setSearchValue('');
    }
  };

  return (
    <header className="header-bar">
      <div className="header-inner">
        {/* Left: hamburger + brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              {dataOk && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse-slow" />
              )}
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-slate-800 tracking-tight leading-tight">
                Settlement Support Agent
              </h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                Multi-system transaction investigation
              </p>
            </div>
          </div>
        </div>

        {/* Center: branding */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 leading-none">Fintech Powered by</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="p-1 rounded-md bg-gradient-to-br from-blue-600 to-cyan-500">
                <Code2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[14px] font-extrabold text-slate-800 tracking-tight">
                CODE CRAFTERS
              </span>
            </div>
            <p className="text-[9px] text-slate-400 leading-none mt-0.5">
              Building Intelligent Financial Solutions
            </p>
          </div>
        </div>

        {/* Right: search + indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:block relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search transactions..."
              className="header-search-input"
              spellCheck={false}
              autoComplete="off"
            />
          </form>

          {/* Data status */}
          {health && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
              <Database className="w-3 h-3 text-slate-500" />
              <div className={`w-1.5 h-1.5 rounded-full ${dataOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-slate-600 font-medium text-[11px]">
                {dataOk ? '100 transactions' : 'Data unavailable'}
              </span>
            </div>
          )}

          {/* LLM status */}
          {health && (
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
              isDemo
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <Cpu className={`w-3 h-3 ${isDemo ? 'text-amber-500' : 'text-emerald-600'}`} />
              <span className={`font-medium text-[11px] ${isDemo ? 'text-amber-600' : 'text-emerald-600'}`}>
                {health.llm_provider === 'demo'
                  ? 'Demo Mode'
                  : `AI: ${health.llm_provider}`}
              </span>
            </div>
          )}

          {/* Verified facts */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span className="text-emerald-700 font-medium hidden md:inline text-[11px]">Verified Facts</span>
          </div>

          {/* Profile icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <span className="text-[11px] font-bold text-white">CC</span>
          </div>
        </div>
      </div>
    </header>
  );
}
