'use client'

import { useState, useEffect } from 'react';
import { 
    FileStack, 
    Scan, 
    FileEdit, 
    Eye, 
    Scissors, 
    Minimize, 
    FileImage, 
    ArrowLeft,
    Sparkles,
    Zap,
    Shield,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScannerView } from './ScannerView';
import { PDFStudio } from './PDFStudio';
import { PDFTools } from './PDFTools';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type SubView = 'dashboard' | 'scanner' | 'editor' | 'viewer' | 'merge' | 'split' | 'compress' | 'image-to-pdf';

export function PDFMaster() {
    const { user } = useAuth();
    const supabase = createClient();
    const [view, setView] = useState<SubView>('dashboard');
    const [scansUsed, setScansUsed] = useState(0);

    const isEnterprise = user?.subscription_tier === 'full-intelligence' || user?.subscription_tier === 'enterprise-hub' || user?.role === 'admin' || user?.isSuperAdmin || user?.email === 'damnbayu@gmail.com';

    useEffect(() => {
        const fetchLimits = async () => {
            if (!user || isEnterprise) return;
            try {
                const { data } = await supabase.from('profiles').select('pdf_scans_used').eq('id', user.id).single();
                if (data) setScansUsed(data.pdf_scans_used || 0);
            } catch (e) { console.error('Limit error', e); }
        };
        fetchLimits();
    }, [user, isEnterprise, supabase]);

    // Handle PWA Open PDF requests
    useEffect(() => {
        const handlePwaOpen = (e: any) => {
            setView('viewer');
        };
        window.addEventListener('pwa-open-pdf', handlePwaOpen);
        return () => window.removeEventListener('pwa-open-pdf', handlePwaOpen);
    }, []);

    const requireEnterprise = (targetView: SubView) => {
        // Free tier allows exactly 1 image-to-pdf conversion.
        if (isEnterprise) return true;
        
        if (targetView === 'image-to-pdf' || targetView === 'scanner') {
            if (scansUsed < 1) {
                return true; // Still have 1 scan left
            }
        }

        // If they reach here without being enterprise, they are blocked.
        toast.error('Intelligence Tier Restricted', { 
            description: 'Your scan limit is exhausted. Upgrade your neural link to Enterprise to continue.' 
        });
        window.dispatchEvent(new CustomEvent('open-payment-modal'));
        return false;
    };

    const tools = [
        {
            id: 'scanner',
            title: 'PDF Scanner',
            desc: 'High-fidelity AI document capture',
            icon: Scan,
            color: 'text-violet-600',
            bg: 'bg-violet-100 dark:bg-violet-950/40',
            border: 'border-violet-200 dark:border-violet-800'
        },
        {
            id: 'editor',
            title: 'PDF Editor',
            desc: 'Neural scribbling & annotations',
            icon: FileEdit,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-950/40',
            border: 'border-emerald-200 dark:border-emerald-800'
        },
        {
            id: 'viewer',
            title: 'PDF Viewer',
            desc: 'Optimized intelligence reading',
            icon: Eye,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-950/40',
            border: 'border-blue-200 dark:border-blue-800'
        },
        {
            id: 'merge',
            title: 'Merge PDF',
            desc: 'Unified node synchronization',
            icon: FileStack,
            color: 'text-amber-600',
            bg: 'bg-amber-100 dark:bg-amber-950/40',
            border: 'border-amber-200 dark:border-amber-800'
        },
        {
            id: 'split',
            title: 'Split PDF',
            desc: 'Surgical node extraction',
            icon: Scissors,
            color: 'text-rose-600',
            bg: 'bg-rose-100 dark:bg-rose-950/40',
            border: 'border-rose-200 dark:border-rose-800'
        },
        {
            id: 'compress',
            title: 'Compress PDF',
            desc: 'Temporal density optimization',
            icon: Minimize,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100 dark:bg-indigo-950/40',
            border: 'border-indigo-200 dark:border-indigo-800'
        },
        {
            id: 'image-to-pdf',
            title: 'Image to PDF',
            desc: 'Synthesize visual data fragments',
            icon: FileImage,
            color: 'text-cyan-600',
            bg: 'bg-cyan-100 dark:bg-cyan-950/40',
            border: 'border-cyan-200 dark:border-cyan-800'
        }
    ];

    const renderView = () => {
        switch (view) {
            case 'scanner':
                return <ScannerView onBack={() => setView('dashboard')} />;
            case 'editor':
                return <PDFStudio initialMode="edit" onBack={() => setView('dashboard')} />;
            case 'viewer':
                return <PDFStudio initialMode="view" onBack={() => setView('dashboard')} />;
            case 'merge':
            case 'split':
            case 'compress':
            case 'image-to-pdf':
                return <PDFTools initialTab={view as any} onBack={() => setView('dashboard')} />;
            default:
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Hero Section */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    <Sparkles className="w-4 h-4 text-violet-400" />
                                    Intelligence Suite v7.5
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
                                    PDF <span className="text-violet-600">Master</span>
                                </h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-lg">
                                    The definitive protocol for document intelligence, synthesis, and neural persistence.
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Encryption</p>
                                    <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-1 italic">Secured Mode</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Shield className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        {/* Intelligence Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tools.map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => {
                                        if (requireEnterprise(tool.id as SubView)) {
                                            setView(tool.id as SubView);
                                        }
                                    }}
                                    className={`group relative flex flex-col p-8 bg-white dark:bg-slate-900 border ${tool.border} rounded-[2.5rem] text-left transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95`}
                                >
                                    <div className={`w-14 h-14 ${tool.bg} ${tool.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-lg transition-all`}>
                                        <tool.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 italic flex items-center justify-between w-full">
                                        {tool.title}
                                        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        {tool.desc}
                                    </p>
                                    
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-5 transition-opacity">
                                        <Zap className="w-24 h-24" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Status Footer */}
                        <div className="flex items-center justify-center gap-8 pt-8 opacity-20 border-t border-slate-200 dark:border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-[0.5em]">Bali.Enterprises Persistence Hub</span>
                            <div className="w-1 h-1 rounded-full bg-slate-400" />
                            <span className="text-[9px] font-black uppercase tracking-[0.5em]">Multi-Batch Synthesis v7.5.0</span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 h-full"
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
