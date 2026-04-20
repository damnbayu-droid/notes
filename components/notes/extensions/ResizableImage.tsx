'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { motion, useDragControls } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Maximize2, RotateCw, Move, Type, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

// Protocol CREATIVE-SUITE (v9.0.0)
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setImage: (options: { src: string, alt?: string, width?: string, height?: string, style?: string }) => ReturnType,
    }
  }
}

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  selectable: true,
  draggable: false, // Disabling Tiptap's native dragging to prevent "Lag Syndrome"
  inline: false,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: '300px' },
      widthPercentage: { default: 50 },
      height: { default: 'auto' },
      rotate: { default: 0 },
      top: { default: 0 },
      left: { default: 0 },
      zIndex: { default: 1 },
      position: { default: 'relative' },
      align: { default: 'center' }, // new: left | center | right
      className: { default: 'rounded-2xl shadow-xl transition-all duration-300' }
    }
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const isAbsolute = HTMLAttributes.position === 'absolute'
    const align = HTMLAttributes.align || 'center'
    
    // Neural Alignment Logic
    const margin = align === 'left' ? '0 auto 0 0' : align === 'right' ? '0 0 0 auto' : '0 auto'
    
    const style = [
        `width: ${HTMLAttributes.width || '300px'}`,
        `transform: rotate(${HTMLAttributes.rotate || 0}deg)`,
        `z-index: ${HTMLAttributes.zIndex || 1}`,
        isAbsolute 
          ? `position: absolute; top: ${HTMLAttributes.top}px; left: ${HTMLAttributes.left}px; margin: 0;` 
          : `position: relative; display: block; margin: ${margin};`,
    ].join('; ')

    return [
        'div', 
        mergeAttributes(HTMLAttributes, { 
            'data-type': 'resizable-image',
            'style': style
        }), 
        ['img', { 
            src: HTMLAttributes.src, 
            alt: HTMLAttributes.alt,
            style: 'width: 100%; height: auto; display: block;'
        }]
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes, selected, deleteNode }) => {
      const [isResizing, setIsResizing] = useState(false)
      const containerRef = useRef<HTMLDivElement>(null)
      const dragControls = useDragControls()

      const handleResize = (e: any) => {
        if (!isResizing || !containerRef.current) return
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
        const rect = containerRef.current.getBoundingClientRect()
        const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth
        
        const newWidthPx = clientX - rect.left
        const newPercentage = Math.round((newWidthPx / parentWidth) * 100)
        const clampedPercent = Math.max(5, Math.min(100, newPercentage))
        
        updateAttributes({ 
          widthPercentage: clampedPercent,
          width: `${clampedPercent}%` 
        })
      }

      useEffect(() => {
        if (isResizing) {
          window.addEventListener('mousemove', handleResize)
          window.addEventListener('mouseup', () => setIsResizing(false))
          window.addEventListener('touchmove', handleResize)
          window.addEventListener('touchend', () => setIsResizing(false))
        }
        return () => {
          window.removeEventListener('mousemove', handleResize)
          window.removeEventListener('mouseup', () => setIsResizing(false))
          window.removeEventListener('touchmove', handleResize)
          window.removeEventListener('touchend', () => setIsResizing(false))
        }
      }, [isResizing])

      const isAbsolute = node.attrs.position === 'absolute'
      const isBehind = node.attrs.zIndex < 1
      const align = node.attrs.align || 'center'

      return (
        <NodeViewWrapper 
          className={`resizable-image-node w-full ${isAbsolute ? 'absolute m-0' : 'relative my-8 flex'}`}
          style={{
            zIndex: node.attrs.zIndex,
            top: isAbsolute ? `${node.attrs.top}px` : 'auto',
            left: isAbsolute ? `${node.attrs.left}px` : 'auto',
            justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
          }}
        >
          <motion.div
            ref={containerRef}
            drag={isAbsolute} 
            dragControls={dragControls}
            dragListener={true} // Enabled for high-fidelity move (v9.0.0)
            dragMomentum={false} // Prevents "gliding" awkwardness
            whileDrag={{ 
                scale: 1.02, 
                opacity: 0.9, 
                cursor: 'grabbing',
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
            }}
            onDragEnd={(_, info) => {
              if (isAbsolute) {
                updateAttributes({
                    top: node.attrs.top + info.offset.y,
                    left: node.attrs.left + info.offset.x
                })
              }
            }}
            style={{
              width: node.attrs.width,
              transform: `rotate(${node.attrs.rotate}deg)`,
              opacity: isBehind ? 0.7 : 1,
              filter: isBehind ? 'grayscale(0.3) blur(0.5px)' : 'none',
              touchAction: 'none',
            }}
            className={`relative group ${node.attrs.className} cursor-grab border-2 transition-all ${selected ? 'border-violet-500 ring-4 ring-violet-500/10' : 'border-transparent hover:border-violet-300'}`}
          >
            <img 
              src={node.attrs.src} 
              alt={node.attrs.alt} 
              className="w-full h-auto object-contain select-none pointer-events-none rounded-xl" 
            />

            {selected && (
              <>
                {/* 4 Corner Canva Handles */}
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                  <div 
                    key={pos}
                    className={`absolute w-3.5 h-3.5 bg-white border-[3px] border-violet-600 rounded-full z-[150] cursor-nwse-resize shadow-lg hover:scale-125 transition-transform ${pos === 'top-left' ? '-top-2 -left-2' : pos === 'top-right' ? '-top-2 -right-2' : pos === 'bottom-left' ? '-bottom-2 -left-2' : '-bottom-2 -right-2'}`}
                    onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); }}
                    onTouchStart={(e) => { e.stopPropagation(); setIsResizing(true); }}
                  />
                ))}

                {/* Precision Move Handle (v9.0.0) */}
                <div 
                    className="absolute inset-x-0 -top-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className="bg-violet-600 rounded-full p-1 shadow-lg ring-2 ring-white">
                        <Move className="w-3 h-3 text-white" />
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute inset-0 border-2 border-violet-500 pointer-events-none rounded-xl scale-[1.01]" />
                
                {/* Micro-Toolbar (Optimized v11.0) */}
                <div 
                    className="absolute -top-12 sm:-top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[200] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity scale-90 sm:scale-100"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                   <div className="px-1.5 py-0.5 text-[8px] font-black text-white/50">{node.attrs.widthPercentage}%</div>
                   <button 
                      onClick={() => updateAttributes({ rotate: (node.attrs.rotate + 90) % 360 })}
                      className="p-1 text-slate-300 hover:text-white"
                   >
                       <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                   </button>
                   <button 
                      onClick={() => deleteNode()}
                      className="p-1 text-rose-400 hover:text-rose-300"
                   >
                       <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                   </button>
                </div>
              </>
            )}
          </motion.div>
        </NodeViewWrapper>
      )
    })
  },
})
