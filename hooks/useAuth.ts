'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Neural Auth Bus: Lock Synchronization Singleton (v15.0.2)
// This architecture utilizes a global state manager and a solitary auth lifecycle
// ensuring that 'AbortError: Lock broken' never fires regardless of hook consumption frequency.
let globalAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true
};

const subscribers = new Set<React.Dispatch<React.SetStateAction<AuthState>>>();
let isInitialized = false;
let authPromise: Promise<any> | null = null;
let globalSupabase = createClient();

const notifySubscribers = (state: AuthState) => {
  globalAuthState = state;
  subscribers.forEach(sub => sub(state));
};

const initializeAuth = async () => {
  if (authPromise) return; // Prevent concurrent invocations

  try {
    authPromise = globalSupabase.auth.getUser();
    authPromise?.catch(() => {}); // Prevent Unhandled Promise Rejections internally
    
    const { data: { user }, error } = await authPromise;
    authPromise = null;
    
    if (error || !user) {
      notifySubscribers({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    
    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    const isAdmin = profile?.role === 'admin' || profile?.is_super_admin === true;
      
    const mappedUser: User = {
      id: user.id,
      email: user.email || '',
      name: profile?.full_name || user.user_metadata?.full_name || 'Anonymous',
      avatar: profile?.avatar_url || user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      created_at: user.created_at,
      subscription_tier: isAdmin ? 'enterprise' : (profile?.subscription_tier || 'free'),
      ads_disabled: isAdmin || (profile?.ads_disabled || false),
      role: profile?.role || 'user',
      isSuperAdmin: profile?.is_super_admin || false,
      interests: profile?.interests || [],
      access_level: isAdmin ? 'pro' : (profile?.access_level || 'free')
    };
    
    notifySubscribers({ user: mappedUser, isAuthenticated: true, isLoading: false });
  } catch (err) {
    authPromise = null;
    notifySubscribers({ user: null, isAuthenticated: false, isLoading: false });
  }
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(globalAuthState)

  useEffect(() => {
    subscribers.add(setState);

    if (!isInitialized) {
      isInitialized = true;
      
      // Perform initial fetch
      initializeAuth();

      // Subscribe to global auth changes exactly ONCE
      globalSupabase.auth.onAuthStateChange((_event: any, session: any) => {
        if (session?.user) {
          initializeAuth();
        } else {
          notifySubscribers({ user: null, isAuthenticated: false, isLoading: false });
        }
      });
    }

    return () => {
      subscribers.delete(setState);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await initializeAuth();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await globalSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          }
        }
      })

      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await globalSupabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await globalSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      if (error) throw error
      return { success: true }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err)
      toast.error('Google Synchronization Failed')
      return { success: false, error: err.message }
    }
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await globalSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [])

  const updateProfile = useCallback(async (updates: { name?: string; avatar?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!globalAuthState.user) return { success: false, error: 'User session not found' }
    try {
      const { error } = await globalSupabase
        .from('profiles')
        .update({
          full_name: updates.name,
          avatar_url: updates.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', globalAuthState.user.id)
      
      if (error) throw error
      await initializeAuth()
      return { success: true }
    } catch (err: any) {
      console.error('Profile Update Error:', err)
      return { success: false, error: err.message }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await globalSupabase.auth.signOut()
      notifySubscribers({ user: null, isAuthenticated: false, isLoading: false })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }, [])

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    updateProfile,
    signOut,
    refreshUser
  }
}
