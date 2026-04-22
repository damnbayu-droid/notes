'use client'

import { Button } from '@/components/ui/button';
import { 
  Type, 
  Eraser, 
  Highlighter, 
  Pencil, 
  Image as ImageIcon, 
  Circle, 
  X, 
  Check, 
  Signature, 
  Link, 
  MessageSquare,
  Undo2,
  Redo2,
  MousePointer2,
  FileText,
  Search,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  MoreHorizontal,
  LayoutGrid,
  Settings2,
  Maximize2,
  Layers,
  Clock,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type PDFTool = 'select' | 'text' | 'edit-text' | 'eraser' | 'highlight' | 'pencil' | 'image' | 'ellipse' | 'cross' | 'check' | 'sign' | 'annotations' | 'link' | 'layout' | 'pages';

interface PDFToolbarProps {
  activeTool: PDFTool;
  onToolSelect: (tool: PDFTool) => void;
  onDone: () => void;
  onDownload: () => void;
  onShare: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImageRequest: () => void;
  onSignatureRequest: () => void;
  onPageLayoutRequest: () => void;
  onManagePagesRequest: () => void;
  onLogsRequest: () => void;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
  signColor: 'colored' | 'black';
  onSignColorSelect: (color: 'colored' | 'black') => void;
}

export function PDFToolbar({ 
  activeTool, 
  onToolSelect, 
  onDone, 
  onDownload,
  onShare,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onImageRequest,
  onSignatureRequest,
  onPageLayoutRequest,
  onManagePagesRequest,
  onLogsRequest,
  onSidebarToggle,
  isSidebarOpen,
  signColor,
  onSignColorSelect
}: PDFToolbarProps) {
    
    const tools: { id: PDFTool; icon: any; label: string; group?: string }[] = [
      { id: 'select', icon: MousePointer2, label: 'Move', group: 'nav' },
      { id: 'text', icon: Type, label: 'Add Text', group: 'edit' },
      { id: 'edit-text', icon: FileText, label: 'Edit Text', group: 'edit' },
      { id: 'eraser', icon: Eraser, label: 'Eraser', group: 'edit' },
      { id: 'highlight', icon: Highlighter, label: 'Highlight', group: 'draw' },
      { id: 'pencil', icon: Pencil, label: 'Pencil', group: 'draw' },
      { id: 'image', icon: ImageIcon, label: 'Image', group: 'asset' },
      { id: 'ellipse', icon: Circle, label: 'Ellipse', group: 'shape' },
      { id: 'cross', icon: X, label: 'Cross', group: 'mark' },
      { id: 'check', icon: Check, label: 'Check', group: 'mark' },
      { id: 'sign', icon: Signature, label: 'Sign', group: 'auth' },
      { id: 'layout', icon: Maximize2, label: 'Page Layout', group: 'manage' },
      { id: 'pages', icon: Layers, label: 'Manage Pages', group: 'manage' },
      { id: 'annotations', icon: MessageSquare, label: 'Annotations', group: 'comm' },
      { id: 'link', icon: Link, label: 'Links', group: 'comm' },
    ];
  
    return (
      <TooltipProvider>
        <div className="w-full flex flex-col bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 shadow-sm sticky top-0 z-50">
          {/* Top Header Layer */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-slate-50 dark:border-white/5">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span className="text-[11px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">PT INDONESIAN VISAS</span>
                  <Settings2 className="w-3 h-3 text-slate-400" />
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <Button onClick={onLogsRequest} variant="ghost" className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 gap-2">
                  <Clock className="w-4 h-4" /> Logs
               </Button>
               <div className="flex items-center gap-1 border-r border-slate-100 dark:border-white/5 pr-3 mr-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg"><Search className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={onPrint}><Printer className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={onDownload}><Download className="w-4 h-4" /></Button>
               </div>
               <Button variant="outline" onClick={onShare} className="h-9 px-4 rounded-lg text-[11px] font-bold gap-2 border-slate-200">
                  <Share2 className="w-4 h-4" /> Share
               </Button>
               <Button onClick={onDone} className="h-9 px-6 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold gap-2 shadow-lg shadow-rose-500/20">
                  <CheckCircle2 className="w-4 h-4" /> Done
               </Button>
            </div>
          </div>
  
          {/* Secondary Tool Layer */}
          <div className="h-16 px-6 flex items-center justify-between overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6">
              {/* Nav Group */}
              <div className="flex items-center gap-2 pr-6 border-r border-slate-100 dark:border-white/5">
                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-11 w-11 rounded-xl transition-all ${isSidebarOpen ? 'bg-rose-50 text-rose-600 shadow-inner' : 'text-slate-500'}`}
                        onClick={onSidebarToggle}
                      >
                        <LayoutGrid className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle Sidebar</TooltipContent>
                 </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-11 w-11 rounded-xl ${activeTool === 'select' ? 'bg-slate-100 text-rose-600' : 'text-slate-500'}`}
                        onClick={() => onToolSelect('select')}
                      >
                        <MousePointer2 className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Select Tool</TooltipContent>
                 </Tooltip>
                 <div className="flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="icon" disabled={!canUndo} onClick={onUndo} className="h-9 w-9 rounded-lg text-slate-400"><Undo2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={!canRedo} onClick={onRedo} className="h-9 w-9 rounded-lg text-slate-400"><Redo2 className="w-4 h-4" /></Button>
                 </div>
              </div>
  
              {/* Editing Tools */}
              <div className="flex items-center gap-2 pr-6 border-r border-slate-100 dark:border-white/5">
                 {tools.filter(t => t.group === 'edit' || t.group === 'draw').map(tool => (
                   <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className={`h-12 flex flex-col gap-1 rounded-xl px-3 transition-all ${activeTool === tool.id ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}
                          onClick={() => onToolSelect(tool.id)}
                        >
                          <tool.icon className="w-5 h-5" />
                          <span className="text-[9px] font-bold uppercase tracking-tighter">{tool.label.split(' ')[0]}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tool.label}</TooltipContent>
                   </Tooltip>
                 ))}
              </div>
  
              {/* Form & Shape Tools */}
              <div className="flex items-center gap-2">
                 {tools.filter(t => ['asset', 'shape', 'mark', 'auth', 'manage', 'comm'].includes(t.group || '')).map(tool => (
                   <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className={`h-12 flex flex-col gap-1 rounded-xl px-3 transition-all ${activeTool === tool.id ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}
                          onClick={() => {
                            if (tool.id === 'image') onImageRequest();
                            else if (tool.id === 'sign') onSignatureRequest();
                            else if (tool.id === 'layout') onPageLayoutRequest();
                            else if (tool.id === 'pages') onManagePagesRequest();
                            else onToolSelect(tool.id);
                          }}
                        >
                          <tool.icon className={`w-5 h-5 ${tool.id === 'check' || tool.id === 'cross' ? (signColor === 'black' ? 'text-black' : (tool.id === 'check' ? 'text-emerald-500' : 'text-rose-500')) : ''}`} />
                          <span className="text-[9px] font-bold uppercase tracking-tighter">{tool.label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tool.label}</TooltipContent>
                   </Tooltip>
                 ))}
                 
                 {/* Color Toggle for Marks */}
                 {(activeTool === 'check' || activeTool === 'cross') && (
                   <div className="flex items-center gap-1 ml-2 p-1 bg-slate-100 rounded-lg">
                      <Button 
                        variant={signColor === 'colored' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        onClick={() => onSignColorSelect('colored')}
                        className="h-8 w-8 rounded-md"
                      >
                         <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-rose-400" />
                      </Button>
                      <Button 
                        variant={signColor === 'black' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        onClick={() => onSignColorSelect('black')}
                        className="h-8 w-8 rounded-md"
                      >
                         <div className="w-4 h-4 rounded-full bg-black" />
                      </Button>
                   </div>
                 )}

                 <Button variant="ghost" className="h-12 flex flex-col gap-1 rounded-xl px-3 text-slate-500">
                    <MoreHorizontal className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase tracking-tighter">More</span>
                 </Button>
              </div>
            </div>
          
        </div>
      </div>
    </TooltipProvider>
  );
}
