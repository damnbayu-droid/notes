'use client'

import { Share2, MessageSquare, Mail, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ShareClusterProps {
  title: string
  slug: string
}

export function ShareCluster({ title, slug }: ShareClusterProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://notes.biz.id'}/s/${slug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Neural Link Sequenced', {
      description: 'Link has been replicated to your local clipboard.'
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent('Check out this node: ' + title + ' ' + shareUrl)}`
    window.open(url, '_blank')
  }

  const handleEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent('Intelligence: ' + title)}&body=${encodeURIComponent('Access this intelligence node: ' + shareUrl)}`
    window.location.href = url
  }

  return (
    <section className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl shadow-violet-500/30 space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest leading-none">
            <Share2 className="w-3.5 h-3.5" /> Intelligence Broadcaster
          </div>
          <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic leading-none">Broadcast <span className="text-violet-200">The Pulse</span></h3>
          <p className="text-sm font-medium text-violet-100 max-w-sm opacity-80 mx-auto lg:mx-0">Distribute this intelligence node across your network via specialized neural bridges.</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button 
            onClick={handleWhatsApp}
            className="h-14 px-8 bg-white text-violet-600 rounded-2xl flex items-center gap-3 font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-all shadow-xl hover:bg-slate-50 border-0"
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </Button>
          <Button 
            onClick={handleEmail}
            className="h-14 px-8 bg-emerald-500 text-white rounded-2xl flex items-center gap-3 font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-all shadow-xl hover:bg-emerald-600 border-0"
          >
            <Mail className="w-4 h-4" /> Email Hub
          </Button>
          <Button 
            onClick={handleCopy}
            className="h-14 w-14 bg-violet-900 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl border-0 p-0"
            title="Copy Link Hub"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </section>
  )
}
