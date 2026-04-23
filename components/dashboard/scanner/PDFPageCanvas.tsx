'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as fabric from 'fabric';
import { PDFEngine } from '@/lib/pdf/engine';
import { PDFTool } from './PDFToolbar';
import { Loader2 } from 'lucide-react';

interface PDFPageCanvasProps {
  pdf: any;
  pageNumber: number;
  tool: PDFTool;
  zoom: number;
  onAnnotationsChange: (annotations: any[]) => void;
  initialAnnotations?: any[];
  signColor?: 'colored' | 'black';
}

export const PDFPageCanvas = forwardRef(({ 
  pdf, 
  pageNumber, 
  tool, 
  zoom, 
  onAnnotationsChange,
  initialAnnotations = [],
  signColor = 'colored'
}: PDFPageCanvasProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    addObject: (dataUrl: string) => {
      const fCanvas = fabricCanvasRef.current;
      if (!fCanvas) return;
      fabric.Image.fromURL(dataUrl).then(img => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.4,
          scaleY: 0.4,
          cornerStyle: 'circle',
          transparentCorners: false,
          cornerColor: '#f43f5e',
          cornerSize: 10,
        });
        fCanvas.add(img);
        fCanvas.setActiveObject(img);
        fCanvas.requestRenderAll();
        saveHistory();
      });
    },
    undo: () => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        loadHistory(newIndex);
        setHistoryIndex(newIndex);
      }
    },
    redo: () => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        loadHistory(newIndex);
        setHistoryIndex(newIndex);
      }
    },
    getAnnotations: () => {
      const fCanvas = fabricCanvasRef.current;
      return fCanvas ? fCanvas.toJSON() : null;
    }
  }));

  const saveHistory = () => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;
    const json = JSON.stringify(fCanvas.toJSON());
    setHistory(prev => [...prev.slice(0, historyIndex + 1), json]);
    setHistoryIndex(prev => prev + 1);
  };

  const loadHistory = (index: number) => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas || !history[index]) return;
    fCanvas.loadFromJSON(history[index]).then(() => {
      fCanvas.requestRenderAll();
    });
  };

  // 1. Initialize Canvas & Deletion Logic
  useEffect(() => {
    let isMounted = true;

    async function initCanvas() {
      if (!canvasRef.current || !pdf) return;
      
      setIsLoading(true);
      const bgCanvas = document.createElement('canvas');
      await PDFEngine.renderPageToCanvas(pdf, pageNumber, bgCanvas, 2.0);
      
      if (!isMounted) return;

      const fCanvas = new fabric.Canvas(canvasRef.current, {
        width: bgCanvas.width / 2,
        height: bgCanvas.height / 2,
        backgroundColor: 'white',
      });
      
      // Store instance for global toolbar access (v18.1.7)
      (canvasRef.current as any).__fabricCanvas = fCanvas;
      (canvasRef.current as any).__undo = () => {
         if (historyIndex > 0) {
           const newIndex = historyIndex - 1;
           loadHistory(newIndex);
           setHistoryIndex(newIndex);
         }
      };
      (canvasRef.current as any).__redo = () => {
         if (historyIndex < history.length - 1) {
           const newIndex = historyIndex + 1;
           loadHistory(newIndex);
           setHistoryIndex(newIndex);
         }
      };

      // Custom Delete Control
      const deleteIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ff0000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3Csvg%3E";
      const img = document.createElement('img');
      img.src = deleteIcon;

      const fabricObj = fabric.FabricObject as any;
      if (!fabricObj.prototype.controls) {
        fabricObj.prototype.controls = {};
      }
      fabricObj.prototype.controls.deleteControl = new fabric.Control({
        x: 0.5,
        y: -0.5,
        offsetY: -16,
        offsetX: 16,
        cursorStyle: 'pointer',
        mouseUpHandler: (eventData, transformData) => {
          const target = transformData.target;
          const canvas = target.canvas;
          if (canvas) {
            canvas.remove(target);
            canvas.requestRenderAll();
            saveHistory();
          }
          return true;
        },
        render: (ctx, left, top, styleOverride, fabricObject) => {
          const size = 24;
          ctx.save();
          ctx.translate(left, top);
          ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      });

      const bgImage = new fabric.Image(bgCanvas, {
        scaleX: 0.5,
        scaleY: 0.5,
        selectable: false,
        evented: false,
      });
      fCanvas.add(bgImage);
      fCanvas.sendObjectToBack(bgImage);

      fabricCanvasRef.current = fCanvas;
      
      // 4. Load initial state
      if (initialAnnotations) {
        await fCanvas.loadFromJSON(initialAnnotations);
        // Ensure background image is at the back and non-selectable
        const objects = fCanvas.getObjects();
        const possibleBg = objects.find(o => o.type === 'image' && (o as any).selectable === false);
        if (possibleBg) {
          fCanvas.sendObjectToBack(possibleBg);
        } else {
          fCanvas.add(bgImage);
          fCanvas.sendObjectToBack(bgImage);
        }
      } else {
        fCanvas.add(bgImage);
        fCanvas.sendObjectToBack(bgImage);
      }
      
      // High-Fidelity Performance Tuning: Debounce updates to prevent UI blocking
      let syncTimeout: any;
      const updateParent = () => {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          if (!fCanvas) return;
          const json = fCanvas.toJSON();
          onAnnotationsChange(json);
        }, 300); // 300ms buffer for stability
      };

      fCanvas.on('object:modified', () => {
        updateParent();
        saveHistory();
      });

      fCanvas.on('object:added', () => {
        updateParent();
        saveHistory();
      });

      fCanvas.on('object:removed', () => {
        updateParent();
        saveHistory();
      });

      setIsLoading(false);
      // Initial state for undo
      const initialJson = JSON.stringify(fCanvas.toJSON());
      setHistory([initialJson]);
      setHistoryIndex(0);
    }

    initCanvas();

    const handleKeyDown = (e: KeyboardEvent) => {
      const fCanvas = fabricCanvasRef.current;
      if (!fCanvas) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = fCanvas.getActiveObjects();
        if (activeObjects.length > 0) {
          fCanvas.remove(...activeObjects);
          fCanvas.discardActiveObject();
          fCanvas.requestRenderAll();
          saveHistory();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [pdf, pageNumber]);

  // 2. Handle Tool Changes
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    fCanvas.isDrawingMode = tool === 'pencil' || tool === 'highlight' || tool === 'eraser';
    
    // Set Tool Specific Cursors (v17.9.0)
    const cursors: Record<string, string> = {
      'pencil': 'crosshair',
      'highlight': 'text',
      'eraser': 'cell',
      'check': 'copy',
      'cross': 'not-allowed',
      'text': 'text',
      'select': 'default'
    };
    fCanvas.defaultCursor = cursors[tool] || 'default';
    fCanvas.hoverCursor = 'pointer';

    if (fCanvas.isDrawingMode) {
      const brush = new fabric.PencilBrush(fCanvas);
      if (tool === 'eraser') {
        brush.width = 15;
        brush.color = 'white'; // Surgical Erase (Masking)
      } else {
        brush.width = tool === 'highlight' ? 20 : 2;
        brush.color = tool === 'highlight' ? 'rgba(255, 255, 0, 0.3)' : 'black';
      }
      fCanvas.freeDrawingBrush = brush;
    }

    let mouseDownPos = { x: 0, y: 0 };

    const handleMouseDown = (opt: any) => {
      const pointer = fCanvas.getScenePoint(opt.e);
      mouseDownPos = { x: pointer.x, y: pointer.y };
    };

    const handleMouseUp = (opt: any) => {
      const fCanvas = fabricCanvasRef.current;
      if (!fCanvas || fCanvas.isDrawingMode) return;

      const pointer = fCanvas.getScenePoint(opt.e);
      const target = fCanvas.findTarget(opt.e);
      
      // Calculate movement distance to distinguish click from drag
      const dist = Math.sqrt(Math.pow(pointer.x - mouseDownPos.x, 2) + Math.pow(pointer.y - mouseDownPos.y, 2));
      
      // If we are in select mode, prioritize targeting existing objects
      if (tool === 'select') return;

      // If we are dragging an existing object or if the mouse moved too much, don't create new
      if (target && dist > 2) return;

      if (tool === 'text') {
        const text = new fabric.IText('', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 18,
          fontFamily: 'Helvetica',
          cornerStyle: 'circle',
          cornerColor: '#f43f5e',
        });
        fCanvas.add(text);
        fCanvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
      } else if (tool === 'ellipse') {
        const ellipse = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 40,
          ry: 25,
          fill: 'transparent',
          stroke: '#f43f5e',
          strokeWidth: 2,
          cornerStyle: 'circle',
        });
        fCanvas.add(ellipse);
        fCanvas.setActiveObject(ellipse);
      } else if (tool === 'check') {
        const check = new fabric.IText('✓', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 22,
          fill: signColor === 'black' ? 'black' : '#10b981', // Emerald 500
          fontWeight: 'bold',
        });
        fCanvas.add(check);
      } else if (tool === 'cross') {
        const cross = new fabric.IText('✗', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 22,
          fill: signColor === 'black' ? 'black' : '#f43f5e', // Rose 500
          fontWeight: 'bold',
        });
        fCanvas.add(cross);
      } else if (tool === 'edit-text') {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 140,
          height: 28,
          fill: 'white',
        });
        const text = new fabric.IText('', {
          left: pointer.x + 4,
          top: pointer.y + 4,
          fontSize: 14,
          fontFamily: 'Helvetica',
        });
        fCanvas.add(rect, text);
        fCanvas.setActiveObject(text);
        text.enterEditing();
      } else if (tool === 'annotations') {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 150,
          height: 100,
          fill: '#fef08a',
          shadow: new fabric.Shadow({ blur: 10, color: 'rgba(0,0,0,0.1)', offsetX: 5, offsetY: 5 }),
        });
        const text = new fabric.IText('Neural Note...', {
          left: pointer.x + 10,
          top: pointer.y + 10,
          fontSize: 13,
          width: 130,
        });
        fCanvas.add(rect, text);
      } else if (tool === 'link') {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 120,
          height: 40,
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          strokeWidth: 1,
          strokeDashArray: [6, 4],
        });
        fCanvas.add(rect);
      }
      saveHistory();
    };

    fCanvas.on('mouse:down', handleMouseDown);
    fCanvas.on('mouse:up', handleMouseUp);
    fCanvas.on('path:created', () => saveHistory());
    return () => {
      fCanvas.off('mouse:down', handleMouseDown);
      fCanvas.off('mouse:up', handleMouseUp);
      fCanvas.off('path:created');
    };
  }, [tool, signColor]);

  return (
    <div 
      ref={containerRef} 
      data-page={pageNumber}
      className="relative flex justify-center bg-slate-100 dark:bg-slate-900/50 p-10 h-full overflow-auto"
      style={{ zoom: zoom }}
    >
      <div className="relative shadow-2xl bg-white h-fit">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
             <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        )}
        <canvas ref={canvasRef} data-page={pageNumber} />
      </div>
    </div>
  );
});

PDFPageCanvas.displayName = 'PDFPageCanvas';
