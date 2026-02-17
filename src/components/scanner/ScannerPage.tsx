import { useState } from 'react';
import { CameraView } from './CameraView';
import { PDFTools } from './PDFTools';
import { Button } from '@/components/ui/button';
import { PDFDocument } from 'pdf-lib';
import { X, FileImage, FileText, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ScannerPage() {
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);

    const handleCapture = async (imageSrc: string) => {
        setIsCompressing(true);
        try {
            // Convert base64 to blob
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: 'image/jpeg'
            };

            const compressedFile = await imageCompression(blob as File, options);
            const compressedUrl = URL.createObjectURL(compressedFile);

            setCapturedImages(prev => [...prev, compressedUrl]);
        } catch (error) {
            console.error('Compression error:', error);
            // Fallback to original
            setCapturedImages(prev => [...prev, imageSrc]);
        } finally {
            setIsCompressing(false);
        }
    };

    const removeImage = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const downloadAsPDF = async () => {
        if (capturedImages.length === 0) return;

        try {
            const pdfDoc = await PDFDocument.create();

            for (const imageSrc of capturedImages) {
                const jpgImageBytes = await fetch(imageSrc).then((res) => res.arrayBuffer());
                const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);
                const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
                page.drawImage(jpgImage, {
                    x: 0,
                    y: 0,
                    width: jpgImage.width,
                    height: jpgImage.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scan-${new Date().toISOString()}.pdf`;
            a.click();
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const downloadAsImage = async (format: 'jpeg' | 'png') => {
        if (capturedImages.length === 0) return;

        // Download the last captured image or the selected one? 
        // Typically scanners export the current batch. If multiple, maybe zip? 
        // For simplicity, let's download all distinct images or the last one.
        // Let's implement downloading ALL as a sequence or just the last.
        // User said "options is pdf, jpg and png". 
        // Let's download each image individually for now to avoid JSZip dependency if not needed.

        capturedImages.forEach((src, idx) => {
            const a = document.createElement('a');
            a.href = src;
            a.download = `scan-${idx + 1}.${format}`;
            a.click();
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 bg-background text-foreground">
            <h1 className="text-2xl font-bold">Document Scanner</h1>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Camera */}
                <div className="space-y-4">
                    <CameraView onCapture={handleCapture} />

                    {isCompressing && (
                        <div className="flex items-center gap-2 text-sm text-violet-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Compressing image...
                        </div>
                    )}

                    {capturedImages.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {capturedImages.map((src, idx) => (
                                <div key={idx} className="relative shrink-0">
                                    <img src={src} className="w-20 h-20 object-cover rounded border" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={downloadAsPDF}
                            disabled={capturedImages.length === 0}
                            className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
                        >
                            <FileText className="w-4 h-4" />
                            Save PDF
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={capturedImages.length === 0} className="gap-2">
                                    <FileImage className="w-4 h-4" />
                                    Save Images
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => downloadAsImage('jpeg')}>
                                    Full Quality JPG
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadAsImage('png')}>
                                    Lossless PNG
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Right: Tools */}
                <div>
                    <PDFTools />
                </div>
            </div>
        </div>
    );
}
