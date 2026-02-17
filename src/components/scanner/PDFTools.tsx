import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';

export function PDFTools() {
    const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleMerge = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsProcessing(true);

        try {
            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setMergedPdfUrl(url);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('Failed to merge PDFs. Ensure they are valid.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4 p-4 border border-border rounded-lg bg-card shadow-sm text-foreground">
            <h3 className="font-semibold text-lg text-foreground">PDF Tools (Offline)</h3>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">Merge PDFs</label>
                <div className="flex gap-2">
                    <Input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleMerge}
                        disabled={isProcessing}
                    />
                </div>
                <p className="text-xs text-gray-500">Select multiple PDF files to combine them.</p>
            </div>

            {mergedPdfUrl && (
                <a href={mergedPdfUrl} download="merged-document.pdf" className="inline-block w-full">
                    <Button className="w-full gap-2" variant="default">
                        <Download className="w-4 h-4" />
                        Download Merged PDF
                    </Button>
                </a>
            )}
        </div>
    );
}
