'use client'

import { useState, useRef, useEffect } from 'react';

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
  X,
  Sparkles,
  Zap,
  Globe,
  Loader2,
  Check,
  MinusCircle,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { Dialog as ShadDialog, DialogContent as ShadDialogContent, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle, DialogTrigger as ShadDialogTrigger, DialogFooter as ShadDialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SignatureCanvas = dynamic(() => import('react-signature-canvas'), { ssr: false }) as any;

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

export function PDFStudio({ initialMode = 'edit', onBack }: { initialMode?: 'edit' | 'view', onBack?: () => void }) {
  const { user } = useAuth();
  const supabase = createClient();
  
  // File State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleLaunch = (e: any) => {
      const { file } = e.detail;
      if (file) {
        setPdfFile(file);
        file.arrayBuffer().then((buffer: ArrayBuffer) => {
          const bytes = new Uint8Array(buffer);
          setPdfBytes(bytes);
          detectFields(bytes);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          setThumbnailUrl(URL.createObjectURL(blob));
          toast.success('Neural Bridge: File Injected', { 
            description: `Auto-detected manuscript: ${file.name}` 
          });
        });
      }
    };

    window.addEventListener('dcpi-file-launch', handleLaunch);
    return () => window.removeEventListener('dcpi-file-launch', handleLaunch);
  }, []);
  
  // View State
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Interaction State
  const sigCanvas = useRef<any>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [isTypewriterActive, setIsTypewriterActive] = useState(false);
  const [typewriterEntries, setTypewriterEntries] = useState<TypewriterEntry[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      const bytes = new Uint8Array(await file.arrayBuffer());
      setPdfBytes(bytes);
      detectFields(bytes);
      
      // Generate a temporary thumbnail URL for preview
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setThumbnailUrl(URL.createObjectURL(blob));
      
      toast.success('Node Synced', { description: `Advanced intelligence node ${file.name} is now accessible.` });
    }
  };

  const detectFields = async (bytes: Uint8Array) => {
    try {
      const { PDFDocument } = await import('pdf-lib');
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
      console.error("Field extraction protocol failed:", e);
    }
  };

  const applyChanges = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const form = pdfDoc.getForm();

      // 1. Commit Form Data
      formFields.forEach(field => {
        try {
          const f = form.getField(field.name);
          if (field.value) (f as any).setText?.(field.value);
        } catch (e) {}
      });

      // 2. Commit Typewriter Fragments
      typewriterEntries.forEach(entry => {
        const page = pages[entry.page] || pages[0];
        page.drawText(entry.text, {
          x: entry.x,
          y: entry.y,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });
      });

      // 3. Commit Neural Scribble/Signature
      if (signatureData) {
        const sigImage = await pdfDoc.embedPng(signatureData);
        const dims = sigImage.scale(0.2);
        const firstPage = pages[0];
        firstPage.drawImage(sigImage, {
          x: firstPage.getWidth() - dims.width - 40,
          y: 40,
          width: dims.width,
          height: dims.height,
        });
      }

      const resultBytes = await pdfDoc.save();
      setPdfBytes(resultBytes);
      
      // Update Preview
      const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
      setThumbnailUrl(URL.createObjectURL(blob));

      // Auto-secure in Cloud Cluster
      if (user) {
        const fileName = `mod-${Date.now()}-${pdfFile?.name || 'document.pdf'}`;
        const filePath = `${user.id}/${fileName}`;
        
        await supabase.storage
          .from('pdf-studio')
          .upload(filePath, resultBytes, {
            contentType: 'application/pdf',
            upsert: true
          });
          
        toast.success('Neural Link Secured');
      }

      toast.success('Sequence Committed');
    } catch (error) {
      console.error(error);
      toast.error('Processing Fault');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pro-mod-${pdfFile?.name || 'intelligence.pdf'}`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/10 dark:bg-slate-900/10 backdrop-blur-3xl animate-in fade-in transition-all">
      <div className="h-20 px-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-5">
             <div className="flex items-center gap-3">
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
                <div className="w-11 h-11 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-xl rotate-3">
                    {initialMode === 'view' ? <Eye className="w-5 h-5 text-white dark:text-slate-900" /> : <FileEdit className="w-5 h-5 text-white dark:text-slate-900" />}
                </div>
             </div>
             <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                  A-Intel <span className="text-violet-600">{initialMode === 'view' ? 'Viewer' : 'Studio'}</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Advanced Forge v7.5</span>
                </div>
             </div>
        </div>
        
        <div className="flex items-center gap-4">
           {pdfBytes && (
             <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
                <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="h-10 w-10 rounded-xl text-slate-500"><MinusCircle className="w-4 h-4" /></Button>
                <span className="text-[10px] font-black w-10 text-center text-slate-500">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="h-10 w-10 rounded-xl text-slate-500"><PlusCircle className="w-4 h-4" /></Button>
             </div>
           )}
           
           <div className="flex items-center gap-2">
              {pdfBytes && (
                <Button 
                  onClick={downloadPDF} 
                  className="h-11 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-violet-500/20"
                >
                  <Download className="w-4 h-4 mr-2" /> Extrude
                </Button>
              )}
              {pdfFile && (
                 <Button 
                  onClick={() => {setPdfFile(null); setPdfBytes(null); setThumbnailUrl(null);}}
                  variant="ghost" 
                  className="h-11 w-11 rounded-xl text-slate-400 hover:text-rose-500"
                 >
                    <Trash2 className="w-4 h-4" />
                 </Button>
              )}
           </div>
        </div>
      </div>

      {!pdfBytes ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="w-full max-w-xl p-16 bg-white dark:bg-slate-900/50 rounded-[3.5rem] border-2 border-dashed border-slate-100 dark:border-white/5 flex flex-col items-center text-center space-y-10 group hover:border-violet-500/30 transition-all duration-500 shadow-2xl shadow-slate-200/20 dark:shadow-none">
                <div className="relative">
                   <div className="absolute inset-0 bg-violet-500/20 blur-[60px] rounded-full group-hover:bg-violet-500/40 transition-all" />
                   <div className="relative p-10 bg-slate-50 dark:bg-slate-800 rounded-[3rem] shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                       <Sparkles className="w-20 h-20 text-slate-200 dark:text-slate-700 group-hover:text-violet-500" />
                   </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Ingest Intelligence</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                        Activate neural forge by selecting a PDF manuscript for surgical modification.
                    </p>
                </div>
                <Input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    id="pdf-upload-pro" 
                />
                <Button 
                    onClick={() => document.getElementById('pdf-upload-pro')?.click()}
                    className="h-16 px-12 rounded-[1.8rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                >
                    Initialize Sequence
                </Button>
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
          {/* Side Control Cluster (Only in Edit Mode) */}
          {initialMode === 'edit' && (
            <div className="w-full md:w-85 border-r border-slate-100 dark:border-white/5 flex flex-col bg-white dark:bg-slate-950/30 backdrop-blur-xl">
               <ScrollArea className="flex-1">
                  <div className="p-8 space-y-10">
                      <div className="space-y-5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                             <Shield className="w-3 h-3" /> Core Protocols
                          </label>
                          <div className="grid grid-cols-1 gap-3">
                               <Button 
                                  variant={isTypewriterActive ? 'default' : 'outline'} 
                                  onClick={() => setIsTypewriterActive(!isTypewriterActive)}
                                  className={`h-16 justify-start gap-4 rounded-2xl px-6 border-slate-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest transition-all ${isTypewriterActive ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/20' : 'text-slate-500'}`}
                               >
                                  <Type className="w-5 h-5" /> Typewriter
                               </Button>
                               
                               <ShadDialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
                                  <ShadDialogTrigger asChild>
                                      <Button 
                                          variant="outline" 
                                          className="h-16 justify-start gap-4 rounded-2xl px-6 border-slate-100 dark:border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest"
                                      >
                                          <SignatureIcon className="w-5 h-5" /> Scribble Layer
                                      </Button>
                                  </ShadDialogTrigger>
                                  <ShadDialogContent className="sm:max-w-md rounded-[3rem] border-0 bg-white dark:bg-slate-950 p-8 shadow-3xl">
                                      <ShadDialogHeader className="items-center mb-8">
                                           <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                                              <SignatureIcon className="w-8 h-8 text-violet-600" />
                                           </div>
                                           <ShadDialogTitle className="text-2xl font-black uppercase tracking-tighter">Neural Scribble</ShadDialogTitle>
                                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Temporal Identity Patch</p>
                                      </ShadDialogHeader>
                                      <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/5">
                                          <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[1.5rem] overflow-hidden bg-white shadow-inner">
                                              {/* @ts-ignore */}
                                              <SignatureCanvas 
                                                  ref={sigCanvas as any} penColor='black' 
                                                  canvasProps={{width: 350, height: 180, className: 'sigCanvas'}} 
                                              />
                                          </div>
                                      </div>
                                      <ShadDialogFooter className="flex items-center gap-3 sm:justify-center mt-10">
                                          <Button variant="ghost" onClick={() => sigCanvas.current?.clear()} className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-all">Reset</Button>
                                          <Button onClick={() => { setSignatureData(sigCanvas.current.toDataURL()); setIsSignDialogOpen(false); }} className="h-14 px-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest shadow-2xl">Buffer Patch</Button>
                                      </ShadDialogFooter>
                                  </ShadDialogContent>
                               </ShadDialog>
                          </div>
                      </div>

                      {formFields.length > 0 && (
                          <div className="space-y-5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                 <PlusCircle className="w-3 h-3" /> Extracted Streams
                              </label>
                              <div className="space-y-4">
                                  {formFields.map(field => (
                                      <div key={field.name} className="space-y-2 group">
                                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 opacity-50 block">{field.name}</span>
                                          <Input 
                                              value={field.value}
                                              onChange={(e) => setFormFields(prev => prev.map(f => f.name === field.name ? { ...f, value: e.target.value } : f))}
                                              className="h-12 rounded-xl border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[11px] font-bold focus:ring-violet-500/20"
                                          />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
               </ScrollArea>
               
               <div className="p-8 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
                  <Button 
                      className="w-full h-16 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[11px] tracking-[0.25em] shadow-2xl shadow-slate-900/10 active:scale-95 transition-all"
                      onClick={applyChanges}
                      disabled={isProcessing}
                  >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 mr-3" />}
                      Lock Sequence
                  </Button>
               </div>
            </div>
          )}

          {/* High-Fidelity Viewer Bridge */}
          <div className="flex-1 relative flex flex-col p-10 bg-slate-100 dark:bg-slate-950 shadow-inner overflow-hidden">
             <div 
                className={`flex-1 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-4xl border border-slate-100 dark:border-white/5 overflow-hidden relative flex flex-col group ${isTypewriterActive ? 'cursor-crosshair' : ''}`}
                style={{ 
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
             >
                {thumbnailUrl && (
                    <iframe
                        src={thumbnailUrl + '#toolbar=0&navpanes=0&scrollbar=0'}
                        className="w-full h-full border-0 rounded-[3.5rem] pointer-events-none"
                    />
                )}

                {/* Interaction Overlay: Typewriter */}
                <div 
                    className="absolute inset-0 pointer-events-none z-10"
                    onClick={(e) => {
                        if (!isTypewriterActive || !currentText) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTypewriterEntries(prev => [...prev, {
                            id: crypto.randomUUID(),
                            text: currentText,
                            x: ((e.clientX - rect.left) / rect.width) * 595,
                            y: (rect.height - (e.clientY - rect.top)) / rect.height * 842,
                            page: 0
                        }]);
                        setCurrentText('');
                    }}
                >
                    {typewriterEntries.map(entry => (
                        <div 
                            key={entry.id}
                            className="absolute flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-3 py-1.5 rounded-lg shadow-xl text-[10px] pointer-events-auto animate-in zoom-in"
                            style={{ 
                                left: `${(entry.x / 595) * 100}%`,
                                top: `${(1 - (entry.y / 842)) * 100}%`,
                                transform: 'translate(-50%, -50%)' 
                            }}
                        >
                            {entry.text}
                            <button onClick={(e) => { e.stopPropagation(); setTypewriterEntries(prev => prev.filter(t => t.id !== entry.id)); }} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>

                {/* Interface Overlay: Scribble Preview */}
                {signatureData && (
                    <div className="absolute bottom-12 right-12 w-44 h-22 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-4 shadow-3xl pointer-events-none animate-in slide-in-from-right-10 duration-500">
                         <img src={signatureData} className="w-full h-full object-contain mix-blend-multiply dark:invert grayscale" />
                         <div className="absolute -top-3 -left-3 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg"><Check className="w-3 h-3" /></div>
                    </div>
                )}
             </div>

             {isTypewriterActive && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 z-20 animate-in slide-in-from-bottom-10">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-4xl border border-violet-500/30 flex items-center gap-3">
                         <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                            <Type className="w-5 h-5 text-white" />
                         </div>
                         <Input 
                            placeholder="Type payload..." 
                            value={currentText}
                            onChange={(e) => setCurrentText(e.target.value)}
                            className="h-10 border-0 bg-transparent text-xs font-bold"
                         />
                    </div>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
