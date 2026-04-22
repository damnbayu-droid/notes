'use client'

import React from 'react';
import { Shield, Clock, HardDrive, Cloud, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

interface StorageLog {
  timestamp: string;
  action: string;
  details: any;
  device: string;
}

interface SystemLogsProps {
  logs: StorageLog[];
}

export function SystemLogs({ logs }: SystemLogsProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none flex items-center gap-4">
          <Shield className="w-10 h-10 text-violet-600" />
          Neural Storage Trace
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
          Immutable audit trail for intelligence mirroring and storage migrations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {(!logs || logs.length === 0) ? (
          <div className="p-20 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center">
             <Clock className="w-12 h-12 text-slate-200 mb-4" />
             <p className="text-xs font-black uppercase tracking-widest text-slate-400">No storage events recorded in current cycle.</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div 
              key={i}
              className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] hover:shadow-2xl hover:shadow-violet-500/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-6">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                   log.action.includes('PURGE') ? 'bg-rose-50 text-rose-500' : 
                   log.action.includes('MIRROR') ? 'bg-emerald-50 text-emerald-500' :
                   'bg-violet-50 text-violet-500'
                 }`}>
                    {log.action.includes('PURGE') ? <AlertTriangle className="w-6 h-6" /> : 
                     log.action.includes('MIRROR') ? <Cloud className="w-6 h-6" /> :
                     <HardDrive className="w-6 h-6" />}
                 </div>
                 
                 <div className="space-y-1">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-slate-500">
                          {log.device}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                       </span>
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tighter italic leading-tight">
                       {log.action.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       {JSON.stringify(log.details)}
                    </p>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-1 text-emerald-500">
                       <CheckCircle2 className="w-3 h-3" />
                       <span className="text-[9px] font-black uppercase">Immutable</span>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-200 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32 group-hover:opacity-40 transition-opacity" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
               <h3 className="text-xl font-black uppercase tracking-tighter italic">Operational Integrity</h3>
               <p className="text-[10px] text-slate-400 uppercase tracking-widest max-w-md">
                  These logs are part of the Neural Trace Protocol. They cannot be modified or deleted by users, providing a mathematical guarantee of data lineage.
               </p>
            </div>
            <div className="px-6 py-3 border border-white/10 rounded-2xl flex items-center gap-4">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Sync Status</span>
                  <span className="text-xs font-black uppercase text-emerald-400">Encrypted Mirror Active</span>
               </div>
               <Cloud className="w-5 h-5 text-violet-400 animate-pulse" />
            </div>
         </div>
      </div>
    </div>
  );
}
