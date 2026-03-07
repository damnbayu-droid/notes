import { X, Shield, Bot, Database, Book, Scan, Mic, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartInfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SmartInfoPanel({ isOpen, onClose }: SmartInfoPanelProps) {
    if (!isOpen) return null;

    const features = [
        {
            icon: Shield,
            title: "Secure Encryption",
            description: "AES-GCM 256-bit encryption. Your notes are locked with your own keys.",
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            icon: Bot,
            title: "AI Integration",
            description: "Smart organization, voice commands, and intelligent content suggestions.",
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-900/20"
        },
        {
            icon: Database,
            title: "Local Storage",
            description: "Sync with your device's file system for complete offline ownership.",
            color: "text-indigo-600",
            bg: "bg-indigo-50 dark:bg-indigo-900/20"
        },
        {
            icon: Book,
            title: "Book Mode",
            description: "Transform your collections into beautiful, readable digital books.",
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
            icon: Scan,
            title: "Smart Scanner",
            description: "Digitize documents and handwriting with high-precision OCR.",
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-900/20"
        },
        {
            icon: Mic,
            title: "Voice Recorder",
            description: "Capture voice notes and auto-transcribe them with Note Ai.",
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20"
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-violet-100 dark:border-violet-900/30 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative p-6 sm:p-8 bg-gradient-to-br from-violet-600 to-purple-600 text-white">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Zap className="w-6 h-6 fill-white" />
                        </div>
                        <h2 className="text-2xl font-bold">Smart Notes Mastery</h2>
                    </div>
                    <p className="text-violet-100 text-sm sm:text-base max-w-md">
                        The ultimate secured and encrypted workspace for your brilliant ideas, powered by advanced AI and local-first technology.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="p-6 sm:p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-2xl border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-all group ${f.bg}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm transition-transform group-hover:scale-110 ${f.color}`}>
                                        <f.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{f.title}</h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {f.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>End-to-End Encrypted & Privacy Guaranteed</span>
                    </div>
                    <Button
                        onClick={onClose}
                        className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-8"
                    >
                        Got it, Let's Write!
                    </Button>
                </div>
            </div>
        </div>
    );
}
