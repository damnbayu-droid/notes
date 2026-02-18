import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Square, Send, RefreshCcw, Globe, Download, FileText, File, FilePenLine } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdvancedVoiceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSendToAI: (text: string) => void;
}

export function AdvancedVoiceDialog({ isOpen, onClose, onSendToAI }: AdvancedVoiceDialogProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState('en-US');
    const [recordingTime, setRecordingTime] = useState(0);

    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Supported Languages
    const languages = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'id-ID', name: 'Bahasa Indonesia' },
        { code: 'ms-MY', name: 'Bahasa Melayu' },
        { code: 'jv-ID', name: 'Basa Jawa' },
        { code: 'su-ID', name: 'Basa Sunda' },
        { code: 'th-TH', name: 'Thai' },
        { code: 'vi-VN', name: 'Vietnamese' },
        { code: 'fil-PH', name: 'Filipino' },
    ];

    useEffect(() => {
        if (isOpen && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language;

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Append final to existing, show interim
                if (finalTranscript) {
                    setTranscript(prev => prev + ' ' + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                        detail: { title: 'Microphone Error', message: 'Access denied', type: 'error' }
                    }));
                    stopRecording();
                }
            };

            recognitionRef.current.onend = () => {
                // Auto-restart if still recording (for continuous listening)
                if (isRecording) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        // ignore
                    }
                }
            };
        }

        return () => {
            stopRecording();
        };
    }, [isOpen, language]);

    // Update language dynamically
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = language;
        }
    }, [language]);

    const startRecording = () => {
        setTranscript(''); // Clear previous
        try {
            recognitionRef.current?.start();
            setIsRecording(true);
            setRecordingTime(0);
            window.dispatchEvent(new CustomEvent('dynamic-status', {
                detail: { type: 'record', text: 'Recording Voice...', duration: 0 }
            }));
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (e) {
            console.error(e);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: "Could not start recording", type: 'error' }
            }));
        }
    };

    const stopRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            window.dispatchEvent(new CustomEvent('dynamic-status', { detail: null }));
        }
    };

    const handleClose = () => {
        stopRecording();
        onClose();
    };

    const handleSend = () => {
        if (!transcript.trim()) {
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: "Please record something first", type: 'error' }
            }));
            return;
        }
        onSendToAI(transcript);
        handleClose();
        window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: { title: 'Success', message: "Sent to AI Assistant", type: 'success' }
        }));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-xl border-violet-100 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        <Mic className="w-6 h-6 text-violet-600" />
                        Voice Note
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* ... (Language and Visualizer code remains same logic, assumed unchanged in this block if not touching) ... */}

                    {/* Language Selector */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Globe className="w-4 h-4" />
                            Language
                        </div>
                        <Select value={language} onValueChange={setLanguage} disabled={isRecording}>
                            <SelectTrigger className="w-full border-violet-200 focus:ring-violet-500">
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Recording Visualizer / Status */}
                    <div className="flex flex-col items-center justify-center py-8 gap-4 bg-violet-50/50 rounded-2xl border border-violet-100 border-dashed">
                        {isRecording ? (
                            <>
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                                    <div className="absolute inset-2 bg-red-500 rounded-full animate-pulse opacity-40"></div>
                                    <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-red-100">
                                        <Mic className="w-8 h-8 text-red-500" />
                                    </div>
                                </div>
                                <div className="font-mono text-2xl font-bold text-red-600">
                                    {formatTime(recordingTime)}
                                </div>
                                <p className="text-xs text-red-400 font-medium animate-pulse">Listening...</p>
                            </>
                        ) : (
                            <div
                                onClick={startRecording}
                                className="w-20 h-20 bg-white hover:bg-violet-50 rounded-full flex items-center justify-center shadow-lg border-2 border-violet-100 cursor-pointer transition-all hover:scale-105 group"
                            >
                                <Mic className="w-8 h-8 text-violet-400 group-hover:text-violet-600" />
                            </div>
                        )}
                    </div>

                    {/* Transcript Area */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transcript</label>
                        <Textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Your speech will appear here..."
                            className="min-h-[100px] border-violet-100 focus:border-violet-300 bg-white/50 resize-none text-base"
                        />
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 w-full sm:w-auto"
                    >
                        Cancel
                    </Button>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {isRecording ? (
                            <Button
                                variant="destructive"
                                onClick={stopRecording}
                                className="w-full sm:w-auto"
                            >
                                <Square className="w-4 h-4 mr-2" /> Stop
                            </Button>
                        ) : (
                            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={startRecording}
                                    className="w-full sm:w-auto border-violet-200 text-violet-700 hover:bg-violet-50 col-span-2 sm:col-span-1"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </Button>
                                {/* Export Options */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="gap-2 text-violet-700 border-violet-200 w-full sm:w-auto" disabled={!transcript}>
                                            <Download className="w-4 h-4" />
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => {
                                            const blob = new Blob([transcript], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `voice-note-${new Date().toISOString()}.txt`;
                                            a.click();
                                        }}>
                                            <FileText className="w-4 h-4 mr-2" /> Save to TXT
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                            // Simple PDF export
                                            import('pdf-lib').then(async ({ PDFDocument, StandardFonts, rgb }) => {
                                                const pdfDoc = await PDFDocument.create();
                                                const page = pdfDoc.addPage();
                                                const { width, height } = page.getSize();
                                                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                                                page.drawText(transcript, {
                                                    x: 50,
                                                    y: height - 50,
                                                    size: 12,
                                                    font: font,
                                                    color: rgb(0, 0, 0),
                                                    maxWidth: width - 100,
                                                });
                                                const pdfBytes = await pdfDoc.save();
                                                const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `voice-note-${new Date().toISOString()}.pdf`;
                                                a.click();
                                            });
                                        }}>
                                            <File className="w-4 h-4 mr-2" /> Save to PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    onClick={() => {
                                        // Dispatch event to create note
                                        window.dispatchEvent(new CustomEvent('create-new-note', {
                                            detail: { title: 'Voice Note', content: transcript }
                                        }));
                                        handleClose();
                                        window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                            detail: { title: 'Success', message: 'Note Created!', type: 'success' }
                                        }));
                                    }}
                                    disabled={!transcript}
                                    variant="secondary"
                                    className="bg-violet-100 text-violet-700 hover:bg-violet-200 w-full sm:w-auto"
                                >
                                    <FilePenLine className="w-4 h-4 mr-2" />
                                    Save
                                </Button>
                            </div>
                        )}

                        <Button
                            onClick={handleSend}
                            disabled={!transcript || isRecording}
                            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white mt-2 sm:mt-0"
                        >
                            <Send className="w-4 h-4 mr-2" /> AI
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
