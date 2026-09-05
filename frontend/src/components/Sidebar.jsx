import { useState } from 'react';
import {
  LayoutDashboard, Search, List, BarChart3,
  Activity, Settings, ChevronLeft, ChevronRight,
  Code2, Heart
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'investigate',  label: 'Investigate',   icon: Search },
  { id: 'transactions', label: 'Transactions',  icon: List },
  { id: 'analytics',    label: 'Analytics',     icon: BarChart3 },
  { id: 'health',       label: 'System Health', icon: Activity },
  { id: 'settings',     label: 'Settings',      icon: Settings },
];

export default function Sidebar({ activeSection, onNavigate, collapsed, onToggleCollapse }) {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={onToggleCollapse}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`sidebar-nav-item ${isActive ? 'sidebar-nav-active' : 'sidebar-nav-inactive'}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className={`sidebar-nav-label ${collapsed ? 'lg:hidden' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom branding */}
        <div className={`sidebar-branding ${collapsed ? 'lg:hidden' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              CODE CRAFTERS
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            Fintech settlement<br />
            intelligence for a<br />
            more transparent tomorrow.
          </p>
          <div className="border-t border-slate-200/60 pt-2.5">
            <p className="text-[10px] text-slate-400">© 2026 Code Crafters</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Heart className="w-2.5 h-2.5 text-red-400 fill-red-400" />
              Built with purpose
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
