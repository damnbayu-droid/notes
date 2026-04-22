'use client'

import { PDFPageInfo } from '@/lib/pdf/engine';
import { cn } from '@/lib/utils';

interface PDFSidebarProps {
  pages: PDFPageInfo[];
  currentPage: number;
  onPageSelect: (page: number) => void;
  isOpen: boolean;
}

export function PDFSidebar({ pages, currentPage, onPageSelect, isOpen }: PDFSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-64 border-r border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col h-full animate-in slide-in-from-left duration-300 overflow-hidden">
      <div className="h-14 px-6 flex-none flex items-center border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Thumbnails ({pages.length})</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {pages.map((page) => (
          <div 
            key={page.pageNumber}
            className="flex flex-col items-center gap-2 group cursor-pointer"
            onClick={() => onPageSelect(page.pageNumber)}
          >
            <div className={cn(
              "relative rounded-xl overflow-hidden border-2 transition-all duration-300 shadow-sm w-full bg-white dark:bg-slate-900 aspect-[1/1.4]",
              currentPage === page.pageNumber 
                ? "border-rose-500 ring-4 ring-rose-500/10 scale-[1.02]" 
                : "border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-700"
            )}>
              <img 
                src={page.thumbnailUrl} 
                alt={`Page ${page.pageNumber}`}
                className="w-full h-full object-contain"
              />
              <div className={cn(
                "absolute inset-0 bg-black/0 transition-colors",
                currentPage === page.pageNumber ? "bg-black/0" : "group-hover:bg-black/5"
              )} />
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black transition-all",
              currentPage === page.pageNumber 
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            )}>
              {page.pageNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
