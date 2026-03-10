import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/useTheme';
import { AdvancedVoiceDialog } from '@/components/voice/AdvancedVoiceDialog';
import {
  LayoutGrid,
  Archive,
  Plus,
  X,
  Scan,
  Calendar,
  Moon,
  Sun,
  Book,
  Mic,
  Pin,
  Settings,
  Cloud,
  LogOut,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewType = 'notes' | 'archive' | 'trash' | 'scanner' | 'settings' | 'schedule' | 'books' | 'admin';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onCreateNote: () => void;
  isOpen: boolean;
  onClose: () => void;
  folders: string[];
  activeFolder: string;
  onSelectFolder: (folder: string) => void;
  onOpenSettings: (tab?: string) => void;
  onAddFolder: () => void;
  renameFolder: (oldName: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  deleteFolder: (folderName: string) => Promise<{ success: boolean; error?: string }>;
  togglePinFolder: (folderName: string) => void;
  pinnedFolders: string[];
}

export function Sidebar({
  currentView,
  onViewChange,
  onCreateNote,
  isOpen,
  onClose,
  folders,
  activeFolder,
  onSelectFolder,
  onOpenSettings,
  onAddFolder,
  renameFolder,
  deleteFolder,
  pinnedFolders,
  togglePinFolder
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const activeNotesCount = 0;
  const archivedNotesCount = 0;

  const navItems = [
    { id: 'notes' as ViewType, label: 'All Notes', icon: LayoutGrid, count: activeNotesCount },
    { id: 'books' as ViewType, label: 'Book Mode', icon: Book, count: 0 },
    { id: 'schedule' as ViewType, label: 'Schedule', icon: Calendar, count: 0 },
    { id: 'archive' as ViewType, label: 'Archive', icon: Archive, count: archivedNotesCount },
    { id: 'trash' as ViewType, label: 'Trash', icon: Trash2, count: 0 },
    { id: 'scanner' as ViewType, label: 'Scanner', icon: Scan, count: 0 },
    { id: 'voice-note' as any, label: 'Voice Note', icon: Mic, count: 0, onClick: () => setIsVoiceOpen(true) },
  ];

  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      const aPinned = pinnedFolders.includes(a);
      const bPinned = pinnedFolders.includes(b);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.localeCompare(b);
    });
  }, [folders, pinnedFolders]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-[100dvh]
        w-64 bg-background border-r border-border
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex-none flex items-center justify-between h-14 px-4 border-b border-border">
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/Logo.webp?v=2" alt="Smart Notes" className="w-8 h-auto object-contain drop-shadow-sm" />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Smart Notes
            </span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <div className="px-3 space-y-6">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-between px-4 py-3 mb-2 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-100 transition-all group"
              aria-label="Toggle theme"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-violet-600 group-hover:scale-110 transition-transform" aria-hidden="true" />
                ) : (
                  <Sun className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
                )}
                <span className="font-medium text-violet-900">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-violet-600' : 'bg-gray-300'}`}
                role="presentation"
              >
                <div className={`
                    absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300
                    ${theme === 'dark' ? 'left-6' : 'left-1'}
                  `} />
              </div>
            </button>

            {/* Create Button */}
            <Button
              onClick={onCreateNote}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-300"
              aria-label="Create new note"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Note
            </Button>

            {/* Navigation */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu
              </p>
              {navItems.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else {
                      onViewChange(item.id);
                    }
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentView === item.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  aria-label={item.label}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    {item.label}
                  </div>
                  {item.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Folders */}
            <div className="space-y-1">
              <div className="space-y-0.5">
                {sortedFolders.map(folder => folder !== 'Google Drive' && (
                  <div key={folder} className="group flex items-center justify-between pr-2 rounded-lg hover:bg-accent transition-colors">
                    <button
                      onClick={() => {
                        onSelectFolder(folder);
                        onViewChange('notes');
                        onClose();
                      }}
                      className={`flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${activeFolder === folder
                        ? 'text-accent-foreground font-semibold'
                        : 'text-muted-foreground'
                        }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        {pinnedFolders.includes(folder) && <Pin className="w-3 h-3 text-primary fill-primary rotate-45" />}
                        <span className="truncate">{folder}</span>
                      </div>
                    </button>

                    {/* Folder Actions */}
                    {folder !== 'Main' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Options for ${folder}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            < MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setTimeout(async () => {
                              const newName = prompt("Rename folder to:", folder);
                              if (newName && newName !== folder) {
                                const res = await renameFolder(folder, newName);
                                if (res.error) {
                                  window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                    detail: { title: 'Error', message: res.error, type: 'error' }
                                  }));
                                } else {
                                  window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                    detail: { title: 'Folder Renamed', type: 'success' }
                                  }));
                                }
                              }
                            }, 100);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            togglePinFolder(folder);
                            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                              detail: {
                                title: pinnedFolders.includes(folder) ? 'Folder Unpinned' : 'Folder Pinned',
                                type: 'info'
                              }
                            }));
                          }}>
                            <div className={`w-4 h-4 mr-2 border rounded-full ${pinnedFolders.includes(folder) ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                            {pinnedFolders.includes(folder) ? 'Unpin Folder' : 'Pin Folder'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={(e) => {
                            e.stopPropagation();
                            setTimeout(async () => {
                              if (confirm(`Delete folder "${folder}"? Notes will be moved to Trash.`)) {
                                const res = await deleteFolder(folder);
                                if (res.error) {
                                  window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                    detail: { title: 'Error', message: res.error, type: 'error' }
                                  }));
                                } else {
                                  window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                    detail: { title: 'Folder Deleted', type: 'success' }
                                  }));
                                }
                              }
                            }, 100);
                          }}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
                <button
                  onClick={onAddFolder}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-all border border-dashed border-transparent hover:border-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  <span className="truncate">Add Folder</span>
                </button>
              </div>
            </div>

            {/* Tags placeholder removed as per logic but keeping structure if needed */}
          </div>
        </ScrollArea>      {/* Footer */}
        <div className="flex-none p-4 border-t border-border space-y-2 bg-background pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {currentView !== 'notes' && (
            <button
              onClick={() => {
                onViewChange('notes');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors border border-violet-100 shadow-sm mb-2"
              aria-label="Exit to Notes"
            >
              <LogOut className="w-5 h-5 rotate-180" />
              Exit to Notes
            </button>
          )}
          <button
            onClick={() => {
              onOpenSettings('profile');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'settings'
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>

          <button
            onClick={async () => {
              window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Sync Triggered', message: 'Connecting to Online Database...', type: 'info' }
              }));
              // Short timeout to let the notification animation play before reload
              setTimeout(() => {
                window.location.reload();
              }, 800);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Offline? Connect Again"
            title="Force sync data with online database"
          >
            <Cloud className="w-5 h-5" aria-hidden="true" />
            Offline? Connect Again
          </button>
          <div className="pt-2 text-center">
            <a
              href="https://bali.enterprises"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-violet-600 transition-all underline-offset-4 hover:underline"
            >
              Powered by Bali.Enterprises
            </a>
          </div>
        </div>
      </aside>      <AdvancedVoiceDialog
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSendToAI={(text) => {
          window.dispatchEvent(new CustomEvent('ai-message', { detail: text }));
        }}
      />
    </>
  );
}
