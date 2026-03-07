import { X, Shield, Bot, Database, Book, Scan, Mic, Clock, Zap } from 'lucide-react';
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
            title: "Secured & Encrypted",
            description: "Military-grade AES-GCM 256-bit encryption. Your data is encrypted locally before ever touching the cloud.",
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            icon: Bot,
            title: "Advanced AI Mastery",
            description: "Intelligent note summaries, auto-tagging, and real-time voice-to-text transcription powered by Note Ai.",
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-900/20"
        },
        {
            icon: Database,
            title: "Local-First Sync",
            description: "Connect directly to your device storage. Perfect for users who demand 100% data ownership and privacy.",
            color: "text-indigo-600",
            bg: "bg-indigo-50 dark:bg-indigo-900/20"
        },
        {
            icon: Clock,
            title: "Reminders & Alarms",
            description: "Integrated status notifications and Bali-Time alarms. Never miss a deadline with the Dynamic Notification Center.",
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20"
        },
        {
            icon: Book,
            title: "The Book Mode",
            description: "A premium reading experience that transforms your scattered notes into structured, elegant digital books.",
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
            icon: Scan,
            title: "Ultra Scanner",
            description: "High-performance camera scanner with OCR. Capture text from physical documents instantly into your library.",
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-900/20"
        },
        {
            icon: Mic,
            title: "Smart Recorder",
            description: "Lossless voice recording with dynamic visual feedback. Integrated directly with our AI transcription engine.",
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20"
        },
        {
            icon: Zap,
            title: "Dynamic Island",
            description: "Real-time system updates, recording status, and smart notifications delivered through a sleek interactive pill.",
            color: "text-pink-600",
            bg: "bg-pink-50 dark:bg-pink-900/20"
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-violet-100 dark:border-violet-900/30 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Header */}
                <div className="relative p-8 sm:p-12 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-6 right-6 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                        onClick={onClose}
                    >
                        <X className="w-6 h-6" />
                    </Button>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl ring-1 ring-white/30">
                                <Zap className="w-8 h-8 fill-white text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight">System Information</h2>
                                <p className="text-violet-100/80 font-bold text-xs uppercase tracking-widest leading-none mt-1">Version 2.4.0 Production Ready</p>
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-bold max-w-2xl mb-4 leading-tight">
                            Mastering your Smart Notes <span className="text-violet-200">Secured & Encrypted</span> Workspace.
                        </h1>
                        <p className="text-violet-100 text-sm sm:text-base max-w-xl opacity-90 leading-relaxed">
                            Discover the full potential of your workspace. From military-grade security to advanced AI-driven creativity, every feature is designed to put you in control.
                        </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="p-8 sm:p-12 overflow-y-auto max-h-[50vh] custom-scrollbar bg-gray-50/50 dark:bg-transparent">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className={`p-5 rounded-3xl border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-all group flex flex-col ${f.bg}`}
                            >
                                <div className={`p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-md w-fit mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 ${f.color}`}>
                                    <f.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm mb-2 uppercase tracking-tight">{f.title}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                    {f.description}
                                </p>
                            </div>
                        ))}

                        {/* Extra Status Card */}
                        <div className="p-5 rounded-3xl bg-black text-white lg:col-span-1 border border-white/10 flex flex-col justify-center items-center text-center gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-green-400">All Systems Operational</span>
                            </div>
                            <p className="text-[10px] opacity-60 font-medium">Synced with Supabase & Local DB</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-12 py-8 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                            <Shield className="w-4 h-4" />
                            <span>Privacy First Policy</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wide">ZERO data tracking. ZERO third-party access.</p>
                    </div>
                    <Button
                        onClick={onClose}
                        className="w-full sm:w-auto bg-black text-white hover:bg-gray-900 dark:bg-violet-600 dark:hover:bg-violet-700 rounded-2xl px-12 h-14 font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                    >
                        Explore Now
                    </Button>
                </div>
            </div>
        </div>
    );
}
