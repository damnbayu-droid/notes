import { useState, useCallback, useEffect } from 'react';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UseAuthReturn extends AuthState {
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If auth takes longer than 5s, force loading to stop
    const safetyTimeout = setTimeout(() => {
      if (mounted && state.isLoading) {
        console.warn('Auth check timed out, forcing loading false');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setState({
              user: {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                avatar: session.user.user_metadata.avatar,
                created_at: session.user.created_at,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
            avatar: session.user.user_metadata.avatar,
            created_at: session.user.created_at,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (state.isAuthenticated && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [state.isAuthenticated]);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          },
        },
      });

      if (error) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: error.message };
      }

      // If email confirmation is required, user might be null here
      if (data.user && !data.session) {
        return { success: true, error: 'Please check your email for confirmation link.' };
      }

      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.user?.email) return { success: false, error: 'No user logged in' };

    try {
      // 1. Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: state.user.email,
        password: currentPassword,
      });

      if (signInError) {
        return { success: false, error: 'Incorrect current password' };
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, [state.user]);

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; avatar?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: data
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    changePassword,
    signInWithGoogle,
    updateProfile,
  };
}
