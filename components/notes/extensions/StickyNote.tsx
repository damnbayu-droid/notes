'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { motion } from 'framer-motion'
import { Maximize2, Pin } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export const StickyNote = Node.create({
  name: 'stickyNote',
  group: 'block',
  content: 'inline*',
  draggable: true,

  addAttributes() {
    return {
      width: { default: '200px' },
      height: { default: 'auto' },
      color: { default: '#fef08a' }, // Tailwind yellow-200
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="sticky-note"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sticky-note' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes, selected }) => {
      const [isResizing, setIsResizing] = useState(false)
      const containerRef = useRef<HTMLDivElement>(null)

      const handleResize = (e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return
        const width = e.clientX - containerRef.current.getBoundingClientRect().left
        updateAttributes({ width: `${width}px` })
      }

      useEffect(() => {
        if (isResizing) {
          window.addEventListener('mousemove', handleResize)
          window.addEventListener('mouseup', () => setIsResizing(false))
        }
        return () => window.removeEventListener('mousemove', handleResize)
      }, [isResizing])

      return (
        <NodeViewWrapper className="sticky-note-wrapper my-8 flex justify-center">
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: node.attrs.width,
              minHeight: '150px',
              backgroundColor: node.attrs.color,
            }}
            className={`p-6 pb-12 relative shadow-xl rounded-sm group transition-all duration-300 ${selected ? 'ring-4 ring-violet-500/30 -rotate-1' : 'hover:-rotate-1 hover:shadow-2xl'}`}
          >
            {/* Neural Pin Icon */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
               <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <Pin className="w-4 h-4 text-white fill-current" />
               </div>
            </div>

            {/* Editable Content */}
            <div className="prose prose-sm dark:prose-invert italic font-medium text-slate-800">
               <NodeViewContent />
            </div>

            {/* Resize Grip */}
            {selected && (
              <div 
                onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                className="absolute bottom-2 right-2 w-6 h-6 bg-black/10 rounded-lg flex items-center justify-center cursor-nwse-resize hover:bg-black/20 transition-colors"
              >
                <Maximize2 className="w-3 h-3 text-slate-600" />
              </div>
            )}

            {/* Shadow Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          </motion.div>
        </NodeViewWrapper>
      )
    })
  },
})
