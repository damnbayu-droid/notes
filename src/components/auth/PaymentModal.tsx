import { Check, Zap, Shield, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  if (!isOpen) return null;

  const tiers = [
    {
      id: 'limited_month',
      name: '1 Month',
      price: 'Limited Access',
      description: 'Full feature access with support ads every 15 minutes.',
      link: 'https://pay.doku.com/p-link/p/s6PRTIA7qB',
      icon: Zap,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-100 dark:border-violet-800'
    },
    {
      id: 'limited_year',
      name: '1 Year',
      price: 'Limited Access',
      description: '1 Year of full features. Support ads every 15 minutes.',
      link: 'https://pay.doku.com/p-link/p/R9Ubd5CzdI',
      icon: Shield,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-100 dark:border-indigo-800',
      popular: true
    },
    {
      id: 'full_access',
      name: 'Full Access',
      price: 'Ad-Free Freedom',
      description: 'Lifetime or Unlimited access with absolutely NO ADS or redirects.',
      link: 'https://pay.doku.com/p-link/p/tC1fEY24JY',
      icon: Crown,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-800'
    }
  ];

  return (
    <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-violet-100 dark:border-violet-900/30 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 sm:p-12 text-center border-b border-gray-100 dark:border-gray-900 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full bg-gray-50 dark:bg-gray-900"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="w-16 h-16 bg-violet-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-violet-500/20">
            <Crown className="w-8 h-8 text-white fill-white" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-tight">Upgrade Your Workspace</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Unlock the full potential of Smart Notes. Choose the tier that fits your workflow and support the future of secured knowledge management.
          </p>
        </div>

        {/* Options Grid */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div 
                key={tier.id}
                className={`relative p-8 rounded-[2rem] border-2 transition-all hover:scale-[1.02] flex flex-col ${tier.border} ${tier.bg}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-xl bg-white dark:bg-gray-900 shadow-md flex items-center justify-center mb-6 ${tier.color}`}>
                  <tier.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-200 uppercase tracking-tight mb-1">{tier.name}</h3>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${tier.color}`}>{tier.price}</p>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-8 flex-1">
                  {tier.description}
                </p>

                <div className="space-y-3 mb-8">
                    {['Full AI Access', 'Discovery Library', 'Unlimited Sync', tier.id === 'full_access' ? 'NO ADS' : 'With Support Ads'].map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                            <Check className={`w-4 h-4 ${tier.color}`} />
                            {feat}
                        </div>
                    ))}
                </div>

                <Button
                  onClick={() => window.open(tier.link, '_blank')}
                  className="w-full h-14 bg-black dark:bg-white dark:text-black hover:brightness-110 text-white font-black uppercase tracking-widest rounded-2xl text-[10px] shadow-xl transition-all active:scale-95"
                >
                  Pay with DOKU
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50/50 dark:bg-transparent text-center border-t border-gray-100 dark:border-gray-900">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Verified Secure Payment via Doku P-Link</p>
        </div>
      </div>
    </div>
  );
}
