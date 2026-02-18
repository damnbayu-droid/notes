import { useState } from 'react';
import { CameraView } from './CameraView';
import { PDFTools } from './PDFTools';
import { Button } from '@/components/ui/button';
import { PDFDocument } from 'pdf-lib';
import { X, FileImage, FileText, Loader2, Share2, Settings2, FileStack, Scissors, Minimize } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


export function ScannerPage() {
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);
    const [scanType, setScanType] = useState<'document' | 'photo'>('document');
    const [paperSize, setPaperSize] = useState<'a4' | 'f4' | 'letter'>('a4');

    const handleCapture = async (imageSrc: string) => {
        setIsCompressing(true);
        window.dispatchEvent(new CustomEvent('dynamic-status', {
            detail: { type: 'scan', text: 'Processing Scan...' }
        }));
        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            const options = {
                maxSizeMB: scanType === 'document' ? 0.5 : 2, // Aggressive compression for docs
                maxWidthOrHeight: 2160,
                useWebWorker: true,
                fileType: 'image/jpeg'
            };

            const compressedFile = await imageCompression(blob as File, options);
            const compressedUrl = URL.createObjectURL(compressedFile);

            setCapturedImages(prev => [...prev, compressedUrl]);
        } catch (error) {
            console.error('Compression error:', error);
            setCapturedImages(prev => [...prev, imageSrc]);
        } finally {
            setIsCompressing(false);
            window.dispatchEvent(new CustomEvent('dynamic-status', {
                detail: { type: 'info', text: 'Scan Saved', duration: 2000 }
            }));
        }
    };

    const removeImage = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const generatePDF = async () => {
        const pdfDoc = await PDFDocument.create();
        for (const imageSrc of capturedImages) {
            const jpgImageBytes = await fetch(imageSrc).then((res) => res.arrayBuffer());
            const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);

            // Page sizes in points (72 dpi)
            const sizes = {
                a4: [595.28, 841.89],
                letter: [612, 792],
                f4: [612, 936]
            };

            let pageWidth = jpgImage.width;
            let pageHeight = jpgImage.height;

            if (scanType === 'document') {
                const targetSize = sizes[paperSize] || sizes.a4;
                // Scale image to fit page, maintaining aspect ratio
                const scale = Math.min(targetSize[0] / pageWidth, targetSize[1] / pageHeight);
                pageWidth = targetSize[0];
                pageHeight = targetSize[1];

                const page = pdfDoc.addPage([pageWidth, pageHeight]);
                page.drawImage(jpgImage, {
                    x: (pageWidth - jpgImage.width * scale) / 2,
                    y: (pageHeight - jpgImage.height * scale) / 2,
                    width: jpgImage.width * scale,
                    height: jpgImage.height * scale,
                });
            } else {
                const page = pdfDoc.addPage([pageWidth, pageHeight]);
                page.drawImage(jpgImage, {
                    x: 0,
                    y: 0,
                    width: pageWidth,
                    height: pageHeight,
                });
            }
        }
        return await pdfDoc.save();
    };

    const downloadAsPDF = async () => {
        if (capturedImages.length === 0) return;
        try {
            const pdfBytes = await generatePDF();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scan-${new Date().toISOString()}.pdf`;
            a.click();
        } catch (error) {
            console.error('Error generating PDF:', error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: 'Failed to generate PDF', type: 'error' }
            }));
        }
    };

    const sharePDF = async () => {
        if (capturedImages.length === 0) return;
        try {
            const pdfBytes = await generatePDF();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
            const file = new File([blob], `scan-${Date.now()}.pdf`, { type: 'application/pdf' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Scanned Document',
                    text: 'Here is my scanned document from Smart Notes.',
                });
            } else {
                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                    detail: { title: 'Error', message: 'Sharing not supported on this device/browser.', type: 'error' }
                }));
            }
        } catch (error) {
            console.error("Share error:", error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: 'Failed to share', type: 'error' }
            }));
        }
    };

    const downloadAsImage = (format: 'jpeg' | 'png') => {
        capturedImages.forEach((src, idx) => {
            const a = document.createElement('a');
            a.href = src;
            a.download = `scan-${idx + 1}.${format}`;
            a.click();
        });
    };

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Smart Scanner
                </h1>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Settings2 className="w-4 h-4" />
                                {scanType === 'document' ? 'Document (A4)' : 'Photo'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Scan Mode</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setScanType('document')}>
                                Document (Optimized Text)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setScanType('photo')}>
                                Photo (High Quality)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Paper Size (Guide)</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setPaperSize('a4')}>A4</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPaperSize('f4')}>F4</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPaperSize('letter')}>Letter</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Camera & Preview */}
                <div className="lg:col-span-2 space-y-4">
                    <div className={`overflow-hidden rounded-xl border-2 ${scanType === 'document' ? 'border-violet-600 grayscale contrast-125' : 'border-transparent'}`}>
                        <CameraView onCapture={handleCapture} />
                    </div>

                    {isCompressing && (
                        <div className="flex items-center justify-center gap-2 text-sm text-violet-600 py-2 bg-violet-50 rounded-lg animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Optimizing scan...
                        </div>
                    )}

                    {capturedImages.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x">
                                {capturedImages.map((src, idx) => (
                                    <div key={idx} className="relative shrink-0 snap-center group">
                                        <img src={src} className="w-24 h-32 object-cover rounded-lg border-2 border-violet-100 shadow-sm" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                            {idx + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Button
                                    onClick={downloadAsPDF}
                                    className="col-span-2 bg-violet-600 hover:bg-violet-700 text-white"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Save PDF
                                </Button>
                                <Button
                                    onClick={sharePDF}
                                    variant="outline"
                                    className="col-span-1 border-violet-200 text-violet-700 hover:bg-violet-50"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="col-span-1">
                                            <FileImage className="w-4 h-4 mr-2" />
                                            Images
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => downloadAsImage('jpeg')}>
                                            Save as JPG
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => downloadAsImage('png')}>
                                            Save as PNG
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: PDF Tools (Sidebar on desktop, stacked on mobile) */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-violet-500" />
                            PDF Tools
                        </h3>
                        <div className="space-y-2">
                            <Button variant="ghost" className="w-full justify-start h-auto py-3 text-gray-600 hover:text-violet-600 hover:bg-violet-50">
                                <FileStack className="w-4 h-4 mr-3" />
                                <div className="text-left">
                                    <div className="font-medium">Merge PDFs</div>
                                    <div className="text-xs text-gray-400">Combine multiple files</div>
                                </div>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start h-auto py-3 text-gray-600 hover:text-violet-600 hover:bg-violet-50">
                                <Scissors className="w-4 h-4 mr-3" />
                                <div className="text-left">
                                    <div className="font-medium">Split PDF</div>
                                    <div className="text-xs text-gray-400">Extract pages</div>
                                </div>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start h-auto py-3 text-gray-600 hover:text-violet-600 hover:bg-violet-50">
                                <Minimize className="w-4 h-4 mr-3" />
                                <div className="text-left">
                                    <div className="font-medium">Compress PDF</div>
                                    <div className="text-xs text-gray-400">Reduce file size</div>
                                </div>
                            </Button>
                        </div>
                    </div>

                    {/* Existing PDFTools if needed, or replace/merge */}
                    <PDFTools />
                </div>
            </div>
        </div>
    );
}
