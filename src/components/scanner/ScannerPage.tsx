import { useState } from 'react';
import { CameraView } from './CameraView';
import { PDFTools } from './PDFTools';
import { Button } from '@/components/ui/button';
import { PDFDocument } from 'pdf-lib';
import { Download, X } from 'lucide-react';

export function ScannerPage() {
    const [capturedImages, setCapturedImages] = useState<string[]>([]);

    const handleCapture = (imageSrc: string) => {
        setCapturedImages(prev => [...prev, imageSrc]);
    };

    const removeImage = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const generatePDF = async () => {
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
            const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `scan-${new Date().toISOString()}.pdf`;
            a.click();
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Document Scanner</h1>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Camera */}
                <div className="space-y-4">
                    <CameraView onCapture={handleCapture} />

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

                    <Button
                        onClick={generatePDF}
                        disabled={capturedImages.length === 0}
                        className="w-full gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Save as PDF
                    </Button>
                </div>

                {/* Right: Tools */}
                <div>
                    <PDFTools />
                </div>
            </div>
        </div>
    );
}
