'use client'

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, RotateCcw, PenTool, Download, Share2, FileImage, Move, Maximize, RotateCw, Layers } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { jsPDF } from 'jspdf';

interface CanvasEditorProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
    signatureMode?: boolean;
    initialImage?: string;
}

export function CanvasEditor({ onSave, onCancel, signatureMode = false }: CanvasEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState(signatureMode ? 'black' : 'black');
    const [lineWidth] = useState(signatureMode ? 3 : 2);
    const [hasBackground, setHasBackground] = useState(true);
    const [mode, setMode] = useState<'draw' | 'transform'>('draw');
    
    // Transform State
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1, rotate: 0, tilt: 0 });
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
    
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Make canvas fill the parent
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth * 2; // Retina support
            canvas.height = parent.clientHeight * 2;
            canvas.style.width = `${parent.clientWidth}px`;
            canvas.style.height = `${parent.clientHeight}px`;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(2, 2);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;

            // Fill background if enabled
            if (hasBackground) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            contextRef.current = ctx;
        }
    }, [hasBackground, color, lineWidth]); // Added dependencies to re-sync if needed

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = color;
        }
    }, [color]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!contextRef.current) return;

        const { offsetX, offsetY } = getCoordinates(e.nativeEvent);
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        if (!contextRef.current) return;
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !contextRef.current) return;

        const { offsetX, offsetY } = getCoordinates(e.nativeEvent);
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const getCoordinates = (event: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };
        
        const rect = canvas.getBoundingClientRect();
        
        if ('touches' in event) {
            const touch = event.touches[0];
            return {
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            };
        }
        
        return {
            offsetX: (event as MouseEvent).clientX - rect.left,
            offsetY: (event as MouseEvent).clientY - rect.top
        };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (hasBackground) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);
        }
    };

    const exportAs = (format: 'png' | 'jpg' | 'pdf') => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            if (format === 'pdf') {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`sketch-${Date.now()}.pdf`);
            } else {
                const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                const dataUrl = canvas.toDataURL(mimeType, 0.95);
                const link = document.createElement('a');
                link.download = `sketch-${Date.now()}.${format}`;
                link.href = dataUrl;
                link.click();
            }
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Success', message: `Sketch exported as ${format.toUpperCase()}`, type: 'success' }
            }));
        } catch (error) {
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: 'Failed to export sketch', type: 'error' }
            }));
            console.error('Export error:', error);
        }
    };

    const shareSketch = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                }, 'image/png');
            });

            const file = new File([blob], `sketch-${Date.now()}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: signatureMode ? 'My Signature' : 'My Sketch',
                    text: signatureMode ? 'Check out my signature' : 'Check out my sketch',
                });
            } else {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                    detail: { title: 'Success', message: 'Sketch copied to clipboard', type: 'success' }
                }));
            }
        } catch (error) {
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: 'Failed to share sketch', type: 'error' }
            }));
            console.error('Share error:', error);
        }
    };

    const handleTransform = (key: keyof typeof transform, delta: number) => {
        setTransform(prev => ({ ...prev, [key]: Number(prev[key]) + delta }));
    };

    return (
        <div className="flex flex-row h-full bg-white dark:bg-slate-900 rounded-[3.5rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-2xl">
            {/* Left Side: Specialized Tablet Tools */}
            <div className="w-20 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-white/5 flex flex-col items-center py-8 gap-6 shrink-0">
               <Button 
                 variant={mode === 'draw' ? 'default' : 'ghost'} 
                 size="icon" 
                 onClick={() => setMode('draw')}
                 className={`w-12 h-12 rounded-2xl ${mode === 'draw' ? 'bg-violet-600 shadow-lg shadow-violet-500/20' : 'text-slate-400'}`}
               >
                  <PenTool className="w-5 h-5" />
               </Button>
               <Button 
                 variant={mode === 'transform' ? 'default' : 'ghost'} 
                 size="icon" 
                 onClick={() => setMode('transform')}
                 className={`w-12 h-12 rounded-2xl ${mode === 'transform' ? 'bg-violet-600 shadow-lg shadow-violet-500/20' : 'text-slate-400'}`}
               >
                  <Move className="w-5 h-5" />
               </Button>
               <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
               
               {mode === 'draw' && (
                 <div className="flex flex-col gap-3">
                   {['black', '#ef4444', '#3b82f6', '#22c55e'].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-violet-500 scale-110 shadow-md' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                 </div>
               )}

               {mode === 'transform' && (
                 <div className="flex flex-col gap-4 items-center">
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-slate-400 hover:text-violet-600" onClick={() => handleTransform('scale', 0.1)}>
                       <Maximize className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-slate-400 hover:text-violet-600" onClick={() => handleTransform('rotate', 15)}>
                       <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-slate-400 hover:text-violet-600" onClick={() => handleTransform('tilt', 5)}>
                       <Layers className="w-4 h-4" />
                    </Button>
                 </div>
               )}

               <div className="mt-auto">
                 <Button variant="ghost" size="icon" onClick={onCancel} className="w-12 h-12 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                    <X className="w-5 h-5" />
                 </Button>
               </div>
            </div>

            {/* Main Interactive Canvas */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 dark:bg-slate-950/30">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-white/5">
                            <PenTool className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Creative Hub</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">Neural Drawing Link Activated</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={clear} className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400" title="Clear Canvas">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={shareSketch} className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400" title="Neural Share">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={save} className="h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[9px] tracking-widest px-8 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                            Complete Sync
                        </Button>
                    </div>
                </div>

                <div className={`flex-1 relative touch-none cursor-crosshair overflow-hidden ${hasBackground ? 'bg-white' : 'bg-transparent'}`}>
                    <div 
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
                      style={{ 
                        transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotate}deg) scale(${transform.scale}) skewX(${transform.tilt}deg)` 
                      }}
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseUp={finishDrawing}
                            onMouseMove={draw}
                            onMouseLeave={finishDrawing}
                            onTouchStart={startDrawing}
                            onTouchEnd={finishDrawing}
                            onTouchMove={draw}
                            className="max-w-full max-h-full shadow-2xl rounded-lg"
                        />
                    </div>
                </div>
                <div className="px-8 py-3 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                      iPad Precise Inking Enabled • {mode.toUpperCase()} MODE ACTIVE
                    </span>
                </div>
            </div>
        </div>
    );
}
