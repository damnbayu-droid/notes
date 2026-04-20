'use client'

import { X, Shield, Globe, Lock, Brain, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface PrivacyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/5 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-8 pb-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Discovery Protocol</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Data Governance v12.1.0</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="p-8 pt-0 overflow-y-auto custom-scrollbar flex-1 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-4">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Global Discovery</h3>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                            PT Indonesian Visas Agency ensures that nodes marked for Discovery are indexed by secure AI Oracles for community intelligence while maintaining your biological authorship.
                        </p>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-4">
                        <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-violet-600" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Hardened Security</h3>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                            Utilizing Supabase Row Level Security (RLS) and end-to-end encryption. Your private neural clusters are strictly inaccessible to third-party crawlers and internal agents.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <Brain className="w-3.5 h-3.5" /> Neural Data Integrity
                    </h4>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-white/5 items-start">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <div className="space-y-1">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Biological Ownership</p>
                                <p className="text-[10px] font-medium text-slate-500 italic leading-relaxed">You retain 100% intellectual property of all nodes. PT Indonesian Visas Agency acts solely as a secure data custodian.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-white/5 items-start">
                            <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                            <div className="space-y-1">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Protocol BUFF Caching</p>
                                <p className="text-[10px] font-medium text-slate-500 italic leading-relaxed">Offline recovery buffers (Black Box) ensure intelligence persistence during network failures. Caches are purged immediately upon logout.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-white/5 items-start">
                            <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                            <div className="space-y-1">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Absolute Purge Matrix</p>
                                <p className="text-[10px] font-medium text-slate-500 italic leading-relaxed">Deleting an account triggers a recursive cascade deletion across all cloud nodes and local clusters within 60 seconds.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full blur-3xl" />
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <Lock className="w-5 h-5 text-violet-400" /> Operational Transparency
                    </h3>
                    <p className="text-[11px] font-medium leading-relaxed opacity-70 italic">
                        Smart Notes Intelligence Suite (v15.0.3) is operated by PT Indonesian Visas Agency. We prioritize data sovereignty and neural privacy above all metrics. By continuing, you authorize the secure ingestion of nodes into your private encrypted cluster.
                    </p>
                    <Button 
                      onClick={onClose}
                      className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all shadow-xl"
                    >
                        Accept & Exit Governance
                    </Button>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
