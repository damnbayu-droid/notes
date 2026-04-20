'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Rocket, Shield, Crown, Zap, X, Loader2, User, Globe, Mail, FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import Script from 'next/script'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'

const TIERS = [
  {
    name: 'Free Cluster',
    price: '0',
    description: 'Basic intelligence storage with recurring status updates (Ads).',
    features: ['Up to 50 Intelligence Nodes', 'Basic Neural Search', 'Discovery Mode Access', 'Local Storage Encrypt'],
    color: 'bg-slate-100',
    icon: Zap,
    cta: 'Current Plan'
  },
  {
    name: 'Starter Node',
    price: '15.000',
    period: '/mo',
    description: 'Remove interruptions and expand your neural capacity.',
    features: ['Unlimited Nodes', 'Ad-Free Intelligence', 'Neural Tagging', 'Priority Cloud Sync'],
    color: 'bg-blue-50 dark:bg-blue-900/20',
    icon: Rocket,
    cta: 'Upgrade Cluster',
    popular: true
  },
  {
    name: 'Full Intelligence',
    price: '50.000',
    period: '/mo',
    description: 'Professional grade tools for researchers and developers.',
    features: ['GitHub Node Syncing', 'Google Drive Integration', 'Infinite Canvas Tools', 'Encrypted Broadcaster'],
    color: 'bg-violet-50 dark:bg-violet-900/20',
    icon: Crown,
    cta: 'Acquire Power'
  },
  {
    name: 'Enterprise Hub',
    price: '150.000',
    period: '/mo',
    description: 'Military-grade encryption and collaborative workspaces.',
    features: ['Multi-User Syncing', 'Custom Neural Bridges', 'Audit Logs Access', '24/7 Neural Support'],
    color: 'bg-amber-50 dark:bg-amber-900/20',
    icon: Shield,
    cta: 'Deploy Enterprise'
  }
]

export function SubscriptionModal() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', notes: '' })
  const [selectedTier, setSelectedTier] = useState<typeof TIERS[0] | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'doku' | 'paypal' | null>(null)

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      window.dispatchEvent(new CustomEvent('hide-header'))
    }
    window.addEventListener('open-payment-modal', handleOpen)
    return () => window.removeEventListener('open-payment-modal', handleOpen)
  }, [])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      window.dispatchEvent(new CustomEvent('show-header'))
      setIsGuestMode(false)
      setSelectedTier(null)
      setPaymentMethod(null)
    }
  }

  const handleSubscribe = async (tier: typeof TIERS[0]) => {
    setSelectedTier(tier)
    // Always show payment method choice now
    setPaymentMethod(null)
    setIsGuestMode(!user)
  }

  const handleFinalizeDoku = async () => {
    if (!selectedTier) return
    const email = user?.email || guestInfo.email
    if (!email) {
      toast.error('Identity Required', { description: 'Please provide an email for transaction logs.' })
      return
    }

    setIsProcessing(selectedTier.name)
    toast.info(`Initializing Checkout Hub...`, {
      description: 'Negotiating with DOKU Secure Bridge.'
    })

    try {
      const response = await fetch('/api/payment/doku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedTier.name.toLowerCase().replace(' ', '-'),
          planName: selectedTier.name,
          amount: parseInt(selectedTier.price.replace('.', '')),
          userEmail: email,
          name: user ? undefined : guestInfo.name,
          notes: user ? undefined : guestInfo.notes
        })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Uplink failed')
      }
    } catch (error: any) {
      console.error('Payment Error:', error)
      toast.error('Bridge Connection Failure', { description: error.message })
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-0 rounded-[3rem] bg-white dark:bg-slate-950 shadow-2xl animate-in zoom-in-95 duration-300">
        <DialogDescription className="sr-only">Neural expansion subscription gateway for professional intelligence protocols.</DialogDescription>
        <DialogTitle className="sr-only">Subscription Tier Selection</DialogTitle>
        
        {/* Close Button Header */}
        <div className="absolute top-6 right-6 z-50">
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => handleOpenChange(false)}
             className="h-10 w-10 rounded-full bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 backdrop-blur-md transition-all active:scale-95"
           >
             <X className="w-5 h-5 text-slate-500" />
           </Button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
           {/* Left Sidebar Info - Photo 3 Fixed Header */}
           <div className="lg:w-72 bg-slate-950 p-6 lg:p-10 text-white relative overflow-hidden flex flex-col shrink-0">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-violet-600/10 blur-[100px] rounded-full" />
              <div className="relative z-10 flex-row lg:flex-col flex items-center lg:items-start gap-4 lg:gap-0 flex-1">
                 <div className="w-12 h-12 lg:w-14 lg:h-14 bg-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/20 mb-0 lg:mb-6 rotate-6 shrink-0">
                    <Crown className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                 </div>
                 <div>
                    <h2 className="text-lg lg:text-2xl font-black uppercase tracking-tighter italic mb-1 lg:mb-3 leading-tight">Neural Expansion</h2>
                    <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 leading-relaxed italic uppercase tracking-widest opacity-80 hidden lg:block">
                      Enhance your collective intelligence with professional tier protocols.
                    </p>
                    <p className="text-[8px] font-black text-slate-500 lg:hidden uppercase tracking-widest italic leading-none">Security Level: Grade-A</p>
                 </div>
              </div>

              <div className="relative z-10 mt-auto pt-4 lg:pt-8 border-t border-white/5 hidden sm:block">
                 <p className="text-[7px] lg:text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 lg:mb-2 italic">Official Provider</p>
                 <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-white leading-tight">
                    PT Indonesian Visas Agency
                 </p>
              </div>
           </div>

           {/* Pricing Grid or Guest/Auth Form Choice */}
           <div className="flex-1 p-8 lg:p-10 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-900/10 relative">
              
              {!selectedTier ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                    {TIERS.map((tier) => (
                       <div 
                         key={tier.name}
                         className={`relative flex flex-col p-6 rounded-[2rem] border transition-all ${tier.popular ? 'border-violet-300/50 dark:border-violet-500/30 bg-white dark:bg-slate-900 shadow-xl shadow-violet-500/5' : 'border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50'} hover:border-violet-400/30`}
                       >
                          <div className="flex items-center justify-between mb-5">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5">
                                   <tier.icon className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                   <h3 className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white italic leading-none">{tier.name}</h3>
                                   <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sync Level</p>
                                </div>
                             </div>
                             {tier.popular && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[7px] font-black uppercase tracking-widest rounded-full px-2 py-0">Best Choice</Badge>
                             )}
                          </div>
                          
                          <div className="mb-4 flex items-baseline gap-1">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">IDR</span>
                             <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{tier.price}</span>
                             {tier.period && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tier.period}</span>}
                          </div>

                          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed italic opacity-80">
                            {tier.description}
                          </p>

                          <ul className="space-y-2.5 mb-8 flex-1">
                             {tier.features.slice(0, 4).map(feat => (
                                <li key={feat} className="flex items-center gap-2.5">
                                   <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 truncate">{feat}</span>
                                </li>
                             ))}
                          </ul>

                          <Button 
                            onClick={() => handleSubscribe(tier)}
                            disabled={isProcessing !== null || tier.price === '0' || ((user?.role === 'admin' || user?.isSuperAdmin || user?.email === 'damnbayu@gmail.com') && tier.name === 'Enterprise Hub')}
                            variant={tier.popular ? 'default' : 'outline'}
                            className={`h-12 rounded-xl font-black uppercase text-[9px] tracking-[0.15em] transition-all active:scale-95 ${tier.popular ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20' : 'border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                             {isProcessing === tier.name ? <Loader2 className="w-4 h-4 animate-spin" /> : ((user?.role === 'admin' || user?.isSuperAdmin || user?.email === 'damnbayu@gmail.com') && tier.name === 'Enterprise Hub') ? 'Creator Mode Active' : tier.cta}
                          </Button>
                       </div>
                    ))}
                 </div>
              ) : (
                 <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                 >
                    <div className="flex items-center gap-4 mb-8">
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setIsGuestMode(false); setSelectedTier(null); setPaymentMethod(null); }}
                          className="rounded-full h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800"
                       >
                          <X className="w-4 h-4" />
                       </Button>
                       <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white italic">Guest Intelligence Checkout</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tier: {selectedTier?.name}</p>
                       </div>
                    </div>

                    {!paymentMethod ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button 
                             onClick={() => setPaymentMethod('doku')}
                             className="h-24 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center gap-2 group hover:border-violet-500/50 transition-all shadow-sm"
                          >
                             <Globe className="w-6 h-6 text-violet-600" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">DOKU Secure Bridge</span>
                          </Button>
                          <Button 
                             onClick={() => setPaymentMethod('paypal')}
                             className="h-24 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 transition-all shadow-sm"
                          >
                             <div className="w-6 h-6 flex items-center justify-center bg-blue-500 rounded-full text-white font-black italic text-[8px]">PP</div>
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">PayPal Unified Hub</span>
                          </Button>
                       </div>
                    ) : paymentMethod === 'doku' ? (
                       <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                          <div className="space-y-4">
                             <div className="grid gap-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Neural Identifier (Name)</label>
                                <div className="relative">
                                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                                   <Input 
                                      placeholder="Ex: Agent Solo"
                                      value={guestInfo.name}
                                      onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                                      className="h-14 px-12 bg-white dark:bg-slate-950 border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs shadow-inner"
                                   />
                                </div>
                             </div>
                             <div className="grid gap-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Uplink Email (For Receipt)</label>
                                <div className="relative">
                                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                                   <Input 
                                      placeholder="you@nebula.net"
                                      type="email"
                                      value={guestInfo.email}
                                      onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                                      className="h-14 px-12 bg-white dark:bg-slate-950 border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs shadow-inner"
                                   />
                                </div>
                             </div>
                             <div className="grid gap-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Instructional Notes (Optional)</label>
                                <div className="relative">
                                   <FileText className="absolute left-4 top-4 w-4 h-4 text-violet-500" />
                                   <Textarea 
                                      placeholder="Leave your message here..."
                                      value={guestInfo.notes}
                                      onChange={(e) => setGuestInfo({...guestInfo, notes: e.target.value})}
                                      className="min-h-32 px-12 pt-4 bg-white dark:bg-slate-950 border-slate-100 dark:border-white/5 rounded-[2rem] font-bold text-xs shadow-inner resize-none"
                                   />
                                </div>
                             </div>
                          </div>
                          <Button 
                             onClick={handleFinalizeDoku}
                             disabled={isProcessing !== null || !guestInfo.email}
                             className="w-full h-16 rounded-[2.5rem] bg-violet-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-violet-500/20 active:scale-95 transition-all"
                          >
                             {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Execute DOKU Uplink'}
                          </Button>
                       </div>
                    ) : (
                       <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-inner">
                          <div className="text-center space-y-3 mb-8">
                             <div className="w-16 h-16 bg-blue-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 mb-4">
                                <Plus className="w-8 h-8 text-white rotate-45" />
                             </div>
                             <h4 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">PayPal Gateway</h4>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-80">One Unified Payment Protocol</p>
                          </div>

                           {/* PayPal Container Integration (CLEAN BLOCK FOR SDK) */}
                           <div 
                               id={`paypal-container-${process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID}`} 
                               className="w-full min-h-[160px] bg-slate-50 dark:bg-slate-950/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 relative overflow-visible p-6 text-center"
                               style={{ width: '100%', display: 'block' }}
                           >
                              {/* Internal content centering managed by text-center and mx-auto if script supports it */}
                              <div className="flex flex-col items-center justify-center gap-3 opacity-20 pointer-events-none w-full h-full py-8">
                                 <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Initializing PayPal Hub...</span>
                              </div>
                           </div>

                           <Script 
                               src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=USD`}
                               strategy="lazyOnload"
                               onLoad={() => {
                                  // @ts-ignore
                                  if (window.paypal && window.paypal.HostedButtons) {
                                     // @ts-ignore
                                     window.paypal.HostedButtons({
                                        hostedButtonId: process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID,
                                     }).render(`#paypal-container-${process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID}`);
                                  }
                               }}
                           />

                          <Button 
                             variant="ghost" 
                             onClick={() => setPaymentMethod(null)}
                             className="w-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                             Abandon PayPal Session
                          </Button>
                       </div>
                    )}
                 </motion.div>
              )}
              
              <div className="flex items-center justify-center gap-3 py-4 opacity-30">
                 <Shield className="w-3 h-3 text-slate-400" />
                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em]">Checkout Hub Encrypted • Verified Security Bridge</span>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
