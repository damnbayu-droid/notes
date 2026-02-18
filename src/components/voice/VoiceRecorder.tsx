import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, RefreshCcw } from 'lucide-react';


interface VoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    onTranscriptionComplete?: (text: string) => void;
    className?: string;
}

export function VoiceRecorder({ onRecordingComplete, onTranscriptionComplete, className }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
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
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript && onTranscriptionComplete) {
                    onTranscriptionComplete(finalTranscript + ' ');
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
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [onTranscriptionComplete]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Audio Recording
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();

            // Speech Recognition
            if (recognitionRef.current && onTranscriptionComplete) {
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
        } catch (error) {
            console.error('Error starting recording:', error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Microphone Error', message: 'Could not access microphone', type: 'error' }
            }));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsTranscribing(false);
            }
            setIsRecording(false);
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
