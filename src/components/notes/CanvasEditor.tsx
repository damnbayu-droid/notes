import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, RotateCcw, PenTool, Download, Share2, FileImage } from 'lucide-react';
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
}

export function CanvasEditor({ onSave, onCancel, signatureMode = false }: CanvasEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState(signatureMode ? 'black' : 'black');
    const [lineWidth] = useState(signatureMode ? 3 : 2);
    const [hasBackground, setHasBackground] = useState(true);
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
    }, [hasBackground]);

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = color;
        }
    }, [color]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
        if (!contextRef.current) return;

        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        if (!contextRef.current) return;
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !contextRef.current) return;

        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const getCoordinates = (event: MouseEvent | TouchEvent) => {
        if ('touches' in event) {
            const touch = event.touches[0];
            const canvas = canvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                return {
                    offsetX: touch.clientX - rect.left,
                    offsetY: touch.clientY - rect.top
                };
            }
        }
        return {
            offsetX: (event as MouseEvent).offsetX,
            offsetY: (event as MouseEvent).offsetY
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
                // Export as PDF
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`sketch-${Date.now()}.pdf`);
                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                    detail: { title: 'Success', message: 'Sketch exported as PDF', type: 'success' }
                }));
            } else {
                // Export as PNG or JPG
                const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                const dataUrl = canvas.toDataURL(mimeType, 0.95);
                const link = document.createElement('a');
                link.download = `sketch-${Date.now()}.${format}`;
                link.href = dataUrl;
                link.click();
                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                    detail: { title: 'Success', message: `Sketch exported as ${format.toUpperCase()}`, type: 'success' }
                }));
            }
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
                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                    detail: { title: 'Success', message: 'Sketch shared successfully', type: 'success' }
                }));
            } else {
                // Fallback: copy to clipboard
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

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between p-2 border-b">
                <div className="flex gap-2 items-center">
                    <PenTool className="w-4 h-4 text-gray-500 mr-2" />
                    {!signatureMode && ['black', '#ef4444', '#3b82f6', '#22c55e'].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-violet-500 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    <div className="flex items-center gap-2 ml-4">
                        <Checkbox
                            id="background"
                            checked={hasBackground}
                            onCheckedChange={(checked) => setHasBackground(checked as boolean)}
                        />
                        <label htmlFor="background" className="text-xs text-gray-600 cursor-pointer">
                            Background
                        </label>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clear} title="Clear">
                        <RotateCcw className="w-4 h-4" />
                    </Button>

                    {/* Export Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" title="Export">
                                <Download className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Export as</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => exportAs('png')}>
                                <FileImage className="w-4 h-4 mr-2" />
                                PNG
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportAs('jpg')}>
                                <FileImage className="w-4 h-4 mr-2" />
                                JPG
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportAs('pdf')}>
                                <FileImage className="w-4 h-4 mr-2" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="sm" onClick={shareSketch} title="Share">
                        <Share2 className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={onCancel} title="Cancel">
                        <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={save} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                        <Save className="w-4 h-4" />
                        Save
                    </Button>
                </div>
            </div>

            <div className={`flex-1 relative touch-none cursor-crosshair ${hasBackground ? 'bg-white' : 'bg-gray-50'}`}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseMove={draw}
                    onMouseLeave={finishDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={finishDrawing}
                    onTouchMove={draw}
                    className="w-full h-full block"
                />
            </div>
            <p className="text-xs text-center text-gray-400 py-1">
                {signatureMode ? 'Sign above. Works with touch and mouse.' : 'Draw above. Works with touch and mouse.'}
            </p>
        </div>
    );
}
