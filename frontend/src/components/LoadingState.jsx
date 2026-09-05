import { useEffect } from 'react';

// Use InvestigationProgress instead for the loading experience.
// This file provides skeleton cards for the system/summary sections.
export default function LoadingState() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary skeleton */}
      <div className="glass-card p-5">
        <div className="skeleton h-3 w-32 mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-2.5 w-14" />
              <div className="skeleton h-5 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* System cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton h-3.5 w-28" />
              </div>
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2.5">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="skeleton h-2.5 w-14" />
                  <div className="skeleton h-2.5 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="glass-card p-5">
        <div className="skeleton h-3 w-36 mb-5" />
        <div className="space-y-3 pl-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-3 h-3 rounded-full flex-shrink-0" />
              <div className="skeleton h-2.5 w-12 flex-shrink-0" />
              <div className="skeleton h-2.5 flex-1 max-w-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
