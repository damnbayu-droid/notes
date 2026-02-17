import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, RotateCcw, PenTool } from 'lucide-react';

interface CanvasEditorProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

export function CanvasEditor({ onSave, onCancel }: CanvasEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('black');
    const [lineWidth, setLineWidth] = useState(2);
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
            contextRef.current = ctx;
        }

        // Handle resize slightly? For now fixed on mount is okay for modal
    }, []);

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
        // Handle touch events
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
        // Handle mouse events
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
        }
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Create a white background context copy if needed, 
            // but for now transparent is fine or we can composite.
            // Let's composite white background for better visibility in dark mode notes?
            // Or just transparent.
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);
        }
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between p-2 border-b">
                <div className="flex gap-2 items-center">
                    <PenTool className="w-4 h-4 text-gray-500 mr-2" />
                    {['black', '#ef4444', '#3b82f6', '#22c55e'].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-violet-500 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clear} title="Clear">
                        <RotateCcw className="w-4 h-4" />
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

            <div className="flex-1 bg-white relative touch-none cursor-crosshair">
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
                Draw above. Works with touch and mouse.
            </p>
        </div>
    );
}
