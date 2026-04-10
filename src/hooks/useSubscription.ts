import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

export type SubscriptionTier = 'free' | 'limited_month' | 'limited_year' | 'full_access';

export function useSubscription(user: User | null) {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setTier('free');
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user!.id)
          .single();

        if (error) throw error;
        setTier(data?.subscription_tier as SubscriptionTier || 'free');
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setTier('free');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();

    // Realtime subscription updates
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        setTier(payload.new.subscription_tier as SubscriptionTier);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isLimited = tier === 'limited_month' || tier === 'limited_year' || tier === 'free';
  const isPaid = tier !== 'free';
  const hasAds = tier !== 'full_access';

  return {
    tier,
    isPaid,
    isLimited,
    hasAds,
    loading,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  };
}
