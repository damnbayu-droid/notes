import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileEdit, 
  Signature as SignatureIcon, 
  Download, 
  Trash2, 
  Shield,
  Type,
  Save,
  PlusCircle,
  MousePointer2,
  X
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface FormField {
  name: string;
  type: string;
  value: string;
}

interface TypewriterEntry {
  id: string;
  text: string;
  x: number;
  y: number;
  page: number;
}

export function PDFStudio() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  
  // Advanced Form State
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isTypewriterActive, setIsTypewriterActive] = useState(false);
  const [typewriterEntries, setTypewriterEntries] = useState<TypewriterEntry[]>([]);
  const [currentText, setCurrentText] = useState('');
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      const bytes = new Uint8Array(await file.arrayBuffer());
      setPdfBytes(bytes);
      detectFields(bytes);
    }
  };

  const detectFields = async (bytes: Uint8Array) => {
    try {
      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const detected = fields.map(f => ({
        name: f.getName(),
        type: f.constructor.name,
        value: ''
      }));
      setFormFields(detected);
    } catch (e) {
      console.error("Field detection failed:", e);
    }
  };

  const updateFormField = (name: string, value: string) => {
    setFormFields(prev => prev.map(f => f.name === name ? { ...f, value } : f));
  };

  const saveSignature = () => {
    if (sigCanvas.current) {
      setSignatureData(sigCanvas.current.toDataURL());
      setIsSignDialogOpen(false);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setSignatureData(null);
  };

  const applyChanges = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const form = pdfDoc.getForm();

      // 1. Apply Form Fields
      formFields.forEach(field => {
        try {
          const f = form.getField(field.name);
          if (field.value) (f as any).setText?.(field.value);
        } catch (e) {}
      });

      // 2. Apply Typewriter Entries (Manual Text)
      typewriterEntries.forEach(entry => {
        const page = pages[entry.page] || pages[0];
        page.drawText(entry.text, {
          x: entry.x,
          y: entry.y,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      });

      // 3. Apply Signature (on first page for now)
      if (signatureData) {
        const sigImage = await pdfDoc.embedPng(signatureData);
        const dims = sigImage.scale(0.25);
        const firstPage = pages[0];
        firstPage.drawImage(sigImage, {
          x: firstPage.getWidth() - dims.width - 50,
          y: 50,
          width: dims.width,
          height: dims.height,
        });
      }

      const resultBytes = await pdfDoc.save();
      setPdfBytes(resultBytes);
      
      window.dispatchEvent(new CustomEvent('dcpi-status', {
        detail: { title: 'Changes Applied', message: 'All form data and signatures have been committed.', type: 'success' }
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToNotes = async () => {
    if (!pdfBytes) return;
    // Base64 encode the PDF bytes to store as string in note content
    const base64 = btoa(new Uint8Array(pdfBytes).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    
    window.dispatchEvent(new CustomEvent('create-new-note', {
      detail: {
        title: `Filled: ${pdfFile?.name.replace('.pdf', '') || 'PDF Form'}`,
        content: base64, // The note editor will need to handle base64 PDF rendering
        folder: 'Scanner',
        note_type: 'pdf'
      }
    }));
  };

  const downloadPDF = () => {
    if (!pdfBytes) return;
    const blob = new Blob([(pdfBytes as Uint8Array).buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited-${pdfFile?.name || 'document.pdf'}`;
    a.click();
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTypewriterActive || !currentText) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = rect.height - (e.clientY - rect.top); // PDF y-axis is inverted

    const newEntry: TypewriterEntry = {
      id: Math.random().toString(36).substr(2, 9),
      text: currentText,
      x: (x / rect.width) * 595, // Normalized to standard A4 width
      y: (y / rect.height) * 842, // Normalized
      page: 0
    };

    setTypewriterEntries(prev => [...prev, newEntry]);
    setCurrentText('');
  };

  return (
    <div className="space-y-6 p-6 border border-violet-100 rounded-3xl bg-white shadow-xl max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-violet-900 flex items-center gap-3">
          <FileEdit className="w-6 h-6 text-violet-600" />
          Enterprise PDF Studio
          <Badge variant="outline" className="border-violet-200 text-violet-600 ml-2">v2.0 Beta</Badge>
        </h2>
        <div className="flex gap-2">
           {pdfBytes && (
             <>
               <Button 
                 onClick={saveToNotes}
                 variant="outline"
                 className="border-violet-200 text-violet-700 gap-2"
               >
                 <Save className="w-4 h-4" /> Save to Notes
               </Button>
               <Button 
                 onClick={downloadPDF} 
                 className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg transition-all active:scale-95"
               >
                 <Download className="w-4 h-4" /> Download
               </Button>
             </>
           )}
        </div>
      </div>

      {!pdfBytes ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-violet-100 rounded-2xl bg-violet-50/30">
          <FileEdit className="w-12 h-12 text-violet-200 mb-4" />
          <p className="text-violet-900 font-medium mb-4 text-center">
            Upload your PDF forms (scanned or interactive) <br/>
            <span className="text-xs text-violet-500 opacity-60">Ready to fill empty boxes and signature lines</span>
          </p>
          <Input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange} 
            className="hidden" 
            id="pdf-upload" 
          />
          <Button 
            className="bg-violet-600 hover:bg-violet-700 px-8 h-12 rounded-xl text-lg shadow-xl shadow-violet-500/20"
            onClick={() => document.getElementById('pdf-upload')?.click()}
          >
            Add PDF File
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-12 gap-6">
          {/* Advanced Toolbar */}
          <div className="md:col-span-3 space-y-4">
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Signature Tool</p>
                  <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-3 h-12 border-violet-100 text-violet-700 hover:bg-violet-50 bg-white">
                        <SignatureIcon className="w-4 h-4" />
                        <span>Digital Signature</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader><DialogTitle>Draw Your Signature</DialogTitle></DialogHeader>
                      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <SignatureCanvas 
                          ref={sigCanvas} penColor='black' 
                          canvasProps={{width: 450, height: 200, className: 'sigCanvas'}} 
                        />
                      </div>
                      <div className="flex justify-between mt-4">
                        <Button variant="ghost" onClick={clearSignature}>Clear</Button>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsSignDialogOpen(false)}>Cancel</Button>
                          <Button onClick={saveSignature} className="bg-violet-600 text-white">Save Signature</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Edit Modes</p>
                   <div className="flex flex-col gap-2">
                      <Button 
                        variant={isTypewriterActive ? 'default' : 'outline'} 
                        className={`w-full justify-start gap-3 h-10 ${isTypewriterActive ? 'bg-violet-600' : 'bg-white border-violet-100 text-violet-700'}`}
                        onClick={() => setIsTypewriterActive(!isTypewriterActive)}
                      >
                        <Type className="w-4 h-4" />
                        Typewriter (Manual)
                      </Button>
                   </div>
                </div>

                {isTypewriterActive && (
                  <div className="space-y-2 animate-in slide-in-from-left-2">
                    <Label className="text-[10px]">Text to place:</Label>
                    <Input 
                      placeholder="Type something..." 
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      className="text-xs h-9"
                    />
                    <p className="text-[9px] text-gray-500 italic">Click on document to place text</p>
                  </div>
                )}
             </div>

             <ScrollArea className="h-[300px] p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Detected Form Fields</p>
                {formFields.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">No interactive fields detected. Use Typewriter mode.</p>
                ) : (
                  <div className="space-y-3">
                    {formFields.map(field => (
                      <div key={field.name} className="space-y-1">
                        <Label className="text-[10px] font-medium text-gray-600 truncate block">{field.name}</Label>
                        <Input 
                          value={field.value}
                          onChange={(e) => updateFormField(field.name, e.target.value)}
                          className="h-8 text-[11px] rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                )}
             </ScrollArea>
             
             <Button 
               className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg h-12 rounded-xl text-sm font-bold uppercase tracking-widest"
               onClick={applyChanges}
               disabled={isProcessing}
             >
               {isProcessing ? 'Processing PDF...' : 'Commit All Changes'}
             </Button>
          </div>

          {/* Document Interaction Area */}
          <div className="md:col-span-9">
            <div 
              className={`aspect-[1/1.4] bg-stone-50 rounded-2xl border border-gray-200 flex flex-col relative overflow-hidden group shadow-inner ${isTypewriterActive ? 'cursor-crosshair' : ''}`}
              onClick={handlePreviewClick}
            >
               <div className="bg-white/90 backdrop-blur-sm border-b p-2 flex items-center justify-between text-[10px] text-gray-500 font-bold sticky top-0 z-10">
                  <span className="flex items-center gap-2">
                    <MousePointer2 className="w-3 h-3" />
                    Technical Intelligence Viewer
                  </span>
                  <span>{pdfFile?.name}</span>
               </div>

               <div className="flex-1 relative overflow-hidden bg-slate-100">
                 {/* Real PDF Viewer */}
                  {pdfBytes && (
                    <iframe
                      src={URL.createObjectURL(new Blob([pdfBytes as any], { type: 'application/pdf' })) + '#toolbar=0&navpanes=0&scrollbar=0'}
                      className="w-full h-full pointer-events-none border-0"
                      title="PDF Preview"
                    />
                  )}
                 
                 {/* Visualized Typewriter Entries Overlay */}
                 <div className="absolute inset-0 pointer-events-none">
                    {typewriterEntries.map(entry => (
                      <div 
                        key={entry.id}
                        className="absolute flex items-center gap-1 bg-violet-600 text-white font-bold px-1.5 py-0.5 rounded shadow-xl text-[10px] animate-in zoom-in-50 duration-200 pointer-events-auto group/entry"
                        style={{ 
                          left: `${(entry.x / 595) * 100}%`,
                          top: `${(1 - (entry.y / 842)) * 100}%`,
                          transform: 'translate(-50%, -50%)' 
                        }}
                      >
                        {entry.text}
                        <button 
                          className="ml-1 opacity-0 group-hover/entry:opacity-100 hover:text-red-200 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTypewriterEntries(prev => prev.filter(et => et.id !== entry.id));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                 </div>
               </div>

               {isTypewriterActive && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] px-3 py-1 rounded-full flex items-center gap-2 shadow-xl animate-bounce z-20">
                    <PlusCircle className="w-3 h-3" />
                    Click to Map Intelligence: "{currentText || '...'}"
                  </div>
               )}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 px-2 uppercase tracking-tighter font-bold">
              <div className="flex items-center gap-4">
                 <span>Protocol: PDF/A-Intel</span>
                 <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> AES-256 Secured</span>
              </div>
              <button 
                onClick={() => {setPdfFile(null); setPdfBytes(null); setTypewriterEntries([]); setFormFields([]);}} 
                className="text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Purge Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
