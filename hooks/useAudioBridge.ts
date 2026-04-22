'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AudioBridgeReturn {
    isConnecting: boolean;
    isConnected: boolean;
    remoteStream: MediaStream | null;
    initiateBridge: (targetDeviceId: string, type?: 'audio' | 'video') => Promise<void>;
    terminateBridge: () => void;
    currentTargetId: React.MutableRefObject<string | null>;
    requestCollaboration: (email: string, pin: string) => Promise<{ success: boolean; error?: string }>;
    externalNodes: any[];
}

export function useAudioBridge(user: any): AudioBridgeReturn {
    const supabase = useMemo(() => createClient(), []);
    const instanceId = useMemo(() => Math.random().toString(36).slice(2, 9), []);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    
    const deviceId = useMemo(() => {
        if (typeof window === 'undefined') return 'root';
        return localStorage.getItem('neural_device_id') || 'root';
    }, []);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const currentTargetId = useRef<string | null>(null);
    const [externalNodes, setExternalNodes] = useState<any[]>([]);

    const cleanup = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream.current) {
            localStream.current.getTracks().forEach(t => t.stop());
            localStream.current = null;
        }
        setRemoteStream(null);
        setIsConnected(false);
        setIsConnecting(false);
        currentTargetId.current = null;
    }, []);

    const createPeerConnection = useCallback((targetId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = async (event) => {
            if (event.candidate && user) {
                await supabase.from('device_commands').insert({
                    sender_id: user.id,
                    target_device_id: targetId,
                    command: 'SIGNAL_ICE',
                    payload: event.candidate.toJSON()
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            setIsConnected(true);
            setIsConnecting(false);
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                cleanup();
            }
        };

        peerConnection.current = pc;
        return pc;
    }, [user, supabase, cleanup]);

    const initiateBridge = async (targetId: string, type: 'audio' | 'video' = 'audio') => {
        if (!user) return;
        setIsConnecting(true);
        currentTargetId.current = targetId;

        try {
            const pc = createPeerConnection(targetId);
            
            // Controller doesn't need to send its own mic, just receive
            pc.addTransceiver('audio', { direction: 'recvonly' });
            if (type === 'video') {
                pc.addTransceiver('video', { direction: 'recvonly' });
            }

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await supabase.from('device_commands').insert({
                sender_id: user.id,
                target_device_id: targetId,
                command: type === 'video' ? 'START_VIDEO_STREAM' : 'START_AUDIO_STREAM',
                payload: { sdp: offer.sdp, type: offer.type }
            });

            toast.info('Neural Link Initialized', { description: `Waiting for remote node to bridge ${type} stream...` });
        } catch (err: any) {
            console.error('Bridge Failure:', err);
            toast.error('Bridge Connection Failed');
            cleanup();
        }
    };

    const requestCollaboration = async (email: string, pin: string) => {
        if (!user) return { success: false, error: 'Authentication required' };
        try {
            // 1. Resolve Email to UserID
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();
            
            if (pError || !profile) throw new Error('Neural Node not found in registry.');

            // 2. Send Collaboration Request
            await supabase.from('device_commands').insert({
                sender_id: user.id,
                target_user_id: profile.id,
                target_device_id: 'ALL',
                command: 'COLLABORATION_REQUEST',
                payload: { pin, sender_email: user.email, sender_label: 'Remote Investigator' }
            });

            toast.success('Handshake Dispatched', { description: 'Waiting for node approval...' });
            return { success: true };
        } catch (err: any) {
            toast.error('Handshake Failed', { description: err.message });
            return { success: false, error: err.message };
        }
    };

    // Listener for Incoming Commands (Signaling)
    useEffect(() => {
        if (!user || typeof window === 'undefined') return;

        const channel = supabase
            .channel(`device_commands:${deviceId}:${instanceId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'device_commands',
                filter: `target_device_id=eq.${deviceId}`
            }, async (payload: any) => {
                const { command, sender_id, payload: data } = payload.new;

                if (command === 'START_AUDIO_STREAM' || command === 'START_VIDEO_STREAM') {
                    // Target Node: Received request to stream audio/video
                    try {
                        const constraints = command === 'START_VIDEO_STREAM' 
                            ? { audio: true, video: { facingMode: 'user' } }
                            : { audio: true };
                        
                        const stream = await navigator.mediaDevices.getUserMedia(constraints);
                        localStream.current = stream;

                        const pc = createPeerConnection(sender_id); 
                        stream.getTracks().forEach(track => pc.addTrack(track, stream));

                        await pc.setRemoteDescription(new RTCSessionDescription(data));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        await supabase.from('device_commands').insert({
                            sender_id: user.id,
                            target_device_id: sender_id,
                            command: 'SIGNAL_SDP',
                            payload: { sdp: answer.sdp, type: answer.type }
                        });
                        
                        toast.success('Remote Intelligence Bridged', { description: `${command.includes('VIDEO') ? 'Video' : 'Audio'} stream established with controller.` });
                    } catch (err) {
                        console.error('Incoming Bridge Failure:', err);
                    }
                }
 else if (command === 'SIGNAL_SDP') {
                    // Controller Node: Received Answer
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data));
                    }
                } else if (command === 'SIGNAL_ICE') {
                    // Both Nodes: Received ICE candidate
                    if (peerConnection.current) {
                        try {
                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
                        } catch (e) { console.error('ICE Error:', e); }
                    }
                } else if (command === 'COLLABORATION_REQUEST') {
                    // Show Notification for approval (handled by UI components listening to this toast)
                    toast('Incoming Handshake', {
                        description: `User ${data.sender_email} is requesting a Neural Link. PIN: ${data.pin}`,
                        action: {
                            label: 'Approve',
                            onClick: async () => {
                                // Send Approval
                                await supabase.from('device_commands').insert({
                                    sender_id: user.id,
                                    target_user_id: sender_id,
                                    target_device_id: 'ALL',
                                    command: 'COLLABORATION_APPROVED',
                                    metadata: { device_id: deviceId, label: 'Approved External Node' }
                                });
                                toast.success('Neural Access Granted');
                            }
                        }
                    });
                } else if (command === 'COLLABORATION_APPROVED') {
                    // Controller: Add to external nodes list
                    setExternalNodes(prev => [...prev, { 
                        user_id: sender_id, 
                        device_id: data.device_id, 
                        label: data.label,
                        is_external: true 
                    }]);
                    toast.success('Handshake Successful', { description: 'External node now visible in your cluster.' });
                } else if (command === 'STOP_AUDIO_STREAM') {
                    cleanup();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase, deviceId, instanceId, createPeerConnection, cleanup]);

    return {
        isConnecting,
        isConnected,
        remoteStream,
        initiateBridge,
        terminateBridge: cleanup,
        currentTargetId,
        requestCollaboration,
        externalNodes
    };
}
