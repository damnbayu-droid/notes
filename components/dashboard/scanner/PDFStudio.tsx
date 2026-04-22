'use client'

import { useState, useRef, useEffect } from 'react';
import { PDFToolbar, PDFTool } from './PDFToolbar';
import { PDFSidebar } from './PDFSidebar';
import { PDFPageCanvas } from './PDFPageCanvas';
import { PDFSignatureModal } from './PDFSignatureModal';
import { PDFEngine, PDFPageInfo } from '@/lib/pdf/engine';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  Sparkles,
  ShieldAlert,
  Crown,
  Mail,
  Download,
  X,
  Database,
  ChevronRight,
  FileText,
  CheckCircle2,
  Cloud,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function PDFStudio({ initialMode = 'edit', onBack }: { initialMode?: 'edit' | 'view', onBack?: () => void }) {
  const { user } = useAuth();
  const supabase = createClient();

  // Document State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<PDFPageInfo[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Editor State
  const [activeTool, setActiveTool] = useState<PDFTool>('select');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [annotations, setAnnotations] = useState<Record<number, any[]>>({});

  // Monetization & Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('intelligence');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isPageLayoutOpen, setIsPageLayoutOpen] = useState(false);
  const [signColor, setSignColor] = useState<'colored' | 'black'>('colored');
  const [pageLayout, setPageLayout] = useState('A4');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<any>(null);

  const isPro = user?.access_level === 'pro';

  useEffect(() => {
    const handleOpenPayment = () => setIsPremiumModalOpen(true);
    window.addEventListener('open-payment-modal', handleOpenPayment);
    return () => window.removeEventListener('open-payment-modal', handleOpenPayment);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setIsInitializing(true);

      try {
        const { doc, pages: pageInfos } = await PDFEngine.loadMetadata(file);
        setPdfDoc(doc);
        setPages(pageInfos);
        toast.success('Neural Bridge: Manuscript Injected', {
          description: `${file.name} (Total Pages: ${pageInfos.length})`
        });
      } catch (err) {
        toast.error('Injection Protocol Failed', { description: 'Corrupted PDF data detected.' });
      } finally {
        setIsInitializing(false);
      }
    }
  };

  const handleDownloadAttempt = () => {
    if (!isPro) {
      setIsPremiumModalOpen(true);
      return;
    }
    // Proceed to preview/download for PRO
    setIsPreviewOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailInput) return;
    setIsSendingEmail(true);
    try {
      // Mocking email logic
      await new Promise(r => setTimeout(r, 2000));
      toast.success('Neural Delivery Successful', { description: `File sent to ${emailInput}` });
      setIsPreviewOpen(false);
    } catch (err) {
      toast.error('Delivery Fault');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleImageInjection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (canvasRef.current) {
        canvasRef.current.addObject(dataUrl);
      }
      toast.success('Neural Asset Injected');
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureSave = (dataUrl: string) => {
    if (canvasRef.current) {
      canvasRef.current.addObject(dataUrl);
    }
    setIsSignatureModalOpen(false);
    toast.success('Identity Layer Finalized');
  };

  const handleContinueInjection = async () => {
    if (!user?.email) {
      toast.error('Identity required for Neural Bridge access.');
      return;
    }

    const priceMap: Record<string, { amount: number; name: string }> = {
      starter: { amount: 15000, name: 'Starter Node' },
      intelligence: { amount: 50000, name: 'Full Intelligence' },
      enterprise: { amount: 150000, name: 'Enterprise Hub' }
    };

    const selected = priceMap[selectedPlan];
    if (!selected) return;

    try {
      toast.loading('Synchronizing with Payment Gateway...', { id: 'doku-bridge' });

      const response = await fetch('/api/payment/doku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          planName: selected.name,
          amount: selected.amount,
          userEmail: user.email
        })
      });

      const data = await response.json();

      if (data.url) {
        toast.success('Neural Bridge Established. Redirecting...', { id: 'doku-bridge' });
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initialize payment node.');
      }
    } catch (err: any) {
      if (err.message.includes('invalid_client_id')) {
        toast.error('Doku Gateway: Configuration Required', {
          id: 'doku-bridge',
          description: 'Local environment is missing DOKU_CLIENT_ID. Please check your .env.local configuration.'
        });
      } else {
        toast.error('Payment Protocol Failed', {
          id: 'doku-bridge',
          description: err.message
        });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Hidden Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageInjection}
        accept="image/*"
        className="hidden"
      />


      {/* 1. TOP TOOLBAR - FIXED */}
      {pdfDoc && (
        <div className="flex-none z-50">
          <PDFToolbar
            activeTool={activeTool}
            onToolSelect={setActiveTool}
            onDone={handleDownloadAttempt}
            onDownload={handleDownloadAttempt}
            onImageRequest={() => imageInputRef.current?.click()}
            onSignatureRequest={() => setIsSignatureModalOpen(true)}
            onPageLayoutRequest={() => setIsPageLayoutOpen(true)}
            onManagePagesRequest={() => toast.info('Neural Sequencing: Manage Pages Mode Active')}
            signColor={signColor}
            onSignColorToggle={() => setSignColor(s => s === 'colored' ? 'black' : 'colored')}
            canUndo={true}
            canRedo={true}
            onUndo={() => canvasRef.current?.undo()}
            onRedo={() => canvasRef.current?.redo()}
          />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 2. SIDEBAR THUMBNAILS - FIXED HEIGHT SCROLL */}
        {pdfDoc && (
          <aside className="w-64 flex-none border-r border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
            <PDFSidebar
              pages={pages}
              currentPage={currentPage}
              onPageSelect={setCurrentPage}
              isOpen={isSidebarOpen}
            />
          </aside>
        )}

        {/* 3. MAIN CANVAS AREA - FIXED VIEWPORT */}
        <main className="flex-1 relative bg-slate-100 dark:bg-slate-950 overflow-hidden flex flex-col h-full">
          {!pdfFile ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-full max-w-xl p-16 bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center text-center space-y-10 group hover:border-rose-500/30 transition-all duration-500 shadow-2xl">
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-500/20 blur-[60px] rounded-full group-hover:bg-rose-500/40 transition-all" />
                  <div className="relative w-24 h-24 bg-rose-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Neural PDF Master</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Next-Gen Document Engineering Interface</p>
                </div>
                <Button
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 rounded-[2rem] bg-rose-500 hover:bg-rose-600 text-white text-lg font-black uppercase tracking-widest gap-4 shadow-2xl shadow-rose-500/20 group-hover:translate-y-[-4px] transition-all cursor-pointer"
                >
                  Initialize File
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          ) : isInitializing ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-8 border-slate-200 dark:border-white/5 rounded-full" />
                <div className="absolute top-0 w-24 h-24 border-8 border-rose-500 rounded-full border-t-transparent animate-spin" />
              </div>
              <div className="text-center animate-pulse">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Decrypting Architecture</p>
                <p className="text-xs font-bold text-slate-400 mt-2 italic">Neural rendering in progress...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative overflow-auto custom-scrollbar flex flex-col items-center">
              <div className="p-12 min-h-full relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
                  </div>
                )}
                <PDFPageCanvas
                  ref={canvasRef}
                  pdf={pdfDoc}
                  pageNumber={currentPage}
                  tool={activeTool}
                  zoom={zoom}
                  signColor={signColor}
                  initialAnnotations={annotations[currentPage]}
                  onAnnotationsChange={(anns) => {
                    setAnnotations(prev => ({ ...prev, [currentPage]: anns }));
                  }}
                />
              </div>
            </div>
          )}

          {/* Page Indicator Bubble */}
          {pdfDoc && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl flex items-center gap-6 z-40">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 rotate-45" />
              </button>
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                Page {currentPage} <span className="text-slate-400 mx-2">/</span> {pages.length}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(pages.length, p + 1))}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 -rotate-45 text-rose-500" />
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
            {['A4 (Standard)', 'Letter (US)', 'Legal', 'Executive'].map((size) => (
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
                {size}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* PREMIUM SUBSCRIPTION MODAL */}
      <Dialog open={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen}>
        <DialogContent className="sm:max-w-5xl rounded-[3rem] border-0 bg-white dark:bg-slate-950 p-0 shadow-4xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Neural Expansion Subscription</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Left Side: Branding */}
            <div className="w-full md:w-80 bg-[#0f0c29] p-12 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,#581c87,transparent)] animate-pulse" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-10 italic leading-none">Neural Expansion</h2>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 leading-relaxed">Enhance your collective intelligence with professional tier protocols.</p>
              </div>
              <div className="relative z-10 border-t border-white/10 pt-8">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Official Provider</p>
                <p className="text-[9px] font-black text-white uppercase tracking-tighter mt-1">PT INDONESIAN VISAS AGENCY</p>
              </div>
            </div>

            {/* Right Side: Plans */}
            <div className="flex-1 p-12 space-y-10 relative bg-white dark:bg-slate-950 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Choose a plan to download</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Select your intelligence tier to finalize the bridge.</p>
                </div>
                <Button variant="ghost" onClick={() => setIsPremiumModalOpen(false)} className="rounded-xl"><X className="w-4 h-4" /></Button>
              </div>

              <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                <Database className="w-4 h-4 text-rose-500 animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 leading-relaxed">
                   Neural Retention Policy: This manuscript will be auto-deleted from the intelligence pool in 7 days. Finalize subscription to archive permanently.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Starter Node */}
                <div
                  onClick={() => setSelectedPlan('starter')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group cursor-pointer ${selectedPlan === 'starter' ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-100 dark:border-white/5 hover:border-indigo-300'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'starter' ? 'border-indigo-500' : 'border-slate-200'}`}>
                      <div className={`w-3 h-3 rounded-full bg-indigo-500 transition-opacity ${selectedPlan === 'starter' ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tighter italic">Starter Node</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Unlimited Nodes + Ad-Free Intelligence</p>
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
                      <div className={`w-3 h-3 rounded-full bg-indigo-500 transition-opacity ${selectedPlan === 'intelligence' ? 'opacity-100' : 'opacity-0'}`} />
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
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group cursor-pointer ${selectedPlan === 'enterprise' ? 'border-slate-900 bg-slate-50 dark:bg-white/5' : 'border-slate-100 dark:border-white/5 hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'enterprise' ? 'border-slate-900' : 'border-slate-200'}`}>
                      <div className={`w-3 h-3 rounded-full bg-slate-900 transition-opacity ${selectedPlan === 'enterprise' ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tighter italic">Enterprise Hub</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Multi-User Sync + Audit Logs Access</p>
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
    </div>
  );
}
