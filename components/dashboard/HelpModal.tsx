'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Book, 
  HelpCircle, 
  MessageSquare, 
  Sparkles, 
  Shield, 
  Zap, 
  ArrowUpRight, 
  Rocket,
  Search,
  CheckCircle2
} from 'lucide-react'

const HELP_TOPICS = [
  {
    title: 'Neural Navigation',
    description: 'Master the Dynamic Island and search clusters for instant recall.',
    icon: Compass,
    link: '#'
  },
  {
    title: 'Intelligence Sharing',
    description: 'Learn how to broadcast your nodes to the Discovery library.',
    icon: Zap,
    link: '#'
  },
  {
    title: 'Cloud Synchronization',
    description: 'Connecting to GitHub and Google Drive for distributed storage.',
    icon: Cloud,
    link: '#'
  },
  {
    title: 'Payment Protocols',
    description: 'Managing your subscription and DOKU secure payments.',
    icon: Shield,
    link: '#'
  }
]

import { Compass, Cloud } from 'lucide-react'

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-help-modal', handleOpen)
    return () => window.removeEventListener('open-help-modal', handleOpen)
  }, [])

  const handleContactOpen = () => {
    setIsOpen(false)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-contact-modal'))
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 rounded-[3rem] bg-white dark:bg-slate-950 shadow-2xl">
        <DialogTitle className="sr-only">Intelligence Help Hub</DialogTitle>
        <div className="flex flex-col h-full">
           {/* Header Section */}
           <div className="p-10 bg-gradient-to-br from-violet-600 to-indigo-700 text-white relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 space-y-4">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <HelpCircle className="w-6 h-6 text-white" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">Intelligence Help Hub</h2>
                    <p className="text-violet-100 font-bold opacity-90 text-[10px] uppercase tracking-widest mt-1">
                      System Documentation & Support Matrix
                    </p>
                 </div>
              </div>
              <DialogDescription className="sr-only">Comprehensive documentation for the Smart Notes Intelligence Suite, covering navigation, sharing, and security protocols.</DialogDescription>
           </div>

           {/* Content Section */}
           <div className="p-8 lg:p-10 space-y-8 bg-white dark:bg-slate-950">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {HELP_TOPICS.map((topic) => (
                    <button 
                      key={topic.title}
                      className="group p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-left transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1"
                    >
                       <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/10 group-hover:text-violet-600 transition-colors">
                             <topic.icon className="w-5 h-5" />
                          </div>
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{topic.title}</h3>
                       </div>
                       <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                         {topic.description}
                       </p>
                    </button>
                 ))}
              </div>

              {/* Support CTA */}
              <div className="p-8 rounded-[2.5rem] bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-sm font-black uppercase tracking-tight text-violet-900 dark:text-violet-300 italic">Direct Channel Required?</h4>
                    <p className="text-[10px] font-bold text-violet-600/70 uppercase tracking-widest leading-none">Initialize Support Bridge for specific queries.</p>
                 </div>
                 <Button 
                   onClick={handleContactOpen}
                   className="h-12 px-8 rounded-2xl bg-violet-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all"
                 >
                    <MessageSquare className="w-4 h-4 mr-2" /> Start Message
                 </Button>
              </div>
           </div>

           {/* Footer */}
           <div className="px-10 pb-8 text-center bg-white dark:bg-slate-950">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 opacity-50">
                 Smart Notes • Operational Integrity v7.0.0
              </p>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
