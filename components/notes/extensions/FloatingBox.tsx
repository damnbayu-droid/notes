'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { motion, useDragControls } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Maximize2, RotateCw, Move, Type, Settings2, Trash2, Palette } from 'lucide-react'

// Protocol NEURAL-FRAME-TOOL (v9.0.0)
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    floatingBox: {
      setBox: (options?: { backgroundColor?: string, borderColor?: string }) => ReturnType,
    }
  }
}

export const FloatingBox = Node.create({
  name: 'floatingBox',
  group: 'block',
  content: 'inline*',
  selectable: true,
  draggable: false, // Custom dragging
  inline: false,

  addAttributes() {
    return {
      width: { default: '300px' },
      widthPercentage: { default: 40 },
      height: { default: 'auto' },
      rotate: { default: 0 },
      top: { default: 100 },
      left: { default: 100 },
      zIndex: { default: 10 },
      backgroundColor: { default: 'rgba(139, 92, 246, 0.1)' }, // Default violet-500/10
      borderColor: { default: '#8b5cf6' }, // Default violet-500
      borderWidth: { default: '2px' },
      borderStyle: { default: 'solid' },
      padding: { default: '24px' },
      className: { default: 'rounded-2xl transition-all duration-300 backdrop-blur-sm' }
    }
  },

  addCommands() {
    return {
      setBox: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="floating-box"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const style = [
        `width: ${HTMLAttributes.width || '300px'}`,
        `transform: rotate(${HTMLAttributes.rotate || 0}deg)`,
        `z-index: ${HTMLAttributes.zIndex || 10}`,
        `position: absolute; top: ${HTMLAttributes.top}px; left: ${HTMLAttributes.left}px;`,
        `background-color: ${HTMLAttributes.backgroundColor}`,
        `border: ${HTMLAttributes.borderWidth} ${HTMLAttributes.borderStyle} ${HTMLAttributes.borderColor}`,
        `padding: ${HTMLAttributes.padding}`
    ].join('; ')

    return [
        'div', 
        mergeAttributes(HTMLAttributes, { 
            'data-type': 'floating-box',
            'style': style
        }), 
        0
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

      return (
        <NodeViewWrapper 
          className="floating-box-node absolute m-0"
          style={{
            zIndex: node.attrs.zIndex,
            top: `${node.attrs.top}px`,
            left: `${node.attrs.left}px`,
          }}
        >
          <motion.div
            ref={containerRef}
            drag
            dragControls={dragControls}
            dragListener={true} 
            dragMomentum={false} // Precision feel (v9.0.0)
            whileDrag={{ 
                scale: 1.02, 
                opacity: 0.9, 
                cursor: 'grabbing',
                boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
            }}
            onDragEnd={(_, info) => {
                updateAttributes({
                    top: node.attrs.top + info.offset.y,
                    left: node.attrs.left + info.offset.x
                })
            }}
            style={{
              width: node.attrs.width,
              height: node.attrs.height,
              transform: `rotate(${node.attrs.rotate}deg)`,
              backgroundColor: node.attrs.backgroundColor,
              border: `${node.attrs.borderWidth} ${node.attrs.borderStyle} ${node.attrs.borderColor}`,
              padding: node.attrs.padding,
            }}
            className={`relative group ${node.attrs.className} cursor-grab border-2 transition-all ${selected ? 'ring-4 ring-violet-500/20' : ''}`}
          >
            {/* Draggable Area Overlay */}
            <div className="absolute inset-x-0 -top-4 h-4 cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Move className="w-3 h-3 text-slate-400" />
            </div>

            {/* Editable Content */}
            <div className="prose prose-sm dark:prose-invert min-h-[40px] focus:outline-none">
                <NodeViewContent />
            </div>

            {selected && (
              <>
                {/* 4 Corner Canva Handles */}
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                  <div 
                    key={pos}
                    className={`absolute w-3 h-3 bg-white border-2 border-slate-900 rounded-full z-[150] cursor-nwse-resize shadow-lg hover:scale-125 transition-transform ${pos === 'top-left' ? '-top-1.5 -left-1.5' : pos === 'top-right' ? '-top-1.5 -right-1.5' : pos === 'bottom-left' ? '-bottom-1.5 -left-1.5' : '-bottom-1.5 -right-1.5'}`}
                    onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); }}
                    onTouchStart={(e) => { e.stopPropagation(); setIsResizing(true); }}
                  />
                ))}
                
                {/* Floating Micro-Toolbar (Selection Context) */}
                <div 
                    className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[200]"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                   <div className="px-2 py-0.5 text-[8px] font-black text-white/50">{node.attrs.widthPercentage}%</div>
                   <button 
                      onClick={() => updateAttributes({ rotate: (node.attrs.rotate + 90) % 360 })}
                      className="p-1.5 text-slate-300 hover:text-white"
                   >
                       <RotateCw className="w-3 h-3" />
                   </button>
                   <button 
                      onClick={() => deleteNode()}
                      className="p-1.5 text-rose-400 hover:text-rose-300"
                   >
                       <Trash2 className="w-3 h-3" />
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
