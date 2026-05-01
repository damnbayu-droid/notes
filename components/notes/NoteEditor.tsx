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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
    Palette, 
    Tag, 
    Calendar,
    PenTool,
    Maximize2,
    Minimize2,
    Mic,
    RefreshCw,
    Plus,
    Lock,
    ShieldCheck,
    FileImage as ImageIcon,
} from 'lucide-react'

const Github = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
)
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
import { downloadMarkdown } from '@/lib/googleDrive'
import { detectOffloading, processOffloading } from '@/lib/offloading'

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
  
  // Ingestion Shield States (v15.0.x)
  const [isIngestionOpen, setIsIngestionOpen] = useState(false)
  const [pastedContent, setPastedContent] = useState('')
  
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
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain') || ''
        if (text.length > 1500) {
          setPastedContent(text)
          setIsIngestionOpen(true)
          return true // Intercept: Neural Ingestion Shield active
        }
        return false
      },
      attributes: {
        'data-neural-editor': 'v15.0',
        'data-node-type': 'intelligence',
        class: 'prose prose-sm sm:prose-base focus:outline-none w-full max-w-none text-slate-900 dark:text-slate-100 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:leading-relaxed',
      },
    },
  })

  // AI Offloading Integration (v16.0.0)
  const performOffloadCheck = async (contentHtml: string, contentText: string): Promise<{ html: string; offloaded: boolean }> => {
    if (!user || !note || !detectOffloading(contentText)) {
      return { html: contentHtml, offloaded: false }
    }

    const offloadToast = toast.loading('Massive Intelligence Detected. Offloading...')
    const result = await processOffloading(note.id, user.id, contentText, note.title || 'Untitled')
    
    if (result.success && result.replacement_content) {
      toast.success('Neural Offloading Successful', { 
        id: offloadToast,
        description: 'Large payload moved to persistent file for SSR stability.' 
      })
      
      // Update editor immediately to show the offloaded state
      if (editor) {
        editor.commands.setContent(result.replacement_content)
      }
      
      return { html: result.replacement_content, offloaded: true }
    } else {
      toast.error('Offloading Failed', { id: offloadToast, description: result.error })
      return { html: contentHtml, offloaded: false }
    }
  }

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
      
      // Execute Offloading Pipeline (v16.0.0)
      performOffloadCheck(currentHtml, currentText).then(({ html: finalHtml }) => {
        const title = currentText.split('\n')[0]?.substring(0, 100) || 'Untitled Note'
        onUpdate({ 
          title, 
          content: finalHtml, 
          content_original: currentHtml, 
          color, 
          tags, 
          is_discoverable: isDiscoverable, 
          category,
          reminder_date: reminderDate || undefined,
          is_archived: note.is_archived
        })
        
        lastSavedState.current = {
          html: finalHtml,
          color,
          tags: [...tags],
          reminderDate: reminderDate || '',
          isDiscoverable,
          category,
          is_archived: Boolean(note.is_archived)
        }
        setTimeout(() => setIsSaving(false), 500)
      })
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

      // Execute Offloading Pipeline (v16.0.0)
      performOffloadCheck(debouncedHtml, debouncedText).then(({ html: finalHtml }) => {
        const title = debouncedText.split('\n')[0]?.substring(0, 100) || 'Untitled Note'
        onUpdate({ 
          title, 
          content: finalHtml, 
          color, 
          tags, 
          is_discoverable: isDiscoverable, 
          category,
          reminder_date: reminderDate || undefined,
          is_archived: note.is_archived
        })
        
        lastSavedState.current = {
          html: finalHtml,
          color,
          tags: [...tags],
          reminderDate: reminderDate || '',
          isDiscoverable,
          category,
          is_archived: Boolean(note.is_archived)
        }
        setTimeout(() => setIsSaving(false), 800)
      })
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

  const handleIngest = (mode: 'raw' | 'code' | 'smart') => {
    if (!editor || !pastedContent) return
    
    let content = pastedContent
    if (mode === 'code') {
      content = `<pre class="bg-slate-900 text-slate-100 p-6 rounded-2xl overflow-auto font-mono text-xs border border-slate-800"><code>${pastedContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
    } else if (mode === 'smart') {
      // Smart: Let Tiptap handle standard HTML if present, otherwise paragraph wrap
      content = pastedContent.includes('<') ? pastedContent : pastedContent.split('\n').filter(l => l.trim()).map(line => `<p>${line}</p>`).join('')
    } else {
      // Raw: Basic line breaks
      content = `<p>${pastedContent.replace(/\n/g, '<br>')}</p>`
    }
    
    editor.chain().focus().insertContent(content).run()
    setIsIngestionOpen(false)
    setPastedContent('')
    toast.success('Intelligence Ingested', { description: `Successfully processed ${mode} payload.` })
  }

  const handleAddNodeLink = () => {
    const url = window.prompt('Enter Node URL (.md or shared link):')
    if (!url || !editor) return
    
    const isInternal = url.includes('/s/')
    const fileName = url.split('/').pop() || 'Unnamed Node'
    
    const nodeCard = `
      <div class="my-6 p-6 rounded-[2rem] border border-violet-500/20 bg-violet-600/5 backdrop-blur-xl group cursor-pointer transition-all hover:border-violet-500" onclick="window.open('${url}', '_blank')">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
             </div>
             <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">${isInternal ? 'Internal Intelligence' : 'External Resource'}</p>
                <p class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">${fileName}</p>
             </div>
          </div>
          <div class="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="rotate-45"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">${url}</p>
      </div>
    `
    editor.chain().focus().insertContent(nodeCard).run()
  }

  // 15.0.9: Neural Asset Ingress Hardening
  useEffect(() => {
    const handleGlobalUpload = (e: any) => {
      if (!isOpen || !editor) return
      const files = e.detail?.files
      if (files && files[0]) {
        handleFileChange({ target: { files: files } } as any)
      }
    }
    window.addEventListener('neural-asset-upload', handleGlobalUpload)
    return () => window.removeEventListener('neural-asset-upload', handleGlobalUpload)
  }, [isOpen, editor])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;

    if (!user) {
      toast.error('Authentication Required', { description: 'Please sign in to upload neural assets.' })
      return;
    }

    if (!editor) {
      toast.error('Editor Not Ready', { description: 'Neural interface initializing...' })
      return;
    }

    const processingToast = toast.loading('Synthesizing Neural Media...')
    try {
        // Special case: If it's already a small WebP, we can skip processing or handle specifically
        let blobToUpload: Blob;
        let fileName = file.name;

        if (file.type === 'application/pdf') {
          blobToUpload = file;
          toast.info('PDF detected. Ingesting as document node...', { id: processingToast });
        } else {
          const { blob } = await processImageForNeural(file);
          blobToUpload = blob;
          // Ensure extension is webp since processor converts it
          if (!fileName.toLowerCase().endsWith('.webp')) {
            fileName = fileName.split('.')[0] + '.webp';
          }
        }

        const rawAlt = window.prompt("Description (Alt Tag):", "Neural snapshot")
        const altDescription = rawAlt?.trim() || "Visualized intelligence"
        const { url, error } = await uploadNoteAsset(user.id, blobToUpload, fileName)
        
        if (error) throw new Error(error)
        
        if (url) {
            if (file.type === 'application/pdf') {
              editor.chain().focus().insertContent(`<p><a href="${url}" target="_blank" class="text-violet-600 font-bold underline">Attachment: ${file.name}</a></p>`).run()
            } else {
              editor.chain().focus().setImage({ src: url, alt: altDescription }).run()
            }
            toast.success('Neural Media Ingress Successful', { id: processingToast })
        } else {
            throw new Error('Storage node did not return a valid URL.')
        }
    } catch (err: any) {
        toast.error('Neural Machine Failure', { description: err.message, id: processingToast })
    }
  }

  const handleVoiceComplete = async (blob: Blob) => {
    if (editor && user && note) {
        const processingToast = toast.loading('Finalizing Voice Intelligence...')
        try {
            const fileName = `voice_${note.id}_${Date.now()}.webm`
            const { url, error } = await uploadNoteAsset(user.id, blob, fileName)
            if (error) throw new Error(error)
            if (url) {
                const audioPlayerHtml = `
                    <div class="my-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-white/5 flex flex-col gap-3 shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                            </div>
                            <p class="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Audio Intelligence Ingested</p>
                        </div>
                        <audio src="${url}" controls class="w-full h-10 rounded-xl" />
                    </div>
                `
                editor.chain().focus().insertContent(audioPlayerHtml).run()
                toast.success('Voice Uplink Complete', { id: processingToast })
            }
        } catch (err: any) {
            toast.error('Voice Sync Failed', { description: err.message, id: processingToast })
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
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,image/webp,.webp"
          onChange={handleFileChange}
        />
        {/* Editor Header */}
        <DialogHeader className="p-3 sm:p-6 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 relative">
          <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl shrink-0" onClick={() => setIsMaximized(!isMaximized)}>
                   {isMaximized ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 h-4" />}
                 </Button>
               </TooltipTrigger>
               <TooltipContent side="bottom">
                  <p>{isMaximized ? 'Minimize Node' : 'Maximize Workspace'}</p>
               </TooltipContent>
             </Tooltip>
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
                  
                  {/* Neural Actions Trigger (v15.0.x) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-violet-600 transition-all">
                         <Plus className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-2xl border-slate-100 dark:border-white/5 z-[5000]">
                      <DropdownMenuItem onClick={() => editor?.commands.setBox()} className="rounded-xl text-[9px] font-black uppercase gap-3">
                        <Plus className="w-3.5 h-3.5" /> Add Logic Frame
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAddNodeLink} className="rounded-xl text-[9px] font-black uppercase gap-3">
                        <Share2 className="w-3.5 h-3.5" /> Insert Node Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsOutsourceOpen(true)} className="rounded-xl text-[9px] font-black uppercase gap-3">
                        <Database className="w-3.5 h-3.5" /> Remote Resource
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Workspace Management</p>
                          <p className="text-[9px] text-slate-400">Controls moved to header for rapid access.</p>
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
               {/* Main Editor Surface */}
              <div 
                className="flex-1 relative"
                data-neural-editor="v15.0.x"
                data-neural-node-id={note?.id}
              >
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-xl transition-all ${note?.is_archived ? 'bg-emerald-600/10 text-emerald-600' : 'text-slate-300 hover:text-emerald-500'}`} onClick={() => onUpdate({ is_archived: !note?.is_archived })}>
                         <Database className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                       <p>{note?.is_archived ? 'Restore from Archive' : 'Archive Intelligence'}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <VoiceRecorder 
                    compact 
                    noteId={note?.id}
                    userTier={user?.subscription_tier}
                    onRecordingComplete={handleVoiceComplete}
                    onTranscriptionChunk={(text) => editor?.chain().focus().insertContent(text).run()} 
                  />
                  
                  <AlertDialog>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all">
                               <Trash2 className="w-3.5 h-3.5" />
                             </Button>
                           </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                           <p>Purge Intelligence</p>
                        </TooltipContent>
                     </Tooltip>
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
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => downloadMarkdown(note?.title || 'Untitled', editorHtml)} className="h-9 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-white/5 text-slate-500 font-black uppercase text-[9px] tracking-widest hover:text-violet-600 shadow-sm bg-white dark:bg-slate-900">
                         <Cloud className="w-3.5 h-3.5 mr-2 text-violet-500" /> <span className="hidden sm:inline">Export for AI</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                       <p className="font-bold mb-1">High-Fidelity AI Bridge</p>
                       <p className="text-[10px] leading-tight">Generates a machine-readable Markdown snapshot optimized for LLM ingestion and knowledge graph synthesis.</p>
                    </TooltipContent>
                  </Tooltip>

                  {(typeof window !== 'undefined' && localStorage.getItem('editor-image-enabled') !== 'false') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-white/5 text-slate-500 font-black uppercase text-[9px] tracking-widest hover:text-violet-600 shadow-sm bg-white dark:bg-slate-900">
                          <ImageIcon className="w-3.5 h-3.5 mr-2" /> <span className="hidden sm:inline">Neural Asset</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                         <p>Inject Neural Media</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!note || isSaving || !editor?.getText().trim()} onClick={() => setIsSharingModalOpen(true)} className="h-9 px-3 sm:px-5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-black uppercase text-[9px] tracking-widest bg-white dark:bg-slate-900 shadow-sm">
                           <Share2 className={`w-3.5 h-3.5 mr-2 ${editor?.getText().trim() ? 'text-violet-600' : 'text-slate-300'}`} /> {note?.is_shared ? 'Manage' : 'Share'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                         <p>Universal Access Management</p>
                      </TooltipContent>
                    </Tooltip>

                    {note?.is_shared && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm('Are you sure you want to take this intelligence node offline?')) {
                              onUnshareNote?.(note.id);
                              toast.success('Intelligence taken offline');
                            }
                          }} className="h-9 px-3 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-black uppercase text-[9px] tracking-widest transition-all">
                             <Lock className="w-3.5 h-3.5 mr-2" /> Turn Offline
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                           <p>Terminate Public Link</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" onClick={handleEditorClose} className="h-9 px-6 sm:px-10 rounded-xl bg-violet-600 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-violet-500/20 hover:bg-violet-700 hover:scale-105 active:scale-95 transition-all">
                         Save
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                       <p>Force Sync to Cloud</p>
                    </TooltipContent>
                 </Tooltip>
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

      {/* Neural Ingestion Shield (v15.0.x) */}
      <Dialog open={isIngestionOpen} onOpenChange={setIsIngestionOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3.5rem] p-10 border-0 shadow-2xl overflow-hidden">
          <DialogDescription className="sr-only">Neural Ingestion Shield protocol for handling large text payloads.</DialogDescription>
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-violet-600/5 blur-[100px] rounded-full pointer-events-none" />
          
          <DialogHeader className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12">
              <ShieldCheck className="w-10 h-10 text-white dark:text-slate-900" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                Ingestion Shield
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                Massive data payload detected ({pastedContent.length} chars)
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="relative z-10 mt-8 space-y-4">
             <p className="text-[10px] font-bold text-center text-slate-500 uppercase tracking-widest px-8">
               Large text blocks can impact knowledge graph stability. Please select an ingestion protocol to maintain intelligence integrity.
             </p>
             
             <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleIngest('smart')}
                  className="h-16 rounded-[1.5rem] justify-start px-6 gap-4 border-slate-100 dark:border-white/5 hover:border-violet-500 group transition-all"
                >
                   <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors">
                      <Sparkles className="w-4 h-4" />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white">Smart Ingress</p>
                      <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Auto-format as Markdown/HTML</p>
                   </div>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => handleIngest('code')}
                  className="h-16 rounded-[1.5rem] justify-start px-6 gap-4 border-slate-100 dark:border-white/5 hover:border-emerald-500 group transition-all"
                >
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <PenTool className="w-4 h-4" />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white">Technical Ingress</p>
                      <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Wrap in optimized Code Block</p>
                   </div>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => handleIngest('raw')}
                  className="h-16 rounded-[1.5rem] justify-start px-6 gap-4 border-slate-100 dark:border-white/5 hover:border-slate-900 group transition-all"
                >
                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Database className="w-4 h-4" />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white">Raw Ingress</p>
                      <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Plain text with preserved breaks</p>
                   </div>
                </Button>
             </div>

             <Button 
                variant="ghost" 
                onClick={() => { setIsIngestionOpen(false); setPastedContent(''); }}
                className="w-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500"
             >
               Abort Ingestion
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
