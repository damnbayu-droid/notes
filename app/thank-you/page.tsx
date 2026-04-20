'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, Rocket, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Providers } from '@/components/Providers'

export default function ThankYouPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Neural Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-600/5 blur-[100px] rounded-full animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-100 dark:border-white/5 rounded-[4rem] p-12 text-center shadow-[0_32px_128px_rgba(0,0,0,0.1)] relative z-10"
      >
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 bg-violet-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-violet-500/40 relative z-10 mx-auto">
            <Check className="w-12 h-12 text-white" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 scale-150 border-2 border-dashed border-violet-200 dark:border-violet-800 rounded-full opacity-30"
          />
        </div>

        <div className="space-y-4 mb-12">
          <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-0 text-[10px] font-black uppercase tracking-[0.3em] py-1 px-4 rounded-full mx-auto">
             Transaction Authenticated
          </Badge>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Neural <span className="text-violet-600">Expansion</span> Complete</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
            Your intelligence node has been successfully upgraded. <br/>
            Wait for the network to propagate your new status.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { icon: Crown, label: 'Unlim. Notes' },
            { icon: Rocket, label: 'Fast Sync' },
            { icon: Sparkles, label: 'Ad-Free' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <item.icon className="w-6 h-6 text-violet-600" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Link href="/dashboard" className="block">
            <Button className="w-full h-16 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group">
              Initialize Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-50">
            A confirmation has been sent to your neural register.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </div>
  )
}
