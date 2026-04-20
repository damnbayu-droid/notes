'use client'

import { useState, useMemo, memo } from 'react';
import type { Note, NoteColor } from '@/types';
import { NOTE_COLORS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pin,
  PinOff,
  Archive,
  MoreVertical,
  Copy,
  Trash2,
  Tag,
  Globe,
  Sparkles,
  Lock,
  Share2,
  MessageCircle,
  Check,
  Zap
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from 'sonner';
import { buildShareUrl } from '@/lib/shareUtils';

interface NoteCardProps {
  note: Note;
  viewMode?: 'grid' | 'list';
  onClick: (note: Note) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onUpdateColor?: (id: string, color: NoteColor) => void;
}

export const NoteCard = memo(function NoteCard({
  note,
  viewMode = 'grid',
  onClick,
  onTogglePin,
  onDelete,
  onToggleArchive,
  onDuplicate,
  onUpdateColor,
}: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const colorOption = useMemo(() => 
    NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0],
    [note.color]
  );

  const truncatedContent = useMemo(() => {
    const stripHtml = (html: string) => {
      if (!html) return "";
      return html
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const plainText = stripHtml(note.content);
    const maxLength = 120;
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  }, [note.content]);

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-500 cursor-pointer
        ${colorOption.bg} ${colorOption.border} border
        ${viewMode === 'grid' ? 'h-40 sm:h-56 flex flex-col' : 'flex flex-row items-stretch gap-4 min-h-[100px] h-auto'}
        ${isHovered ? 'shadow-2xl scale-[1.01] border-violet-400 dark:border-violet-600' : 'shadow-sm'}
        rounded-2xl sm:rounded-[2rem]
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(note)}
    >
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/5 to-transparent blur-2xl pointer-events-none" />
      
      {/* Indicators Layer */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {note.is_pinned && (
           <div className="p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-sm border border-violet-100 dark:border-violet-900">
             <Pin className="w-3 h-3 text-violet-600 fill-violet-600" />
           </div>
        )}
        {note.is_shared && (
           <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
             <Globe className="w-2 h-2" />
             <span>Shared</span>
           </div>
        )}
      </div>

        <div className={`p-3 sm:p-6 flex flex-col h-full ${viewMode === 'list' ? 'flex-1 justify-center' : ''}`}>
        {/* Timestamp & Metadata Hub (v11.0.0) */}
        <div className="flex items-center gap-1.5 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[7.5px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
               {new Date(note.updated_at).toLocaleDateString()}
            </span>
            
            <div className="flex items-center gap-1.5 ml-auto">
              {note.is_premium && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                   <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                   <span className="text-[6.5px] font-black uppercase tracking-widest text-amber-500">Premium</span>
                </div>
              )}
              {note.domain && note.domain !== 'default' && (
                <div className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-md">
                   <span className="text-[6.5px] font-black uppercase tracking-widest text-violet-500">{note.domain}</span>
                </div>
              )}
            </div>
        </div>

        {/* Title — Optimized for High Visibility (Photo 1 Fix) */}
        <h3 className={`font-black text-slate-900 dark:text-white mb-1.5 pr-16 leading-tight uppercase tracking-tighter italic break-words overflow-hidden ${viewMode === 'grid' ? 'text-[11px] sm:text-sm' : 'text-sm sm:text-lg'}`}>
          {note.title || 'Untitled Node'}
        </h3>
        
        {/* Content Preview — Enforced Contrast */}
        <p className={`text-slate-600 dark:text-slate-400 leading-relaxed font-medium break-words overflow-hidden ${viewMode === 'grid' ? 'text-[9px] sm:text-[11px] line-clamp-2 sm:line-clamp-3' : 'text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-2'}`}>
          {truncatedContent || 'No intelligence captured yet...'}
        </p>

        {/* Tags Metadata */}
        <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
           {note.tags.length > 0 ? (
              note.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[7px] sm:text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                >
                  #{tag}
                </span>
              ))
           ) : (
              <span className="text-[8px] font-bold text-slate-400/50 uppercase tracking-widest italic">#</span>
           )}
           {note.tags.length > 3 && (
              <span className="text-[9px] font-black text-slate-400 uppercase">+{note.tags.length - 3}</span>
           )}
        </div>

        {/* Dynamic Action Surface (v12.0.0 Interaction Logic) */}
        <div 
          className={`absolute bottom-2 right-2 sm:bottom-6 sm:right-6 flex items-center gap-1 sm:gap-2 transition-all duration-500 
            ${isHovered ? 'sm:translate-y-0 sm:opacity-100' : 'sm:translate-y-4 sm:opacity-0'} 
            opacity-100 translate-y-0`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 sm:h-10 sm:w-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border-slate-200 dark:border-slate-800 text-slate-400 hover:text-violet-600 hover:border-violet-200"
            onClick={() => onTogglePin(note.id)}
          >
            {note.is_pinned ? <PinOff className="w-3 h-3 sm:w-4 h-4" /> : <Pin className="w-3 h-3 sm:w-4 h-4" />}
          </Button>

          {/* Social Share Trigger */}
          <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-7 w-7 sm:h-10 sm:w-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border-slate-200 dark:border-slate-800 transition-all ${note.is_shared ? 'text-emerald-500 border-emerald-200' : 'text-slate-400 hover:text-emerald-600'}`}
                title="Share Intelligence"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!note.is_shared) {
                    toast.info("Enable Sharing in Editor", { description: "Discovery and link states are managed within the intelligence node editor." });
                    return;
                  }
                  setIsShareModalOpen(true);
                }}
              >
                <Share2 className="w-3 h-3 sm:w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-0">
               <DialogDescription className="sr-only">Social distribution gateway for unique intelligence nodes.</DialogDescription>
               <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic text-center">Distribute Intelligence</DialogTitle>
               </DialogHeader>
               <div className="grid grid-cols-3 gap-4 py-6">
                  <Button 
                    variant="outline" 
                    className="flex flex-col gap-2 h-24 rounded-3xl border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 group"
                    onClick={() => {
                        const url = buildShareUrl(note.share_slug!);
                        window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this intelligence node: ${note.title}\n${url}`)}`, '_blank');
                    }}
                  >
                    <MessageCircle className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">WhatsApp</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col gap-2 h-24 rounded-3xl border-slate-100 hover:border-blue-200 hover:bg-blue-50 group"
                    onClick={() => {
                        const url = buildShareUrl(note.share_slug!);
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(note.title!)}&url=${encodeURIComponent(url)}`, '_blank');
                    }}
                  >
                    <MessageCircle className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">X / Twitter</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`flex flex-col gap-2 h-24 rounded-3xl border-slate-100 transition-all group ${hasCopied ? 'bg-emerald-500 border-emerald-500' : 'hover:border-violet-200 hover:bg-violet-50'}`}
                    onClick={() => {
                        const url = buildShareUrl(note.share_slug!);
                        navigator.clipboard.writeText(url);
                        setHasCopied(true);
                        toast.success("Link Copied", { description: "Ready for manual distribution." });
                        setTimeout(() => setHasCopied(false), 2000);
                    }}
                  >
                    {hasCopied ? <Check className="w-6 h-6 text-white" /> : <Copy className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />}
                    <span className={`text-[9px] font-black uppercase tracking-widest ${hasCopied ? 'text-white' : 'text-slate-500'}`}>{hasCopied ? 'Copied' : 'Copy Link'}</span>
                  </Button>
               </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-10 sm:w-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border-slate-200 dark:border-slate-800 text-slate-400 hover:text-violet-600 hover:border-violet-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3 sm:w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-[1.5rem] border-slate-100 shadow-2xl">
              {onToggleArchive && (
                 <DropdownMenuItem onClick={() => onToggleArchive(note.id)} className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest">
                   <Archive className="w-4 h-4 mr-3 text-slate-400" />
                   Archive Node
                 </DropdownMenuItem>
              )}
               {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(note.id)} className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest">
                    <Copy className="w-4 h-4 mr-3 text-slate-400" />
                    Duplicate Node
                  </DropdownMenuItem>
               )}
               
               <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />
               
               <div className="px-3 py-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Neural Color</p>
                  <div className="flex flex-wrap gap-1">
                     {NOTE_COLORS.map((c) => (
                        <button 
                           key={c.value} 
                           onClick={() => onUpdateColor?.(note.id, c.value)}
                           className={`w-5 h-5 rounded-md border transition-all ${note.color === c.value ? 'ring-2 ring-violet-500 scale-110' : 'opacity-60 hover:opacity-100'} ${c.bg} ${c.border}`}
                           title={c.label}
                        />
                     ))}
                  </div>
               </div>

               <DropdownMenuSeparator className="my-2 bg-slate-100" />
              
              {/* Premium AlertDialog for Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete Note
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem] border-0 p-10 bg-white dark:bg-slate-900">
                  <DialogDescription className="sr-only">Deletion confirmation for intelligence node.</DialogDescription>
                  <AlertDialogHeader className="space-y-4">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mx-auto">
                        <Trash2 className="w-8 h-8 text-rose-600" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-black text-center uppercase tracking-tighter italic">Terminate Node?</AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-6">
                      You are about to permanently purge this intelligence node from the system. This action cannot be reversed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-8 gap-3 sm:justify-center">
                    <AlertDialogCancel className="h-12 px-8 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(note.id)}
                      className="h-12 px-8 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-500/20"
                    >
                      Purge Note
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Accent hover line */}
        <div className={`absolute bottom-0 left-6 right-6 h-1 bg-violet-600 rounded-full transition-all duration-700 ${isHovered ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} />
      </div>
    </Card>
  );
});
