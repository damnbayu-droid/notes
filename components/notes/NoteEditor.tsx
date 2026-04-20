'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useDebounce } from '@/hooks/useDebounce'
import { ResizableImage } from './extensions/ResizableImage'
import { StickyNote } from './extensions/StickyNote'
import { FloatingBox } from './extensions/FloatingBox'
import type { Note, User, NoteCategory, NoteColor, NoteColorOption } from '@/types'
import { NOTE_COLORS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
    X, 
    Save, 
    Share2, 
    Trash2, 
    Pin, 
    Sparkles, 
    Loader2, 
    Globe, 
    Copy, 
    Check, 
    FilePlus, 
    Database, 
    Cloud, 
    Github, 
    Palette, 
    Tag, 
    Calendar,
    PenTool,
    Maximize2,
    Minimize2,
    Mic,
    RefreshCw,
    Plus,
    FileImage as ImageIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { VoiceRecorder } from './VoiceRecorder'
import { buildShareUrl } from '@/lib/shareUtils'
import { toast } from 'sonner'
import { OutsourcePicker } from './OutsourcePicker'
import { CanvasEditor } from './CanvasEditor'
import { motion, AnimatePresence } from 'framer-motion'
import { LineageHub } from './LineageHub'
import { processImageForNeural } from '@/lib/imageProcessor'
import { uploadNoteAsset } from '@/lib/supabase/storage'

interface NoteEditorProps {
  user: User | null
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: Partial<Note>) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onShareNote?: (id: string, type?: 'public', permission?: 'read' | 'write', isDiscoverable?: boolean, category?: NoteCategory) => Promise<{ success: boolean; slug?: string; error?: string }>
  onUnshareNote?: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function NoteEditor({ 
  user, 
  note, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  onShareNote, 
  onUnshareNote, 
  onTogglePin,
  onForkNote
}: NoteEditorProps & { onForkNote?: (id: string, content: string) => Promise<void> }) {
  const [editorHtml, setEditorHtml] = useState('')
  const [editorText, setEditorText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [color, setColor] = useState<NoteColor>(note?.color || 'default')
  const [tags, setTags] = useState<string[]>(note?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [reminderDate, setReminderDate] = useState(note?.reminder_date || '')
  const [showMetadata, setShowMetadata] = useState(false)
  const [showLineage, setShowLineage] = useState(false)
  
  // Integration States
  const [isOutsourceOpen, setIsOutsourceOpen] = useState(false)
  const [outsourceMode, setOutsourceMode] = useState<'drive' | 'resource'>('drive')
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sharing States
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false)
  const [isDiscoverable, setIsDiscoverable] = useState(note?.is_discoverable || false)
  const [isPremium, setIsPremium] = useState(note?.is_premium || false)
  const [domain, setDomain] = useState(note?.domain || 'default')
  const [category, setCategory] = useState<NoteCategory>(note?.category || 'General')
  const [isProcessingShare, setIsProcessingShare] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  
  // Reactive Sharing Engine (v9.6.0)
  const shareUrl = useMemo(() => buildShareUrl(note?.share_slug || ''), [note?.share_slug])

  const lastSavedState = useRef({ 
    html: '', 
    color: 'default' as NoteColor, 
    tags: [] as string[], 
    reminderDate: '', 
    isDiscoverable: false, 
    category: 'General' as NoteCategory,
    is_archived: false
  })

  // Auto-hide Dynamic Island when note editor is open
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('hide-header'))
    } else {
      window.dispatchEvent(new CustomEvent('show-header'))
    }
  }, [isOpen])

  // Reactive Title Extractor (v12.0.0)
  const currentTitle = useMemo(() => {
    const title = editorText.split('\n')[0] || note?.title || 'Untitled Node'
    const words = title.split(' ')
    return words.length > 2 ? words.slice(0, 2).join(' ') + '...' : title
  }, [editorText, note?.title])

  useEffect(() => {
    if (note) {
      setIsDiscoverable(Boolean(note.is_discoverable))
      setCategory(note.category || 'General')
      setColor(note.color || 'default')
      setTags(note.tags || [])
      setReminderDate(note.reminder_date || '')
      
      const initialHtml = note.content || ''
      lastSavedState.current = {
        html: initialHtml,
        color: note.color || 'default',
        tags: [...(note.tags || [])],
        reminderDate: note.reminder_date || '',
        isDiscoverable: Boolean(note.is_discoverable),
        category: note.category || 'General',
        is_archived: Boolean(note.is_archived)
      }
    }
  }, [note])

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Protocol HARDENED: Explicitly disable items offered by standalone packages or conflicting logic
      dropcursor: false,
      // @ts-ignore - In some versions these may be included in StarterKit
      link: false,
      // @ts-ignore
      underline: false,
    }),
    Link.configure({ 
      openOnClick: true, 
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: 'text-violet-600 dark:text-violet-400 underline decoration-2 underline-offset-4 font-bold cursor-pointer'
      }
    }),
    Placeholder.configure({
      placeholder: 'Start writing your intelligence node...',
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
    ResizableImage,
    StickyNote,
    FloatingBox,
  ], [])

  const editor = useEditor({
    extensions,
    content: note?.content || '',
    onUpdate: ({ editor }) => {
      setEditorHtml(editor.getHTML())
      setEditorText(editor.getText())
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none w-full max-w-none text-slate-900 dark:text-slate-100 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:leading-relaxed',
      },
    },
  })

  // Manual/Immediate Save Trigger (Protocol BUFF-DATA-INTEGRITY)
  const handleForceSave = useCallback(() => {
    if (!note || !editor) return
    
    const currentHtml = editor.getHTML()
    const currentText = editor.getText()
    
    // Empty File Guard
    if (!currentText.trim() || currentHtml === '<p></p>') return

    const hasChanged = 
      currentHtml !== lastSavedState.current.html ||
      color !== lastSavedState.current.color ||
      isDiscoverable !== lastSavedState.current.isDiscoverable ||
      category !== lastSavedState.current.category ||
      reminderDate !== lastSavedState.current.reminderDate ||
      JSON.stringify(tags) !== JSON.stringify(lastSavedState.current.tags)

    if (hasChanged) {
      setIsSaving(true)
      const title = currentText.split('\n')[0]?.substring(0, 100) || 'Untitled Note'
      onUpdate({ 
        title, 
        content: currentHtml, 
        color, 
        tags, 
        is_discoverable: isDiscoverable, 
        category,
        reminder_date: reminderDate || undefined,
        is_archived: note.is_archived
      })
      lastSavedState.current = {
        html: currentHtml,
        color,
        tags: [...tags],
        reminderDate: reminderDate || '',
        isDiscoverable,
        category,
        is_archived: Boolean(note.is_archived)
      }
      setTimeout(() => setIsSaving(false), 500)
    }
  }, [editor, note, color, tags, isDiscoverable, category, reminderDate, onUpdate])

  // Sync editor content when note changes
  useEffect(() => {
    if (note && editor) {
      if (editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || '')
      }
    } else if (!note && editor) {
      editor.commands.setContent('')
    }
  }, [note, editor])

  const debouncedHtml = useDebounce(editorHtml, 1500)
  const debouncedText = useDebounce(editorText, 1500)

  // Auto-save logic
  useEffect(() => {
    if (!isOpen || !note || !debouncedText.trim()) return

    const hasChanged = 
      debouncedHtml !== lastSavedState.current.html ||
      color !== lastSavedState.current.color ||
      isDiscoverable !== lastSavedState.current.isDiscoverable ||
      category !== lastSavedState.current.category ||
      reminderDate !== lastSavedState.current.reminderDate ||
      JSON.stringify(tags) !== JSON.stringify(lastSavedState.current.tags)

    if (hasChanged) {
      setIsSaving(true)
      const title = debouncedText.split('\n')[0]?.substring(0, 100) || 'Untitled Note'
      onUpdate({ 
        title, 
        content: debouncedHtml, 
        color, 
        tags, 
        is_discoverable: isDiscoverable, 
        category,
        reminder_date: reminderDate || undefined,
        is_archived: note.is_archived
      })
      lastSavedState.current = {
        html: debouncedHtml,
        color,
        tags: [...tags],
        reminderDate: reminderDate || '',
        isDiscoverable,
        category,
        is_archived: Boolean(note.is_archived)
      }
      setTimeout(() => setIsSaving(false), 800)
    }
  }, [debouncedHtml, debouncedText, color, tags, isDiscoverable, category, reminderDate, note, isOpen, onUpdate])

  const handleEditorClose = async () => {
    setIsSaving(true)
    try {
      await handleForceSave()
      localStorage.removeItem(`recovery_draft_${note?.id}`)
    } catch (err) {
      console.error('Final sync failed.')
    } finally {
      setIsSaving(false)
      onClose()
    }
  }

  const handleImportOutsource = (content: string, metadata: any) => {
    if (editor) {
      const separator = `<hr class="my-8 border-slate-100 dark:border-slate-800" />`
      const sourceHeader = `<div class="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Source: ${metadata.type === 'local_file' ? 'Local Intelligence Node' : (metadata.type || 'External')}</p>
        <p class="text-xs font-black text-slate-900 dark:text-white">${metadata.path || metadata.repo || 'Imported Asset'}</p>
      </div>`
      
      let formattedContent = content
      
      if (metadata.type === 'github_clone' || metadata.type === 'local_file') {
        const isJson = metadata.path?.toLowerCase().endsWith('.json')
        const isTechnical = isJson || metadata.path?.toLowerCase().match(/\.(ts|tsx|js|jsx|css|scss|md|txt)$/)
        
        if (isJson) {
           try {
             formattedContent = JSON.stringify(JSON.parse(content), null, 2)
           } catch (e) {
             formattedContent = content
           }
        }

        if (isTechnical) {
          formattedContent = `${separator}${sourceHeader}<pre class="text-[11px] font-mono leading-relaxed bg-slate-900 text-slate-100 p-6 rounded-3xl overflow-auto border border-slate-800 shadow-2xl"><code>${formattedContent}</code></pre>`
        } else {
          formattedContent = `${separator}${sourceHeader}${formattedContent}`
        }
      } else {
        formattedContent = `${separator}${sourceHeader}${content}`
      }
        
      editor.chain().focus().insertContent(formattedContent).run()
      
      onUpdate({ 
        external_source_url: metadata.url || 'local', 
        external_source_type: metadata.type, 
        external_source_title: metadata.path || metadata.repo 
      })
      
      toast.success('Resource Connected', { description: `Successfully ingested ${metadata.path || 'content'}.` })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editor && user) {
        const processingToast = toast.loading('Synthesizing Neural Media...')
        try {
            const { blob } = await processImageForNeural(file)
            const rawAlt = window.prompt("Description (Alt Tag):", "Neural snapshot")
            const altDescription = rawAlt?.trim() || "Visualized intelligence"
            const { url, error } = await uploadNoteAsset(user.id, blob, file.name)
            if (error) throw new Error(error)
            if (url) {
                editor.chain().focus().setImage({ src: url, alt: altDescription }).run()
                toast.success('Neural Media Ingress Successful', { id: processingToast })
            }
        } catch (err: any) {
            toast.error('Neural Machine Failure', { description: err.message, id: processingToast })
        }
    }
  }

  const colorOption = NOTE_COLORS.find((c: NoteColorOption) => c.value === color) || NOTE_COLORS[0]

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleEditorClose()}>
      <DialogContent 
        hideClose={true}
        className={`${isMaximized ? 'sm:max-w-none w-full h-screen rounded-none' : 'sm:max-w-[1000px] h-[95vh] sm:h-[90vh] rounded-[2rem] sm:rounded-[3.5rem]'} flex flex-col p-0 gap-0 overflow-hidden border-0 ${colorOption.bg} shadow-2xl transition-all duration-500`}
      >
        <DialogDescription className="sr-only">Comprehensive intelligence node editor with neural sync capabilities.</DialogDescription>
        {/* Editor Header */}
        <DialogHeader className="p-3 sm:p-6 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 relative">
          <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
             <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl shrink-0" onClick={() => setIsMaximized(!isMaximized)}>
               {isMaximized ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 h-4" />}
             </Button>
             <div className="w-px h-4 sm:h-5 bg-slate-200 dark:bg-slate-800 mx-0.5 sm:mx-1 shrink-0 px-0" />
             <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                <div className="min-w-0">
                   <DialogTitle className="text-[10px] sm:text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase italic truncate">
                      {currentTitle}
                   </DialogTitle>
                   <div className="flex items-center gap-1">
                      <div className={`w-1 h-1 rounded-full shrink-0 ${isSaving ? 'bg-violet-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                      <span className="text-[6px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none truncate block">
                         {isSaving ? 'Syncing...' : ''}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Secondary Tools: Integrated Drive & GitHub */}
              <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 mr-0.5 sm:mr-1">
                  <Button variant="ghost" size="sm" onClick={() => { setOutsourceMode('drive'); setIsOutsourceOpen(true); }} className="h-8 sm:h-9 px-2 rounded-lg gap-2 font-black uppercase text-[8px] tracking-widest transition-all text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600">
                     <Cloud className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Drive</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setOutsourceMode('resource'); setIsOutsourceOpen(true); }} className="h-8 sm:h-9 px-2 rounded-lg gap-2 font-black uppercase text-[8px] tracking-widest transition-all text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-emerald-600">
                     <Github className="w-3.5 h-3.5" /> <span className="hidden xs:inline">GitHub</span>
                  </Button>
              </div>

              <div className="flex items-center gap-1">
                 <Popover>
                    <PopoverTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all" title="Neural Settings">
                          <Sparkles className={`w-4 h-4 ${isPremium ? 'text-amber-500' : ''}`} />
                       </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl space-y-4 z-[4000]">
                       <div className="space-y-2">
                          <div className="flex items-center justify-between">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Premium Layer</p>
                             <Switch checked={isPremium} onCheckedChange={(val) => { setIsPremium(val); onUpdate({ is_premium: val }); }} />
                          </div>
                       </div>
                       <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Workspace Controls</p>
                          <Button 
                            variant="outline" 
                            onClick={() => editor?.chain().focus().setBox().run()} 
                            className="w-full h-10 rounded-xl justify-start gap-3 border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-violet-600 hover:bg-violet-50"
                          >
                             <Plus className="w-4 h-4" /> Add Logic Frame
                          </Button>
                       </div>
                       <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Knowledge Domain</p>
                          <Select value={domain} onValueChange={(val) => { setDomain(val); onUpdate({ domain: val }); }}>
                             <SelectTrigger className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-900 border-0">
                                <SelectValue placeholder="Select Domain" />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl border-slate-100 z-[4001]">
                                <SelectItem value="default" className="text-[9px] font-black uppercase">Default Graph</SelectItem>
                                <SelectItem value="bali" className="text-[9px] font-black uppercase">Bali Intelligence</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </PopoverContent>
                 </Popover>

                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      <Palette className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3 rounded-2xl shadow-2xl border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-[4000]">
                    <div className="flex flex-wrap gap-1.5 w-32">
                      {NOTE_COLORS.map((c) => (
                        <button key={c.value} onClick={() => setColor(c.value)} className={`w-7 h-7 rounded-lg border-2 transition-all ${color === c.value ? 'border-violet-600 scale-110 shadow-lg' : 'border-transparent hover:scale-105'} ${c.bg} ${c.border}`} />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button variant="ghost" size="icon" className={`h-9 w-9 ${isCanvasOpen ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} rounded-lg transition-all`} onClick={() => setIsCanvasOpen(!isCanvasOpen)}>
                   <PenTool className="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-lg transition-all ${showLineage ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`} onClick={() => setShowLineage(!showLineage)} title="Neural Lineage">
                   <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                </Button>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

                {note?.is_shared && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-[7px] font-black uppercase tracking-widest animate-pulse">
                     <Globe className="w-2.5 h-2.5" />
                     <span className="hidden sm:inline">Online</span>
                  </div>
                )}

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl shrink-0 transition-all" 
                  onClick={handleEditorClose}
                >
                   <X className="w-4 h-4" />
                </Button>
             </div>
          </div>
        </DialogHeader>

         {/* Editor Body + Lineage Panel */}
         <div className="flex-1 flex overflow-hidden min-h-0 bg-white/30 dark:bg-slate-950/30">
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar relative cursor-text outline-none" onClick={() => editor?.commands.focus()}>
               {/* Padding Fix for High-Density Editor */}
               <div className={`min-h-[70vh] transition-all duration-500 ${!showToolbar ? 'pt-8 sm:pt-12' : 'pt-0'}`}>
                  <EditorContent editor={editor} className="min-h-full pb-12" />
               </div>
            </div>

            {showLineage && note && (
               <LineageHub 
                 note={note} 
                 user={user} 
                 show={showLineage}
                 onFork={onForkNote}
               />
            )}
         </div>

         {/* Consolidated Header/Footer Row (v14.0.0 Neural Direct) */}
         <div className="p-2 sm:p-4 bg-white/95 dark:bg-slate-950/95 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 backdrop-blur-3xl shrink-0">
            <div className="flex items-center gap-2 sm:gap-4">
               {/* Metadata Section (Pinned, Tag, Archive, Delete) */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-xl transition-all ${showMetadata ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Tags">
                        <Tag className="w-3.5 h-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2 rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl z-[4000]">
                       <div className="space-y-1">
                          <Button variant="ghost" onClick={() => setIsSharingModalOpen(true)} className="w-full h-10 justify-start gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
                             <Share2 className="w-4 h-4 text-violet-500" /> Manage Shared
                          </Button>
                          <Button variant="ghost" onClick={() => setIsSharingModalOpen(true)} className="w-full h-10 justify-start gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
                             <Globe className="w-4 h-4 text-emerald-500" /> Discovery
                          </Button>
                          <Button variant="ghost" onClick={() => setShowMetadata(true)} className="w-full h-10 justify-start gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
                             <Tag className="w-4 h-4 text-blue-500" /> Add New Tag
                          </Button>
                       </div>
                    </PopoverContent>
                  </Popover>
                  <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-xl transition-all ${note?.is_pinned ? 'text-amber-500 bg-amber-500/10' : 'text-slate-300 hover:text-amber-500'}`} onClick={() => onTogglePin?.(note!.id)} title="Pin Node">
                    <Pin className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" title={note?.is_archived ? "Restore" : "Archive"} className={`h-8 w-8 rounded-xl transition-all ${note?.is_archived ? 'bg-emerald-600/10 text-emerald-600' : 'text-slate-300 hover:text-emerald-500'}`} onClick={() => onUpdate({ is_archived: !note?.is_archived })}>
                     <Database className="w-3.5 h-3.5" />
                  </Button>
                  <VoiceRecorder compact onTranscriptionChunk={(text) => editor?.chain().focus().insertContent(text).run()} />
                  <AlertDialog>
                     <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all" title="Delete">
                         <Trash2 className="w-3.5 h-3.5" />
                       </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent className="rounded-[2.5rem] border-0 p-10 bg-white dark:bg-slate-900">
                        <AlertDialogHeader>
                           <AlertDialogTitle>Terminate Node?</AlertDialogTitle>
                           <AlertDialogDescription>Permanently purge this intelligence node. Action irreversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                       <AlertDialogFooter className="mt-8 gap-3 sm:justify-center">
                         <AlertDialogCancel className="h-12 px-8 rounded-2xl">Cancel</AlertDialogCancel>
                         <AlertDialogAction onClick={() => { onDelete?.(note!.id); onClose(); }} className="h-12 px-8 rounded-2xl bg-rose-600 text-white">Purge</AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>
               </div>
                <div className="hidden md:flex flex-col border-l border-slate-100 dark:border-white/5 pl-4">
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-1">Telemetry</span>
                   <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{user ? 'Sync Active' : 'Offline Node'}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-white/5 text-slate-500 font-black uppercase text-[9px] tracking-widest hover:text-violet-600 shadow-sm bg-white dark:bg-slate-900">
                     <ImageIcon className="w-3.5 h-3.5 mr-2" /> <span className="hidden sm:inline">Neural Asset</span>
                  </Button>
                 <Button variant="outline" size="sm" disabled={!note || isSaving || !editor?.getText().trim()} onClick={() => setIsSharingModalOpen(true)} className="h-9 px-3 sm:px-5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-black uppercase text-[9px] tracking-widest bg-white dark:bg-slate-900 shadow-sm">
                    <Share2 className={`w-3.5 h-3.5 mr-2 ${editor?.getText().trim() ? 'text-violet-600' : 'text-slate-300'}`} /> {note?.is_shared ? 'Manage' : 'Share'}
                 </Button>
                 <Button size="sm" onClick={handleEditorClose} className="h-9 px-6 sm:px-10 rounded-xl bg-violet-600 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-violet-500/20 hover:bg-violet-700 hover:scale-105 active:scale-95 transition-all">
                    Save
                 </Button>
              </div>
         </div>
      </DialogContent>

      <OutsourcePicker 
        isOpen={isOutsourceOpen} 
        onClose={() => setIsOutsourceOpen(false)} 
        onImport={handleImportOutsource} 
        mode={outsourceMode} 
      />

      <Dialog open={isSharingModalOpen} onOpenChange={setIsSharingModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3.5rem] p-10 border-0 shadow-2xl overflow-hidden">
           {/* Visual background accents */}
           <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-violet-600/5 blur-[100px] rounded-full pointer-events-none" />
           
           <DialogHeader className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-violet-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-violet-500/40 rotate-12">
                 <Share2 className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                 <DialogTitle className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                    Distribute Intelligence
                 </DialogTitle>
                 <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                    Manage discovery and network access
                 </DialogDescription>
              </div>
           </DialogHeader>

           <div className="relative z-10 mt-8 space-y-8">
               <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5">
                           <Globe className={`w-5 h-5 ${isDiscoverable ? 'text-emerald-500' : 'text-slate-300'}`} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Global Discovery</p>
                           <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest leading-none">
                              {isDiscoverable ? 'Active in Discovery Hub' : 'Private Intelligence'}
                           </p>
                        </div>
                     </div>
                     <Switch 
                        checked={isDiscoverable} 
                        onCheckedChange={(val) => {
                           setIsDiscoverable(val);
                        }} 
                     />
                  </div>

                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Knowledge Classification</p>
                     <Select value={category} onValueChange={(val: any) => { setCategory(val); }}>
                        <SelectTrigger className="h-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest shadow-sm">
                           <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100">
                           {["General", "Research", "Technical", "Creative", "Philosophy"].map(cat => (
                              <SelectItem key={cat} value={cat} className="text-[10px] font-black uppercase tracking-widest">{cat}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>

                  <Button 
                    onClick={() => {
                        onUpdate({ is_discoverable: isDiscoverable, category });
                        toast.success('Registry Updated', { 
                          description: isDiscoverable ? 'Intelligence synchronized to Discovery Hub' : 'Intelligence removed from global registry' 
                        });
                    }}
                    className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[8px] tracking-widest"
                  >
                    Commit Registry Changes
                  </Button>
               </div>

               {note?.is_shared ? (
                  <div className="space-y-4">
                     <div className="relative">
                        <Input 
                           readOnly 
                           value={shareUrl} 
                           className="h-14 pl-5 pr-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border-0 text-[10px] font-mono text-slate-500 focus-visible:ring-0" 
                        />
                        <Button 
                           onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              setHasCopied(true);
                              toast.success('Neural Link Copied');
                              setTimeout(() => setHasCopied(false), 2000);
                           }}
                           className={`absolute right-1 top-1 h-12 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${hasCopied ? 'bg-emerald-500' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}
                        >
                           {hasCopied ? <Check className="w-4 h-4" /> : 'Copy Link'}
                        </Button>
                     </div>
                     <Button 
                        variant="ghost"
                        onClick={() => onUnshareNote?.(note.id)}
                        className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[10px] font-black uppercase tracking-widest h-12 rounded-2xl transition-all"
                     >
                        Terminate Public Link
                     </Button>
                  </div>
               ) : (
                  <Button 
                     onClick={async () => {
                        setIsProcessingShare(true);
                        const res = await onShareNote?.(note!.id, 'public', 'read', isDiscoverable, category);
                        setIsProcessingShare(false);
                        if (res?.success) toast.success('Neural Node Shared');
                     }}
                     disabled={isProcessingShare}
                     className="w-full h-16 rounded-[2rem] bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-violet-500/20 active:scale-95 transition-all"
                  >
                     {isProcessingShare ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Initialize Shared Intelligence'}
                  </Button>
               )}
           </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
