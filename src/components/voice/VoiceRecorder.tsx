import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, RefreshCcw } from 'lucide-react';


interface VoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    onTranscriptionChunk?: (text: string) => void;
    onInterimTranscription?: (text: string) => void;
    className?: string;
}

export function VoiceRecorder({ onRecordingComplete, onTranscriptionChunk, onInterimTranscription, className }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const isRecordingRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Speech Recognition if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (interimTranscript && onInterimTranscription) {
                    onInterimTranscription(interimTranscript);
                } else if (!interimTranscript && onInterimTranscription) {
                    onInterimTranscription(''); // Clear interim when finalized
                }

                if (finalTranscript && onTranscriptionChunk) {
                    onTranscriptionChunk(finalTranscript + ' ');
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                        detail: { title: 'Microphone Error', message: 'Access denied for transcription', type: 'error' }
                    }));
                }
            };

            recognitionRef.current.onend = () => {
                // Auto-restart if still recording
                if (isRecordingRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        // ignore
                    }
                }
            };
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [onTranscriptionChunk, onInterimTranscription]);

    const startRecording = async () => {
        try {
            // Request permissions just in case, but rely purely on SpeechRecognition
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Speech Recognition
            if (recognitionRef.current && (onTranscriptionChunk || onInterimTranscription)) {
                try {
                    recognitionRef.current.start();
                    setIsTranscribing(true);
                } catch (e) {
                    console.error("Recognition start failed", e);
                }
            }

            // Timer
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            setIsRecording(true);
            isRecordingRef.current = true;
        } catch (error) {
            console.error('Error starting recording:', error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Microphone Error', message: 'Could not access microphone', type: 'error' }
            }));
        }
    };

    const stopRecording = () => {
        if (isRecordingRef.current) {
            setIsRecording(false);
            isRecordingRef.current = false;
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsTranscribing(false);
            }
            onRecordingComplete(new Blob()); // Dummy blob since we removed MediaRecorder
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {isRecording ? (
                <div className="flex items-center gap-3 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-mono font-medium text-red-600 w-10">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                    {isTranscribing && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <RefreshCcw className="w-3 h-3 animate-spin" />
                            Transcribing
                        </div>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-full hover:bg-red-200 text-red-600"
                        onClick={stopRecording}
                    >
                        <Square className="w-4 h-4 fill-current" />
                    </Button>
                </div>
            ) : (
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-gray-600 hover:text-violet-600 hover:border-violet-200"
                    onClick={startRecording}
                    title="Record Voice Note"
                >
                    <Mic className="w-4 h-4" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">Record</span>
                </Button>
            )}
        </div>
    );
}
