'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { openDB } from 'idb'

const DB_NAME = 'SmartNotes_Intelligence_Hub'
const STORE_NAME = 'recordings'

export function useBackgroundRecorder() {
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const saveChunk = async (blob: Blob) => {
        const db = await openDB(DB_NAME, 2)
        const id = `rec_${Date.now()}`
        await db.put(STORE_NAME, {
            id,
            blob,
            timestamp: Date.now(),
            type: blob.type.includes('audio') ? 'audio' : 'video'
        })
    }

    const startBackgroundRecording = useCallback(async (type: 'video' | 'audio') => {
        try {
            // 1. Keep App Alive (Median Bridge)
            if ((window as any).median) {
                (window as any).median.backgroundAudio.start();
            }

            const constraints = type === 'video' 
                ? { video: { facingMode: 'user' }, audio: true }
                : { audio: true }
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream
            
            const recorder = new MediaRecorder(stream, {
                mimeType: type === 'video' ? 'video/webm;codecs=vp8' : 'audio/webm'
            })
            mediaRecorderRef.current = recorder

            recorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    await saveChunk(e.data)
                }
            }

            // Start recording in 10s chunks for resilience
            recorder.start(10000) 
            setIsRecording(true)

            // Persistence Loop
            chunkIntervalRef.current = setInterval(() => {
                if (recorder.state === 'recording') {
                    recorder.requestData()
                }
            }, 10000)

        } catch (err) {
            console.error('Background Recorder Failed:', err)
        }
    }, [])

    const stopBackgroundRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
        }
        if (chunkIntervalRef.current) {
            clearInterval(chunkIntervalRef.current)
        }
        if ((window as any).median) {
            (window as any).median.backgroundAudio.stop();
        }
        setIsRecording(false)
    }, [])

    return {
        isBackgroundRecording: isRecording,
        startBackgroundRecording,
        stopBackgroundRecording
    }
}
