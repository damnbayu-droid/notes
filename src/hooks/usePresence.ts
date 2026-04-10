import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

export interface PresenceUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  online_at: string;
  is_typing?: boolean;
}

export function usePresence(noteId: string | null, user: User | null) {
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!noteId || !user) {
      setPresentUsers([]);
      return;
    }

    const channel = supabase.channel(`presence:${noteId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState)
          .flat()
          .map((p: any) => ({
            id: p.id,
            email: p.email,
            name: p.name || p.email.split('@')[0],
            avatar: p.avatar,
            online_at: p.online_at,
            is_typing: p.is_typing
          }));
        setPresentUsers(users as PresenceUser[]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [noteId, user]);

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!noteId || !user) return;
    const channel = supabase.channel(`presence:${noteId}`);
    await channel.track({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      online_at: new Date().toISOString(),
      is_typing: isTyping
    });
  };

  return { presentUsers, updateTypingStatus };
}
