'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { StickyNote } from './StickyNote'

interface NoteData {
  id: string
  content: string
  x: number
  y: number
}

export function StickyNoteManager() {
  const [notes, setNotes] = useState<NoteData[]>([])
  const [hasMounted, setHasMounted] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dcpi_sticky_notes')
    if (saved) {
      try {
        setNotes(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load sticky notes', e)
      }
    }
    setHasMounted(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem('dcpi_sticky_notes', JSON.stringify(notes))
    }
  }, [notes, hasMounted])

  useEffect(() => {
    const handleAdd = () => {
      const newNote: NoteData = {
        id: crypto.randomUUID(),
        content: '',
        x: 100 + (Math.random() * 100),
        y: 100 + (Math.random() * 100)
      }
      setNotes(prev => [...prev, newNote])
    }

    window.addEventListener('add-sticky-note', handleAdd)
    return () => window.removeEventListener('add-sticky-note', handleAdd)
  }, [])

  const handleClose = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const handleUpdate = (id: string, updates: Partial<NoteData>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
  }

  if (!hasMounted) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[490]">
      <div className="relative w-full h-full pointer-events-none">
        <AnimatePresence>
          {notes.map(note => (
            <div key={note.id} className="absolute inset-0 pointer-events-none">
              <div className="pointer-events-auto">
                <StickyNote
                  {...note}
                  onClose={handleClose}
                  onUpdate={handleUpdate}
                />
              </div>
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
