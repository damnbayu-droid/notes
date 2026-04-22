'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Globe, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PDFShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export function PDFShareModal({ isOpen, onClose, shareUrl }: PDFShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Intelligence Node Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Neural Clipboard Failure');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[3rem] border-0 bg-white dark:bg-slate-950 p-0 overflow-hidden shadow-4xl">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                 <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none">Share Node</DialogTitle>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Intelligence Distribution</p>
              </div>
           </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
             <ShieldCheck className="w-5 h-5 text-emerald-500" />
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secure Peer-to-Peer Transmission Bridge Active</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Manuscript URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={shareUrl}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 dark:bg-slate-900 px-10 text-xs font-bold text-slate-500"
                />
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
              <Button 
                onClick={handleCopy}
                className="h-14 w-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/20"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
             <Button onClick={onClose} className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest">
                Close Node
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
