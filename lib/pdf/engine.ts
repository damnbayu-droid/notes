import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Configure PDF.js Worker for v4+
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  thumbnailUrl: string;
}

export class PDFEngine {
  /**
   * Loads a PDF and extracts metadata + thumbnails for all pages
   */
  static async loadMetadata(file: File): Promise<{ doc: any, pages: PDFPageInfo[] }> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pageInfos: PDFPageInfo[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 }); // Thumbnail scale
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        pageInfos.push({
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8)
        });
      }
    }
    
    return { doc: pdf, pages: pageInfos };
  }

  /**
   * Renders a specific page to a high-res canvas for editing
   */
  static async renderPageToCanvas(pdf: any, pageNum: number, canvas: HTMLCanvasElement, scale: number = 1.5) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const context = canvas.getContext('2d');
    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
    }
  }

  /**
   * Applies annotations to the actual PDF bytes using pdf-lib
   */
  static async applyAnnotations(originalBytes: Uint8Array, pageAnnotations: Record<number, any>): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(originalBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Iterate through pages that have annotations
    for (const [pageStr, json] of Object.entries(pageAnnotations)) {
      const pageIdx = parseInt(pageStr) - 1;
      const page = pages[pageIdx];
      if (!page || !json.objects) continue;

      const { width, height } = page.getSize();
      
      // Fabric canvas was initialized at scale 1.0 relative to PDF points
      for (const obj of json.objects) {
        if (obj.type === 'i-text' || obj.type === 'text') {
          const color = typeof obj.fill === 'string' ? this.hexToRgb(obj.fill) : { r: 0, g: 0, b: 0 };
          page.drawText(obj.text, {
            x: obj.left,
            y: height - obj.top - (obj.fontSize * 0.8), // Adjust for baseline
            size: obj.fontSize,
            font: obj.fontWeight === 'bold' ? boldFont : font,
            color: rgb(color.r, color.g, color.b),
          });
        } else if (obj.type === 'image') {
          try {
            const imgData = obj.src;
            const isPng = imgData.includes('image/png');
            const img = isPng 
              ? await pdfDoc.embedPng(imgData) 
              : await pdfDoc.embedJpg(imgData);
            
            page.drawImage(img, {
              x: obj.left,
              y: height - obj.top - (obj.height * (obj.scaleY || 1)),
              width: obj.width * (obj.scaleX || 1),
              height: obj.height * (obj.scaleY || 1),
            });
          } catch (e) { console.error('Failed to embed image:', e); }
        } else if (obj.type === 'rect') {
           const color = typeof obj.fill === 'string' ? this.hexToRgb(obj.fill) : { r: 1, g: 1, b: 1 };
           page.drawRectangle({
             x: obj.left,
             y: height - obj.top - obj.height,
             width: obj.width,
             height: obj.height,
             color: rgb(color.r, color.g, color.b),
           });
        } else if (obj.type === 'ellipse') {
           const color = typeof obj.stroke === 'string' ? this.hexToRgb(obj.stroke) : { r: 1, g: 0, b: 0 };
           page.drawEllipse({
             x: obj.left + obj.rx,
             y: height - obj.top - obj.ry,
             xRadius: obj.rx,
             yRadius: obj.ry,
             borderColor: rgb(color.r, color.g, color.b),
             borderWidth: obj.strokeWidth || 1,
           } as any);
        }
      }
    }

    return await pdfDoc.save();
  }

  private static hexToRgb(hex: string): { r: number, g: number, b: number } {
    if (hex.startsWith('rgba')) {
        const parts = hex.match(/[\d.]+/g);
        if (parts) return { r: parseInt(parts[0])/255, g: parseInt(parts[1])/255, b: parseInt(parts[2])/255 };
    }
    if (hex.startsWith('#')) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
    }
    if (hex === 'black') return { r: 0, g: 0, b: 0 };
    if (hex === 'white') return { r: 1, g: 1, b: 1 };
    return { r: 0, g: 0, b: 0 };
  }

  /**
   * Merges multiple PDF files into a single document
   */
  static async mergePDFs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
  }

  /**
   * Splits a PDF into multiple documents based on page ranges
   */
  static async splitPDF(file: File, ranges: { start: number, end: number }[]): Promise<Uint8Array[]> {
    const originalBytes = await file.arrayBuffer();
    const results: Uint8Array[] = [];
    
    for (const range of ranges) {
      const newPdf = await PDFDocument.create();
      const originalPdf = await PDFDocument.load(originalBytes);
      const indices = Array.from(
        { length: range.end - range.start + 1 }, 
        (_, i) => range.start - 1 + i
      );
      const copiedPages = await newPdf.copyPages(originalPdf, indices);
      copiedPages.forEach(page => newPdf.addPage(page));
      results.push(await newPdf.save());
    }
    return results;
  }

  /**
   * Compresses a PDF by re-saving it with optimized settings
   */
  static async compressPDF(file: File): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(bytes);
    // pdf-lib's save() with useObjectStreams: true provides basic compression
    return await pdfDoc.save({ useObjectStreams: true });
  }

  /**
   * Converts a collection of images into a single PDF document
   */
  static async imagesToPDF(images: File[], layout: string = 'A4'): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const sizes: Record<string, [number, number]> = {
      'A4': [595.28, 841.89],
      'Letter': [612, 792],
      'Legal': [612, 1008]
    };
    const [targetW, targetH] = sizes[layout] || sizes['A4'];

    for (const imageFile of images) {
      const imgBytes = await imageFile.arrayBuffer();
      const img = imageFile.type === 'image/png' 
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);
      
      const page = pdfDoc.addPage([targetW, targetH]);
      const { width, height } = img.scaleToFit(targetW - 40, targetH - 40);
      
      page.drawImage(img, {
        x: (targetW - width) / 2,
        y: (targetH - height) / 2,
        width,
        height,
      });
    }
    return await pdfDoc.save();
  }
}
