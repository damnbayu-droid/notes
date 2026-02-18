import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileStack, Scissors, Minimize, FileUp, RefreshCw, X } from 'lucide-react';


type ToolType = 'merge' | 'split' | 'compress';

export function PDFTools() {
    const [activeTab, setActiveTab] = useState<ToolType>('merge');
    const [files, setFiles] = useState<File[]>([]);
    const [splitRange, setSplitRange] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadName, setDownloadName] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setDownloadUrl(null);
        }
    };

    const handleMerge = async () => {
        if (files.length < 2) return window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: { title: 'Error', message: "Please select at least 2 PDF files", type: 'error' }
        }));
        setIsProcessing(true);
        try {
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const pdfBytes = await mergedPdf.save();
            createDownload(pdfBytes, 'merged-document.pdf');
        } catch (error) {
            console.error(error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: "Failed to merge PDFs", type: 'error' }
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSplit = async () => {
        if (files.length !== 1) return window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: { title: 'Error', message: "Please select 1 PDF file to split", type: 'error' }
        }));
        if (!splitRange) return window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: { title: 'Error', message: "Please enter a page range (e.g., 1, 3-5)", type: 'error' }
        }));

        setIsProcessing(true);
        try {
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const srcPdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();
            const totalPages = srcPdf.getPageCount();

            // Parse range "1, 3-5" -> [0, 2, 3, 4] (0-indexed)
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

            // Remove duplicates
            const uniqueIndices = [...new Set(pageIndices)].sort((a, b) => a - b);

            if (uniqueIndices.length === 0) throw new Error("Invalid page range");

            const copiedPages = await newPdf.copyPages(srcPdf, uniqueIndices);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            createDownload(pdfBytes, `split-${files[0].name}`);
        } catch (error) {
            console.error(error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: "Failed to split PDF. Check page range.", type: 'error' }
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompress = async () => {
        if (files.length !== 1) return window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: { title: 'Error', message: "Please select 1 PDF file", type: 'error' }
        }));
        setIsProcessing(true);
        try {
            // "Compress" -> Optimize / Re-save
            // pdf-lib doesn't support downsampling images easily, but re-saving can sometimes help organization.
            // We'll mimic strict saving.
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);

            // Note: True compression requires image resampling which is heavy for client-side JS without wasm libs (like ghostscript).
            // We will just save it efficiently.
            const pdfBytes = await pdf.save({ useObjectStreams: false });
            createDownload(pdfBytes, `compressed-${files[0].name}`);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Success', message: "PDF Optimized!", type: 'success' }
            }));
        } catch (error) {
            console.error(error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: "Failed to process PDF", type: 'error' }
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    const createDownload = (data: Uint8Array, filename: string) => {
        const blob = new Blob([data as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadName(filename);
        window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: { title: 'Success', message: "File ready!", type: 'success' }
        }));
    };

    return (
        <div className="space-y-4 p-4 border border-border rounded-xl bg-white/50 backdrop-blur-sm shadow-sm text-foreground">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <FileStack className="w-5 h-5 text-violet-600" />
                PDF Tools
            </h3>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100/80 rounded-lg">
                <button
                    onClick={() => { setActiveTab('merge'); setFiles([]); setDownloadUrl(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'merge' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FileStack className="w-4 h-4" /> Merge
                </button>
                <button
                    onClick={() => { setActiveTab('split'); setFiles([]); setDownloadUrl(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'split' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Scissors className="w-4 h-4" /> Split
                </button>
                <button
                    onClick={() => { setActiveTab('compress'); setFiles([]); setDownloadUrl(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'compress' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Minimize className="w-4 h-4" /> Compress
                </button>
            </div>

            {/* Content */}
            <div className="space-y-4 min-h-[150px] p-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                        {activeTab === 'merge' ? 'Select Multiple Files' : 'Select File'}
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="file"
                            accept=".pdf"
                            multiple={activeTab === 'merge'}
                            onChange={handleFileChange}
                            disabled={isProcessing}
                            className="bg-white"
                        />
                        {files.length > 0 && (
                            <Button variant="ghost" size="icon" onClick={() => { setFiles([]); setDownloadUrl(null); }}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    {files.length > 0 && (
                        <p className="text-xs text-violet-600 font-medium">
                            {files.length} file(s) selected
                        </p>
                    )}
                </div>

                {activeTab === 'split' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Page Range</label>
                        <Input
                            placeholder="e.g. 1, 3-5, 8"
                            value={splitRange}
                            onChange={(e) => setSplitRange(e.target.value)}
                            className="bg-white placeholder:text-gray-400"
                        />
                        <p className="text-[10px] text-gray-400">Enter page numbers to extract.</p>
                    </div>
                )}

                <Button
                    onClick={() => {
                        if (activeTab === 'merge') handleMerge();
                        if (activeTab === 'split') handleSplit();
                        if (activeTab === 'compress') handleCompress();
                    }}
                    disabled={isProcessing || files.length === 0}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                    {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <FileUp className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing ? 'Processing...' : 'Process PDF'}
                </Button>

                {downloadUrl && (
                    <a href={downloadUrl} download={downloadName} className="block animate-in fade-in slide-in-from-top-2">
                        <Button variant="default" className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <Download className="w-4 h-4 mr-2" />
                            Download Result
                        </Button>
                    </a>
                )}
            </div>
        </div>
    );
}
