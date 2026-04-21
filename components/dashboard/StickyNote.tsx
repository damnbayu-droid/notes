'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { X, Pin, Trash2, Send, Download, Check, Maximize2, Minimize2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface StickyNoteProps {
  id: string
  content: string
  x: number
  y: number
  width?: number
  height?: number
  onClose: (id: string) => void
  onUpdate: (id: string, updates: Partial<{ content: string; x: number; y: number; width?: number; height?: number }>) => void
}

export function StickyNote({ id, content, x, y, width, height, onClose, onUpdate }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(content)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBroadcasted, setIsBroadcasted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [size, setSize] = useState({ width: width || 260, height: height || 220 })

  const dragControls = useDragControls()

  const handleDragEnd = (_: any, info: any) => {
    onUpdate(id, { x: info.point.x, y: info.point.y })
  }

  const handleResize = (e: any, info: any) => {
    const newWidth = Math.max(200, size.width + info.delta.x)
    const newHeight = Math.max(40, size.height + info.delta.y)
    setSize({ width: newWidth, height: newHeight })
  }

  const handleResizeEnd = () => {
    onUpdate(id, { width: size.width, height: size.height })
  }

  const handleBroadcast = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Smart Note Intelligence',
          text: text || 'Empty Intelligence Node',
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(text)
        toast.success('Note Intelligence Copied to Clipboard')
      }
      setIsBroadcasted(true)
      setTimeout(() => setIsBroadcasted(false), 2000)
    } catch (err) {
      toast.error('Broadcast Failure')
    }
  }

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([text || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `smart-note-${id.substring(0, 8)}.txt`;
    document.body.appendChild(element);
    element.click();
    toast.success('Intelligence Exported', { description: 'Content saved as .txt file' });
  }

  const handlePopOut = async () => {
    if (!('documentPictureInPicture' in window)) {
      toast.error('Experimental Feature', { description: 'Your browser does not support Document Picture-in-Picture.' });
      return;
    }

    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 300,
        height: 350,
      });

      // Clone styles
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          if (styleSheet.cssRules) {
            const newStyle = pipWindow.document.createElement('style');
            [...styleSheet.cssRules].forEach((rule) => {
              newStyle.appendChild(pipWindow.document.createTextNode(rule.cssText));
            });
            pipWindow.document.head.appendChild(newStyle);
          } else if (styleSheet.href) {
            const newLink = pipWindow.document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = styleSheet.href;
            pipWindow.document.head.appendChild(newLink);
          }
        } catch (e) {
          console.error('Failed to clone stylesheet', e);
        }
      });

      // Render content
      const container = pipWindow.document.createElement('div');
      container.className = 'p-6 h-full bg-yellow-200 dark:bg-yellow-900 font-bold text-slate-900 dark:text-yellow-50 flex flex-col';
      container.style.fontFamily = 'Permanent Marker, cursive';

      const contentDiv = pipWindow.document.createElement('div');
      contentDiv.innerText = text || '';
      contentDiv.style.fontSize = '20px';
      contentDiv.style.lineHeight = '1.2';
      contentDiv.style.whiteSpace = 'pre-wrap';
      container.appendChild(contentDiv);

      pipWindow.document.body.appendChild(container);

      toast.success('Node Decoupled', { description: 'Sticky note popped out to OS layer.' });
      onClose(id);
    } catch (err) {
      toast.error('Decoupling Failure');
    }
  }

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.9, x, y }}
      animate={{
        opacity: 1,
        scale: 1,
        x: isMaximized ? 0 : x,
        y: isMaximized ? 0 : y,
        width: isMaximized ? '100vw' : (isMinimized ? '200px' : size.width),
        height: isMaximized ? '100vh' : (isMinimized ? '40px' : size.height),
        zIndex: isMaximized ? 1000 : 500
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed ${isMaximized ? 'top-0 left-0 rounded-none' : 'rounded-sm'} bg-yellow-200 dark:bg-yellow-900/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-t-[40px] border-yellow-300/80 dark:border-yellow-800/80 group flex flex-col transition-all duration-300`}
      style={{
        fontFamily: 'Permanent Marker, cursive, sans-serif',
        minWidth: isMinimized ? '200px' : '200px',
        minHeight: isMinimized ? '40px' : '40px',
        overflow: 'visible'
      }}
    >
      {/* Drag Handle (Header Area) */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="absolute top-[-40px] left-0 right-0 h-10 cursor-grab active:cursor-grabbing z-20"
      />

      {/* MacBook Style Header Dots (Top Left) */}
      <div className="absolute top-[-32px] left-3 flex items-center gap-2 z-30 pointer-events-auto">
        <button 
           onClick={() => setIsDeleting(true)}
           className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:brightness-90 transition-all shadow-sm flex items-center justify-center group/btn"
           title="Delete Intelligence"
        >
           <Trash2 className="w-2 text-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        </button>
        <button 
           onClick={() => setIsMinimized(!isMinimized)}
           className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:brightness-90 transition-all shadow-sm"
           title="Minimize Node"
        />
        <button 
           onClick={() => setIsMaximized(!isMaximized)}
           className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:brightness-90 transition-all shadow-sm"
           title="Focus/Maximize"
        />
      </div>

      {/* Red Pin (Center) */}
      {!isMaximized && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="w-5 h-5 bg-rose-600 rounded-full shadow-[0_6px_15px_rgba(225,29,72,0.6)] relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-rose-400 rounded-full" />
          </div>
        </div>
      )}

      {/* Right Header Actions (X) */}
      {/* Right Header Actions (X) */}
      <div className="absolute top-[-34px] right-3 flex items-center gap-1 z-30">
        <button 
           onClick={() => setIsDeleting(true)}
           className="p-1.5 rounded-lg text-slate-500/50 hover:text-rose-600 hover:bg-rose-50 transition-all"
           title="Delete Node"
        >
           <Trash2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onClose(id)}
          className="p-1.5 rounded-lg text-slate-500/50 hover:text-rose-600 hover:bg-rose-50 transition-all"
          title="Dismiss Note"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-rose-600/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-white mb-4">Purge Intelligence Node?</p>
            <div className="flex gap-2">
              <button
                onClick={() => onClose(id)}
                className="px-4 py-2 bg-white text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl"
              >
                Confirm
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 bg-rose-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
              >
                Abort
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col pt-3 animate-in fade-in duration-500">
          {isEditing ? (
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => {
                setIsEditing(false)
                onUpdate(id, { content: text })
              }}
              className="w-full flex-1 bg-transparent border-none outline-none resize-none text-slate-900 dark:text-yellow-50 font-black text-xl leading-tight placeholder:opacity-20"
              placeholder="Neural data..."
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="w-full flex-1 text-slate-900 dark:text-yellow-50 font-black text-xl leading-tight whitespace-pre-wrap cursor-text"
            >
              {text || "Double tap to initialize data..."}
            </div>
          )}
        </div>
      )}

      {/* Footer Tools */}
      {!isMinimized && (
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <button
              onClick={handleBroadcast}
              className={`p-1.5 rounded-lg transition-all ${isBroadcasted ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-black/5'}`}
              title="Broadcast Node"
            >
              {isBroadcasted ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handlePopOut}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-black/5 hover:text-violet-600 transition-all"
              title="Pop Out Intelligence (OS Layer)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-black/5 transition-all"
              title="Export to Disk (.txt)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tactile Unit v2.3</span>
        </div>
      )}

      {/* Aesthetic Fold */}
      {!isMaximized && !isMinimized && (
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/5 dark:bg-white/5 clip-path-fold pointer-events-none" />
      )}

      {/* Custom Resize Handle (Bottom Right) */}
      {!isMaximized && !isMinimized && (
        <motion.div
          drag
          dragMomentum={false}
          onDrag={handleResize}
          onDragEnd={handleResizeEnd}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-40 flex items-center justify-center group/resize"
        >
          <div className="w-1.5 h-1.5 bg-black/10 dark:bg-white/10 rounded-full group-hover/resize:bg-violet-500/50 transition-colors" />
        </motion.div>
      )}
    </motion.div>
  )
}
