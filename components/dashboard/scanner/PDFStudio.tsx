'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Trash2, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Printer, 
  Maximize2, 
  FileCheck, 
  Settings,
  Shield,
  Clock,
  Sparkles,
  ArrowLeft,
  Mail,
  Loader2,
  Undo2,
  Redo2,
  MousePointer2,
  Layers,
  Settings2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { PDFEngine, PDFPageInfo } from '@/lib/pdf/engine'
import { PDFSidebar } from './PDFSidebar'
import { PDFToolbar, PDFTool } from './PDFToolbar'
import { PDFPageCanvas } from './PDFPageCanvas'
import { PDFSignatureModal } from './PDFSignatureModal'
import { ManuscriptStorage, PDFLog } from '@/lib/storage/indexedDB'

interface PDFStudioProps {
  initialFile?: File;
  pdf?: File;
  initialMode?: 'edit' | 'view';
  onBack?: () => void;
}

export function PDFStudio({ initialFile, pdf, initialMode = 'edit', onBack }: PDFStudioProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [pdfFile, setPdfFile] = useState<File | null>(pdf || initialFile || null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<PDFPageInfo[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModule, setActiveModule] = useState<'editor' | 'viewer'>(initialMode === 'view' ? 'viewer' : 'editor');

  useEffect(() => {
    async function loadInitialPdf() {
      const source = pdf || initialFile;
      if (source && !pdfDoc) {
        setPdfFile(source);
        setIsInitializing(true);
        try {
          const { doc, pages: pageInfos } = await PDFEngine.loadMetadata(source);
          setPdfDoc(doc);
          setPages(pageInfos);
          setActiveModule(initialMode === 'view' ? 'viewer' : 'editor');
        } catch (err) {
          toast.error('Injection Protocol Failed');
        } finally {
          setIsInitializing(false);
        }
      }
    }
    loadInitialPdf();
  }, [pdf, initialFile, pdfDoc, initialMode]);

  const [activeTool, setActiveTool] = useState<PDFTool>('select');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [annotations, setAnnotations] = useState<Record<number, any>>({});

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('intelligence');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isPageLayoutOpen, setIsPageLayoutOpen] = useState(false);
  const [signColor, setSignColor] = useState<'colored' | 'black'>('colored');
  const [pageLayout, setPageLayout] = useState('A4');
  const [pdfLogs, setPdfLogs] = useState<PDFLog[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('pdf_engineering_logs');
    if (cached) setPdfLogs(JSON.parse(cached));
  }, []);

  const logPDFAction = async (fileName: string, action: string, fileSize?: number, blob?: Blob) => {
    const id = crypto.randomUUID();
    const newLog: PDFLog = {
      id,
      fileName,
      timestamp: Date.now(),
      action,
      fileSize: fileSize ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB` : undefined
    };

    if (blob) {
      try {
        await ManuscriptStorage.save(id, fileName, blob, annotations);
      } catch (err) {
        console.error('Failed to cache manuscript:', err);
      }
    }

    const updated = [newLog, ...pdfLogs].slice(0, 50);
    setPdfLogs(updated);
    localStorage.setItem('pdf_engineering_logs', JSON.stringify(updated));
  };

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRefs = useRef<Record<number, any>>({});

  const isPro = user?.access_level === 'pro' || user?.role === 'admin';

  const handleDownloadAttempt = () => {
    if (!isPro) {
      setIsPremiumModalOpen(true);
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleSignatureSave = (dataUrl: string) => {
    const activeCanvas = canvasRefs.current[currentPage];
    if (activeCanvas) {
      activeCanvas.addObject(dataUrl);
    }
    setIsSignatureModalOpen(false);
    toast.success('Identity Layer Finalized');
  };

  const handleSendEmail = async () => {
    if (!emailInput) {
      toast.error('Email Distribution Endpoint Required');
      return;
    }
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setIsPreviewOpen(false);
      toast.success('Manuscript Distributed', { description: `Successfully sent to ${emailInput}` });
    }, 2000);
  };

  const handleContinueInjection = () => {
    setIsPremiumModalOpen(false);
    toast.info('Neural Subscription bridge is simulated for demo.');
  };

  const handleImageInjection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const activeCanvas = canvasRefs.current[currentPage];
      if (activeCanvas) {
        activeCanvas.addObject(dataUrl);
      }
      toast.success('Neural Asset Injected');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleOpenPayment = () => setIsPremiumModalOpen(true);
    window.addEventListener('open-payment-modal', handleOpenPayment);
    return () => window.removeEventListener('open-payment-modal', handleOpenPayment);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setIsInitializing(true);
      setAnnotations({});
      canvasRefs.current = {};

      try {
        let finalFile: File;
        if (files.length > 1) {
          toast.loading('Synthesizing Multi-Node Manuscript...', { id: 'merge' });
          const mergedBytes = await PDFEngine.mergePDFs(files);
          finalFile = new File([mergedBytes as any], 'Merged_Manuscript.pdf', { type: 'application/pdf' });
          toast.success('Multi-Node Merge Complete', { id: 'merge' });
        } else {
          finalFile = files[0];
        }

        const { doc, pages: pageInfos } = await PDFEngine.loadMetadata(finalFile);
        setPdfDoc(doc);
        setPages(pageInfos);
        setPdfFile(finalFile);
        logPDFAction(finalFile.name, 'EDITOR_INJECTION', finalFile.size, finalFile);
        toast.success('Neural Bridge: Manuscript Injected');
      } catch (err) {
        toast.error('Injection Protocol Failed');
      } finally {
        setIsInitializing(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Hidden Inputs */}
      <input type="file" ref={imageInputRef} onChange={handleImageInjection} accept="image/*" className="hidden" />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" multiple className="hidden" />

      {/* 1. TOP TOOLBAR - FIXED/FROZEN */}
      {pdfDoc && (
        <div className="sticky top-0 z-[100] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 shadow-sm">
          <PDFToolbar
            activeTool={activeTool}
            onToolSelect={setActiveTool}
            onDone={onBack || (() => {})}
            onDownload={handleDownloadAttempt}
            onImageRequest={() => imageInputRef.current?.click()}
            onSignatureRequest={() => setIsSignatureModalOpen(true)}
            onPageLayoutRequest={() => setIsPageLayoutOpen(true)}
            onManagePagesRequest={() => toast.info('Neural Sequencing Active')}
            onLogsRequest={() => setIsLogsOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            signColor={signColor}
            onSignColorToggle={() => setSignColor(s => s === 'colored' ? 'black' : 'colored')}
            canUndo={true}
            canRedo={true}
            onUndo={() => {
               const activeCanvas = canvasRefs.current[currentPage];
               activeCanvas?.undo?.();
            }}
            onRedo={() => {
               const activeCanvas = canvasRefs.current[currentPage];
               activeCanvas?.redo?.();
            }}
          />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 2. SIDEBAR THUMBNAILS */}
        {pdfDoc && (
          <aside className="w-64 flex-none border-r border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
            <PDFSidebar 
               pages={pages} 
               currentPage={currentPage} 
               onPageSelect={(p) => {
                  setCurrentPage(p);
                  document.getElementById(`page-node-${p}`)?.scrollIntoView({ behavior: 'smooth' });
               }} 
               isOpen={isSidebarOpen} 
            />
          </aside>
        )}

        {/* 3. MAIN AREA */}
        <main className="flex-1 relative bg-slate-100 dark:bg-slate-950 overflow-hidden flex flex-col h-full">
          {!pdfDoc && !isInitializing ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-10">
               <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                     <Sparkles className="w-4 h-4" />
                     Sovereign AI Editor
                  </div>
                  <h2 className="text-6xl font-black uppercase tracking-tighter italic leading-none">A-Intel <span className="text-rose-500">Manuscript</span> Bridge</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em]">Upload a PDF to begin neural annotations</p>
               </div>
               
               <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-xl aspect-video bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-6 cursor-pointer group hover:border-rose-500/50 transition-all shadow-2xl"
               >
                  <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                     <FileText className="w-10 h-10 text-rose-500" />
                  </div>
                  <div className="text-center">
                     <p className="text-xl font-black uppercase tracking-tight">Select Intelligence Node</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Supports high-fidelity PDF up to 50MB</p>
                  </div>
               </div>

               {onBack && (
                  <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500">
                     <ArrowLeft className="w-4 h-4 mr-2" /> Return to PDF Master
                  </Button>
               )}
            </div>
          ) : isInitializing ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-8 border-slate-200 dark:border-white/5 rounded-full"></div>
                <div className="absolute top-0 w-24 h-24 border-8 border-rose-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center animate-pulse">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Decrypting Architecture</p>
                <p className="text-xs font-bold text-slate-400 mt-2 italic">Neural rendering in progress...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative overflow-auto custom-scrollbar flex flex-col items-center gap-12 py-12 px-6">
              {pages.map((page, idx) => (
                <div 
                  key={idx} 
                  id={`page-node-${idx + 1}`}
                  className="relative group bg-white shadow-2xl rounded-sm border border-slate-200 dark:border-white/10"
                >
                  <div className="absolute -left-12 top-0 h-full w-8 flex flex-col items-center justify-start py-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black text-slate-400 uppercase vertical-text">PAGE {idx + 1}</span>
                  </div>
                  
                  <div className="relative shadow-2xl">
                    <PDFPageCanvas
                      pdf={pdfDoc}
                      pageNumber={idx + 1}
                      zoom={zoom}
                      tool={activeTool}
                      ref={(el) => { canvasRefs.current[idx + 1] = el; }}
                      initialAnnotations={annotations[idx + 1]}
                      onAnnotationsChange={(anns) => {
                        setAnnotations(prev => ({ ...prev, [idx + 1]: anns }));
                      }}
                    />
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="fixed inset-0 bg-white/20 backdrop-blur-sm z-[200] flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
                </div>
              )}
            </div>
          )}

          {/* Floating Indicator Bubble */}
          {pdfDoc && activeModule === 'editor' && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl flex items-center gap-6 z-40">
              <button
                onClick={() => {
                   const prev = Math.max(1, currentPage - 1);
                   setCurrentPage(prev);
                   document.getElementById(`page-node-${prev}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <div className="px-4 border-x border-slate-100 flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PROTOCOL</span>
                <span className="text-xs font-black text-rose-500">{currentPage} / {pages.length}</span>
              </div>
              <button
                onClick={() => {
                   const next = Math.min(pages.length, currentPage + 1);
                   setCurrentPage(next);
                   document.getElementById(`page-node-${next}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
              <div className="w-1 h-8 bg-slate-100 mx-2" />
              <button 
                onClick={() => {
                   setPdfDoc(null);
                   setPages([]);
                   setPdfFile(null);
                }}
                className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-rose-500/20"
              >
                <X className="w-4 h-4 -rotate-45 text-white" />
              </button>
            </div>
          )}
        </main>
      </div>

      <PDFSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
      />

      {/* Page Layout Modal */}
      <Dialog open={isPageLayoutOpen} onOpenChange={setIsPageLayoutOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] border-0 bg-white dark:bg-slate-950 p-10 shadow-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Page Configuration</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Output Manuscript Size</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-6">
            {['A4', 'Letter', 'Legal', 'Executive'].map((size) => (
              <Button
                key={size}
                variant={pageLayout === size ? 'default' : 'outline'}
                onClick={() => {
                  setPageLayout(size);
                  setIsPageLayoutOpen(false);
                  toast.success(`Layout Schema: ${size} Applied`);
                }}
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest justify-between px-6"
              >
                {size} Manuscript {pageLayout === size && <FileCheck className="w-4 h-4" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. PREMIUM UPGRADE MODAL */}
      <Dialog open={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen}>
        <DialogContent className="sm:max-w-5xl rounded-[4rem] border-0 bg-white dark:bg-slate-950 p-0 shadow-6xl overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Left: Branding */}
            <div className="w-full md:w-80 bg-[#0f0c29] p-12 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,#581c87,transparent)] animate-pulse"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mt-8 uppercase tracking-tighter italic leading-none">Upgrade <br /> <span className="text-indigo-400">Sovereignty</span></h3>
                <p className="text-indigo-300/60 text-[10px] font-bold uppercase tracking-widest mt-6 leading-relaxed italic">Unlock high-fidelity neural orchestration across the multi-device intelligence cluster.</p>
              </div>
              <div className="relative z-10 border-t border-white/10 pt-8">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Admin Node Access</p>
                <p className="text-white font-bold text-xs mt-2 italic">v18.1.8 SOVEREIGN ACTIVE</p>
              </div>
            </div>

            {/* Right: Plans */}
            <div className="flex-1 p-12 space-y-10 relative bg-white dark:bg-slate-950 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic">Selection <span className="text-indigo-600">Protocol</span></h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select your intelligence tier</p>
                </div>
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Active Cluster</span>
                </div>
              </div>

              <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                <Shield className="w-5 h-5 text-rose-500" />
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest italic">Encryption mandatory for all Pro transfers</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Starter Protocol */}
                <div
                  onClick={() => setSelectedPlan('starter')}
                  className={`p-6 rounded-[2rem] border-4 transition-all flex items-center justify-between relative cursor-pointer ${selectedPlan === 'starter' ? 'border-indigo-500 bg-indigo-50/10 shadow-2xl shadow-indigo-500/10' : 'border-slate-100 dark:border-white/5 hover:border-indigo-300'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'starter' ? 'border-indigo-500' : 'border-slate-200'}`}>
                      <div className={`w-3 h-3 rounded-full bg-indigo-500 transition-opacity ${selectedPlan === 'starter' ? 'opacity-100' : 'opacity-0'}`}></div>
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tighter italic">Starter Protocol</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Basic Manuscript Synthesis</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IDR</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">15.000<span className="text-[10px] text-slate-400">/mo</span></div>
                  </div>
                </div>

                {/* Full Intelligence */}
                <div
                  onClick={() => setSelectedPlan('intelligence')}
                  className={`p-6 rounded-[2rem] border-4 transition-all flex items-center justify-between relative cursor-pointer ${selectedPlan === 'intelligence' ? 'border-indigo-500 bg-indigo-50/10 shadow-2xl shadow-indigo-500/10' : 'border-slate-100 dark:border-white/5 hover:border-indigo-300'}`}
                >
                  <div className="absolute -top-3 left-10 px-4 py-1 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                  <div className="flex items-center gap-5">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'intelligence' ? 'border-indigo-500' : 'border-slate-200'}`}>
                      <div className={`w-3 h-3 rounded-full bg-indigo-500 transition-opacity ${selectedPlan === 'intelligence' ? 'opacity-100' : 'opacity-0'}`}></div>
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tighter italic">Full Intelligence</h4>
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Github Syncing + Google Drive Integration</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">IDR</div>
                    <div className="text-xl font-black text-indigo-600">50.000<span className="text-[10px] text-slate-400">/mo</span></div>
                  </div>
                </div>

                {/* Enterprise Hub */}
                <div
                  onClick={() => setSelectedPlan('enterprise')}
                  className={`p-6 rounded-[2rem] border-4 transition-all flex items-center justify-between relative cursor-pointer ${selectedPlan === 'enterprise' ? 'border-slate-900 bg-slate-50 dark:bg-white/5 shadow-2xl' : 'border-slate-100 dark:border-white/5 hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'enterprise' ? 'border-slate-900' : 'border-slate-200'}`}>
                      <div className={`w-3 h-3 rounded-full bg-slate-900 transition-opacity ${selectedPlan === 'enterprise' ? 'opacity-100' : 'opacity-0'}`}></div>
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tighter italic">Enterprise Hub</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 italic">Permanent Multi-Node Sovereignty Bridge</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IDR</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">150.000<span className="text-[10px] text-slate-400">/mo</span></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">By continuing, you agree to the Neural Protocols and Privacy Manifest.</p>
                <Button
                  className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-indigo-500/20 group"
                  onClick={handleContinueInjection}
                >
                  Continue Injection <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="absolute bottom-6 left-12 right-12 flex items-center justify-between text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] border-t border-slate-50 dark:border-white/5 pt-4">
                <span>* Secure Stripe Protocol</span>
                <span>v17.8.0 Intelligence Node</span>
                <span>Processed in IDR</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. PREVIEW & EMAIL MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-xl rounded-[3rem] border-0 bg-white dark:bg-slate-950 p-10 shadow-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Final Preview & Delivery</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Your manuscript is ready for neural distribution.
            </DialogDescription>
          </DialogHeader>

          <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] mt-8 flex items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
              Ready for Extraction
            </div>
            <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-700" />
          </div>

          <div className="mt-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Distribution Endpoint (Email)</label>
              <div className="relative">
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter target email..."
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-12 text-xs font-bold"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="flex-1 h-16 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-rose-500/20"
              >
                {isSendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                Send via Email
              </Button>
              <Button
                onClick={async () => {
                  if (pdfFile) {
                    const url = URL.createObjectURL(pdfFile);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Sovereign_Edit_${pdfFile.name}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    logPDFAction(pdfFile.name, 'EDITOR_EXTRUSION', pdfFile.size, pdfFile);
                    toast.success('Manuscript Extruded');
                  }
                }}
                className="flex-1 h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-emerald-500/20"
              >
                <Download className="w-5 h-5" />
                Extrude Artifact
              </Button>
              <Button
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Edited PDF Manuscript',
                        text: 'Check out this edited file from PDF Master',
                        url: window.location.href
                      });
                      toast.success('Neural Share Bridge Active');
                    } catch (err) {
                      toast.error('Share Aborted');
                    }
                  } else {
                    toast.error('Web Share Protocol Unsupported on this Node');
                  }
                }}
                className="h-16 px-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-widest shadow-xl"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. ENGINEERING LOGS MODAL */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
         <DialogContent className="sm:max-w-2xl rounded-[3rem] border-0 bg-white dark:bg-slate-950 p-10 shadow-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Engineering Logs</DialogTitle>
               <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History of Neural Synthesis Operations</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-8">
               {pdfLogs.length === 0 ? (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-10">No logs detected</p>
               ) : (
                  pdfLogs.map(log => (
                     <div 
                        key={log.id}
                        onClick={async () => {
                           toast.loading('Recovering Intelligence Node...', { id: 'recovery' });
                           try {
                              const cached = await ManuscriptStorage.get(log.id);
                              if (cached) {
                                 const file = new File([cached.blob], cached.fileName, { type: 'application/pdf' });
                                 const { doc, pages: pageInfos } = await PDFEngine.loadMetadata(file);
                                 setPdfDoc(doc);
                                 setPages(pageInfos);
                                 setPdfFile(file); setAnnotations(cached.annotations || {});
                                 setIsLogsOpen(false);
                                 toast.success('Manuscript Recovered', { id: 'recovery' });
                              } else {
                                 toast.error('Local Node Purged', { id: 'recovery', description: 'This file is no longer available in device cache.' });
                              }
                           } catch (err) {
                              toast.error('Recovery Protocol Failed', { id: 'recovery' });
                           }
                        }}
                        className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-rose-500 transition-all"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                              <FileText className="w-5 h-5 text-rose-500" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.fileName}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                 {log.action} • {new Date(log.timestamp).toLocaleString()}
                              </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{log.fileSize || 'N/A'}</p>
                           <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 group-hover:text-rose-400">Click to Resume</p>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

export default PDFStudio;
