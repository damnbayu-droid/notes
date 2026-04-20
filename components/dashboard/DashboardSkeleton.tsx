import React from 'react'

export function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 px-8 py-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto w-full space-y-12">
         {/* Search/Toolbelt Skeleton */}
         <div className="h-16 w-full max-w-2xl bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 animate-pulse" />
         
         {/* Detailed Grid of Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div 
                key={i} 
                className="h-72 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2.5rem] border border-slate-100 dark:border-white/5 relative overflow-hidden group"
              >
                {/* Internal card skeleton details for "Extreme Detail" */}
                <div className="p-8 space-y-4">
                  <div className="h-4 w-3/4 bg-slate-200/50 dark:bg-slate-800/50 rounded-full animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-200/30 dark:bg-slate-800/30 rounded-full animate-pulse" />
                  <div className="pt-8 space-y-2">
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/20 rounded-full" />
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/20 rounded-full" />
                    <div className="h-2 w-2/3 bg-slate-100 dark:bg-slate-800/20 rounded-full" />
                  </div>
                </div>
                {/* Bottom cluster skeleton */}
                <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                  </div>
                  <div className="w-16 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}
