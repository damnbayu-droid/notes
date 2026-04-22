'use client'

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pencil, 
  Image as ImageIcon, 
  Type, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface PDFSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
}

export function PDFSignatureModal({ isOpen, onClose, onSave }: PDFSignatureModalProps) {
  const [activeTab, setActiveTab] = useState('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-signature-1');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drawing Pad Logic
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab, isOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Image Upload & Background Removal
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      processSignatureImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processSignatureImage = async (dataUrl: string) => {
    setIsProcessing(true);
    try {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Neural Background Removal: Make near-white pixels transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If color is close to white, make it transparent
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      onSave(canvas.toDataURL());
      toast.success('Neural Extraction: Background Eliminated');
    } catch (err) {
      toast.error('Processing Fault');
    } finally {
      setIsProcessing(false);
    }
  };

  // Type Logic
  const handleTypeSave = () => {
    if (!typedName) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    const fontName = selectedFont === 'font-signature-1' ? 'Dancing Script' : 
                     selectedFont === 'font-signature-2' ? 'Pacifico' : 'Sacramento';
    
    ctx.font = `60px ${fontName}, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    
    onSave(canvas.toDataURL());
  };

  const handleDrawSave = () => {
    if (!canvasRef.current) return;
    onSave(canvasRef.current.toDataURL());
  };

  const signatureFonts = [
    { id: 'font-signature-1', name: 'Dancing Script', class: 'font-signature-1' },
    { id: 'font-signature-2', name: 'Pacifico', class: 'font-signature-2' },
    { id: 'font-signature-3', name: 'Sacramento', class: 'font-signature-3' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[3rem] border-0 bg-white dark:bg-slate-950 p-0 overflow-hidden shadow-4xl">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                 <Pencil className="w-6 h-6 text-white" />
              </div>
              <div>
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none">Add Signature</DialogTitle>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Initialize Identity Layer</p>
              </div>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl"><Trash2 className="w-4 h-4" /></Button>
        </div>

        <Tabs defaultValue="draw" onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-16 bg-white dark:bg-slate-950 p-2 rounded-none border-b border-slate-100 dark:border-white/5">
            <TabsTrigger value="draw" className="flex-1 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600">
              <Pencil className="w-4 h-4" /> Draw
            </TabsTrigger>
            <TabsTrigger value="image" className="flex-1 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600">
              <ImageIcon className="w-4 h-4" /> Image
            </TabsTrigger>
            <TabsTrigger value="type" className="flex-1 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600">
              <Type className="w-4 h-4" /> Type
            </TabsTrigger>
          </TabsList>

          <div className="p-8">
            <TabsContent value="draw" className="mt-0 space-y-6">
              <div className="relative aspect-[3/1] bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5 overflow-hidden group">
                <canvas 
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair touch-none"
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-full border border-slate-200 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                   Sign Inside This Workspace
                </div>
                <Button 
                  onClick={clearCanvas}
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-white dark:bg-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex justify-end gap-3">
                 <Button onClick={onClose} variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
                 <Button onClick={handleDrawSave} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-500/20 h-12">Finalize Draw</Button>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-0 space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/1] bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center space-y-4 group cursor-pointer hover:border-rose-500/30 transition-all"
              >
                <div className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl group-hover:scale-110 transition-transform">
                   <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 group-hover:text-rose-500" />
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Select Identity Image</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Supports background elimination logic</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
              {isProcessing && (
                <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                   <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Neutral Extraction Active...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="type" className="mt-0 space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Type Your Identity</label>
                 <Input 
                   value={typedName}
                   onChange={(e) => setTypedName(e.target.value)}
                   placeholder="Enter Full Name..."
                   className="h-16 rounded-2xl border-slate-100 bg-slate-50 dark:bg-slate-900 px-6 text-xl font-bold tracking-tight"
                 />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {signatureFonts.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font.id)}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 ${
                        selectedFont === font.id 
                        ? 'border-rose-500 bg-rose-50/30 shadow-xl' 
                        : 'border-slate-100 dark:border-white/5 hover:border-slate-200'
                      }`}
                    >
                       <span className={`text-2xl whitespace-nowrap ${font.class}`}>{typedName || 'Signature'}</span>
                       <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">{font.name}</span>
                    </button>
                 ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                 <Button onClick={onClose} variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
                 <Button onClick={handleTypeSave} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-500/20 h-12">Finalize Type</Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
