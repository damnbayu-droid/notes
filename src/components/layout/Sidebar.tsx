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
  Tag,
  Settings,
  Cloud,
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
  onOpenSettings: () => void;
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
  const tags: string[] = [];
  const activeNotesCount = 0;
  const archivedNotesCount = 0;

  const navItems = [
    { id: 'notes' as ViewType, label: 'All Notes', icon: LayoutGrid, count: activeNotesCount },
    { id: 'books' as ViewType, label: 'Book Mode', icon: Book, count: 0 },
    { id: 'schedule' as ViewType, label: 'Schedule', icon: Calendar, count: 0 },
    { id: 'archive' as ViewType, label: 'Archive', icon: Archive, count: archivedNotesCount },
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
        fixed lg:sticky top-0 left-0 z-50 h-screen
        w-64 bg-background border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <div className="flex items-center gap-2 lg:hidden">
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
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full flex items-center justify-between px-4 py-3 mb-2 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-100 transition-all group"
                aria-label="Toggle theme"
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-violet-600 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Sun className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-medium text-violet-900">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <div className={`
                  w-10 h-5 rounded-full relative transition-colors duration-300
                  ${theme === 'dark' ? 'bg-violet-600' : 'bg-gray-300'}
                `}>
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
                <div className="flex items-center justify-between px-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Folders
                  </p>
                </div>
                <div className="space-y-0.5">
                  {sortedFolders.map(folder => (
                    <div key={folder} className="group flex items-center justify-between pr-2 rounded-lg hover:bg-accent transition-colors">
                      <button
                        onClick={() => {
                          onSelectFolder(folder);
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
                      {folder !== 'Main' && folder !== 'Google Drive' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Options for ${folder}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
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

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tags
                  </p>
                  <div className="space-y-0.5">
                    {tags.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
                      >
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{tag}</span>
                      </button>
                    ))}
                    {tags.length > 8 && (
                      <button className="w-full text-left px-3 py-2 text-sm text-primary hover:text-primary/80 font-medium">
                        +{tags.length - 8} more
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">

            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'settings'
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
            >
              <Settings className={`w-5 h-5 ${currentView === 'settings' ? 'text-primary' : 'text-muted-foreground'}`} />
              Settings
            </button>
            <button
              onClick={async () => {
                try {
                  const { googleDrive } = await import('@/lib/googleDrive');
                  await googleDrive.loadScripts();
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Sync with Google Drive"
            >
              <Cloud className="w-5 h-5" />
              Sync Drive
            </button>
          </div>
        </div>
      </aside>

      <AdvancedVoiceDialog
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSendToAI={(text) => {
          window.dispatchEvent(new CustomEvent('ai-message', { detail: text }));
        }}
      />
    </>
  );
}
