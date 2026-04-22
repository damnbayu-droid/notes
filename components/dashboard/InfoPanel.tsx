'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Bot, Database, Book, Scan, Mic, Zap, Compass, Share2, Info, ChevronRight, Monitor, Camera, Lock, Pin, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface FeatureDetail {
  icon: any
  title: string
  description: string
  howToUse: string[]
  color: string
  bg: string
}

const features: FeatureDetail[] = [
  {
    icon: Zap,
    title: "AI-First Design",
    description: "Neural-Perfect architecture optimized for biological and synthetic intelligence. Guaranteed 100% parsing success for AI agents and LLMs.",
    howToUse: [
      "All nodes are delivered in semantically valid DOM trees for zero-latency ingestion.",
      "Optimized for quick extraction by LLMs, scrapers, and neural search oracles.",
      "Maintains 100% structural integrity across all device clusters and exports."
    ],
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20"
  },
  {
    icon: Share2,
    title: "Secure Neural Sharing",
    description: "End-to-end encrypted distribution with recursive Row Level Security (RLS). Share files securely Private or Globaly.",
    howToUse: [
      "Initialize Shared Intelligence from the Note Editor to generate a neural link.",
      "Set permissions (Read/Write) to control collaborator access levels.",
      "Global Mode: Publish to the public Oracle for mass indexing and AI discovery."
    ],
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20"
  },
  {
    icon: Compass,
    title: "Discovery Engine",
    description: "Convert private nodes into discoverable community intelligence. Indexed by global AI search engines and the Smart Notes Oracle.",
    howToUse: [
      "Enable 'Global Discovery' in sharing settings to broadcast to public crawlers.",
      "Set knowledge classification (Technical, Research, etc.) for optimized indexing.",
      "Retain biological authorship while contributing to the global hive mind."
    ],
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-900/20"
  },
  {
    icon: Pin,
    title: "Sticky Notes v2.3",
    description: "Tactile, draggable reminders with MacBook-style windowing. Bring your intelligence to the surface of your workspace.",
    howToUse: [
      "Initialize via 'Add Sticky' in the editor or 'Tools' in the Dynamic Island.",
      "Use MacBook Controls: Red (Delete), Yellow (Minimize), Green (Maximize).",
      "Export intelligence directly to disk as .txt files via the Download protocol.",
      "Experimental: Install as PWA to keep notes floating on your desktop background."
    ],
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-900/20"
  },
  {
    icon: Globe,
    title: "World Time Coordination",
    description: "Real-time temporal mapping across global clusters. Synchronize operations across multiple time zones with zero drift.",
    howToUse: [
      "Access via the Dynamic Island World icon or System Tools.",
      "View synchronized local times for Bali, Tokyo, New York, and London.",
      "Protocol Hardened: Includes automatic IANA zone reconciliation and error guards."
    ],
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20"
  },
  {
    icon: Scan,
    title: "PDF Master (OCR)",
    description: "High-performance camera scanner with localized OCR. Digitalize physical intelligence with on-device processing.",
    howToUse: [
      "Access via the Dashboard view selector (Scanner mode).",
      "Upload or capture physical documents to extract text clusters automatically.",
      "Zero-Cloud Privacy: OCR operations happen locally on your hardware."
    ],
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20"
  },
  {
    icon: Shield,
    title: "Spy Master (Stealth)",
    description: "Silent background capture for neural streams. Record audio, video, and screen data directly to local storage repositories.",
    howToUse: [
      "Trigger via the Dynamic Island Bell icon with secure Authorization PIN.",
      "Bypass online storage limits by routing data to specified local directories.",
      "Maintains absolute stealth with zero UI indicators during active capture."
    ],
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/20"
  }
]

export function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-info-panel', handleOpen)
    return () => window.removeEventListener('open-info-panel', handleOpen)
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" role="dialog">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (selectedFeature) setSelectedFeature(null)
              else setIsOpen(false)
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-violet-100 dark:border-white/5 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="relative p-8 sm:p-12 bg-slate-950 text-white overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-8 right-8 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-4">Smart Notes Protocol</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] opacity-60">System Version 15.0.3 — Production Stable</p>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 dark:bg-transparent">
              <AnimatePresence mode="wait">
                {selectedFeature ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <button 
                      onClick={() => setSelectedFeature(null)}
                      className="text-[10px] font-black uppercase tracking-widest text-violet-600 flex items-center gap-2 hover:translate-x-[-4px] transition-transform"
                    >
                      ← Back to Clusters
                    </button>
                    
                    <div className="flex items-start gap-8">
                      <div className={`p-6 rounded-[2.5rem] shadow-2xl ${selectedFeature.bg} ${selectedFeature.color}`}>
                        <selectedFeature.icon className="w-12 h-12" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">{selectedFeature.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
                          {selectedFeature.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Operational Instructions</h4>
                       <div className="grid gap-3">
                          {selectedFeature.howToUse.map((step, i) => (
                             <div key={i} className="flex gap-4 p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 shadow-sm">
                                <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-black text-violet-600 shrink-0">
                                   {i + 1}
                                </div>
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">{step}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {features.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedFeature(f)}
                        className={`p-6 rounded-[2.5rem] border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-all group flex items-center gap-6 text-left ${f.bg}`}
                      >
                        <div className={`p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-xl transition-all group-hover:scale-110 ${f.color}`}>
                          <f.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                           <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight mb-1">{f.title}</h3>
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-60">View Protocol →</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-8 sm:p-12 border-t border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">All Clusters Secured</span>
               </div>
               <Button
                 onClick={() => setIsOpen(false)}
                 className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl px-12 h-14 font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
               >
                 Close Protocol
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
