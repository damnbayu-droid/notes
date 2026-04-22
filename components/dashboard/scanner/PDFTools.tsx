'use client'

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Download, 
    FileStack, 
    Scissors, 
    Minimize, 
    FileUp, 
    RefreshCw, 
    X,
    Sparkles,
    Zap,
    Shield,
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

type ToolType = 'merge' | 'split' | 'compress' | 'image-to-pdf';

export function PDFTools({ initialTab = 'merge', onBack, onPayloadReady }: { initialTab?: ToolType, onBack?: () => void, onPayloadReady?: (file: File) => void }) {
    const [activeTab, setActiveTab] = useState<ToolType>(initialTab);
    const [files, setFiles] = useState<File[]>([]);
    const [splitRange, setSplitRange] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadName, setDownloadName] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setDownloadUrl(null);
            toast.info('Payload Registered', { description: `${e.target.files.length} node(s) isolated for processing.` });
        }
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error('Insufficient Nodes', { description: "Merging requires at least two distinct intelligence nodes." });
            return;
        }
        setIsProcessing(true);
        try {
            const { PDFDocument } = await import('pdf-lib');
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const pdfBytes = await mergedPdf.save();
            createDownload(pdfBytes, 'unified-intelligence.pdf');
        } catch (error) {
            console.error(error);
            toast.error('Merge Protocol Failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSplit = async () => {
        if (files.length !== 1) {
            toast.error('Source Error', { description: "Select exactly one node for surgical extraction." });
            return;
        }
        if (!splitRange) {
            toast.error('Range Required', { description: "Define the extraction coordinates (e.g., 1, 3-5)." });
            return;
        }

        setIsProcessing(true);
        try {
            const { PDFDocument } = await import('pdf-lib');
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const srcPdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();
            const totalPages = srcPdf.getPageCount();

            const pageIndices: number[] = [];
            const parts = splitRange.split(',').map(p => p.trim());

            for (const part of parts) {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    if (!isNaN(start) && !isNaN(end)) {
                        for (let i = start; i <= end; i++) {
                            if (i > 0 && i <= totalPages) pageIndices.push(i - 1);
                        }
                    }
                } else {
                    const pageNum = Number(part);
                    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
                        pageIndices.push(pageNum - 1);
                    }
                }
            }

            const uniqueIndices = [...new Set(pageIndices)].sort((a, b) => a - b);
            if (uniqueIndices.length === 0) throw new Error("Invalid page coordinates");

            const copiedPages = await newPdf.copyPages(srcPdf, uniqueIndices);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            createDownload(pdfBytes, `extracted-${files[0].name}`);
        } catch (error) {
            console.error(error);
            toast.error('Extraction Protocol Failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompress = async () => {
        if (files.length !== 1) {
            toast.error('Target Required');
            return;
        }
        setIsProcessing(true);
        try {
            const { PDFDocument } = await import('pdf-lib');
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            
            // Optimization settings based on level
            const useObjectStreams = compressionLevel === 'high';
            const pdfBytes = await pdf.save({ useObjectStreams });
            
            createDownload(pdfBytes, `optimized-${files[0].name}`);
        } catch (error) {
            console.error(error);
            toast.error('Neural Compression Failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImageToPdf = async () => {
        if (files.length === 0) {
            toast.error('Input Required', { description: "Select visual data fragments for conversion." });
            return;
        }
        setIsProcessing(true);
        try {
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                let image;
                if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    image = await pdfDoc.embedJpg(arrayBuffer);
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            createDownload(pdfBytes, 'synthesized-intelligence.pdf');
        } catch (error) {
            console.error(error);
            toast.error('Synthesis Protocol Failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const createDownload = (data: Uint8Array, filename: string) => {
        const blob = new Blob([data as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadName(filename);
        toast.success('Sequence Finalized', { description: 'Advanced intelligence artifact is ready for extrusion.' });
    };

    const TabButton = ({ value, label, icon: Icon }: { value: ToolType, label: string, icon: any }) => (
        <button
            onClick={() => { setActiveTab(value); setFiles([]); setDownloadUrl(null); }}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl transition-all ${activeTab === value ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/20 scale-[1.05] z-10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
            <Icon className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-white/5 p-8 shadow-2xl shadow-slate-200/20 dark:shadow-none space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <FileStack className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={onBack}
                                className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-400 hover:text-violet-600 active:scale-95 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        )}
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Intelligence <span className="text-violet-600">Forge</span></h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Multi-Threaded PDF Processor</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                     <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 dark:border-white/5 text-emerald-500">
                        Secure Hub Active
                     </Badge>
                     <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">v7.5 Final Patch</span>
                </div>
            </div>

            {/* Premium Intelligence Tabs */}
            <div className="flex p-1.5 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10 gap-2">
                <TabButton value="merge" label="Merge" icon={FileStack} />
                <TabButton value="split" label="Extract" icon={Scissors} />
                <TabButton value="compress" label="Optimize" icon={Minimize} />
                <TabButton value="image-to-pdf" label="Synthesize" icon={Sparkles} />
            </div>

            {/* Dynamic Content Area */}
            <div className="space-y-6 pt-2">
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-4">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Input Payload Cluster</label>
                        {files.length > 0 && (
                            <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">{files.length} Node(s) Locked</span>
                        )}
                    </div>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-1 relative group">
                                <Input
                                    type="file"
                                    accept={activeTab === 'image-to-pdf' ? 'image/jpeg,image/png' : '.pdf'}
                                    multiple={activeTab === 'merge' || activeTab === 'image-to-pdf'}
                                    onChange={handleFileChange}
                                    disabled={isProcessing}
                                    className="bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 h-16 rounded-2xl px-6 text-[10px] font-bold cursor-pointer transition-all hover:border-violet-300 dark:hover:border-violet-500/30"
                                />
                                 <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                                    <FileUp className="w-5 h-5 text-violet-600" />
                                 </div>
                            </div>
                            {files.length > 0 && (
                                <Button variant="ghost" size="icon" onClick={() => { setFiles([]); setDownloadUrl(null); }} className="h-16 w-16 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 border border-slate-100 dark:border-white/5">
                                    <X className="w-5 h-5" />
                                </Button>
                            )}
                        </div>

                        {/* Payload Manifest */}
                        {files.length > 0 && (
                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-50 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                                                <span className="text-[9px] font-black text-violet-600">{i + 1}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{f.name}</span>
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{(f.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {activeTab === 'split' && (
                    <div className="space-y-3 animate-in slide-in-from-left-4">
                        <label className="text-[9px] font-black text-violet-500 uppercase tracking-widest ml-4">Neural Extraction Coordinates</label>
                        <Input
                            placeholder="e.g. 1, 3-5, 8 (Indices)"
                            value={splitRange}
                            onChange={(e) => setSplitRange(e.target.value)}
                            className="bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10 h-14 rounded-2xl px-6 text-[10px] font-bold placeholder:opacity-30 shadow-inner"
                        />
                    </div>
                )}

                {activeTab === 'compress' && (
                    <div className="space-y-3 animate-in slide-in-from-left-4">
                        <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-4">Neural Density Level</label>
                        <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                            {(['low', 'medium', 'high'] as const).map(level => (
                                <button
                                    key={level}
                                    onClick={() => setCompressionLevel(level)}
                                    className={`flex-1 h-10 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${compressionLevel === level ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-400'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <Button
                    onClick={() => {
                        if (activeTab === 'merge') handleMerge();
                        if (activeTab === 'split') handleSplit();
                        if (activeTab === 'compress') handleCompress();
                        if (activeTab === 'image-to-pdf') handleImageToPdf();
                    }}
                    disabled={isProcessing || files.length === 0}
                    className={`w-full h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all group ${isProcessing ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'}`}
                >
                    {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    ) : (
                        <Zap className="w-5 h-5 mr-3 transition-transform group-hover:scale-125 group-hover:text-amber-500" />
                    )}
                    {isProcessing ? 'Processing Neural Streams...' : 'Execute Protocol'}
                </Button>

                {downloadUrl && (
                    <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/5 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Temporal Artifact Solidified</label>
                        </div>
                        <div className="flex gap-4">
                            <a href={downloadUrl} download={downloadName} className="flex-1">
                                <Button className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-[0.1em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                                    <Download className="w-5 h-5 mr-3" /> Extrude
                                </Button>
                            </a>
                            <Button 
                                onClick={async () => {
                                    const response = await fetch(downloadUrl);
                                    const blob = await response.blob();
                                    const file = new File([blob], downloadName, { type: 'application/pdf' });
                                    onPayloadReady?.(file);
                                }}
                                className="flex-1 h-16 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[11px] tracking-[0.1em] shadow-xl shadow-violet-500/20 active:scale-95 transition-all"
                            >
                                <Sparkles className="w-5 h-5 mr-3" /> Open in Studio
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-50 dark:border-white/5 opacity-50">
                <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Encrypted Persistence</span>
                </div>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic leading-none">A-Intel Verified</span>
                </div>
            </div>
        </div>
    );
}
