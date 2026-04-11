import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/hooks/useTheme';
import { AdvancedVoiceDialog } from '@/components/voice/AdvancedVoiceDialog';
import {
  LayoutGrid,
  Archive,
  X,
  Calendar,
  Book,
  Mic,
  Pin,
  Trash2,
  FileEdit,
  Compass,
  Crown,
  Zap,
  MoreHorizontal,
  Moon,
  Sun,
  Plus,
  Pencil,
  MessageSquare,
  Cloud,
  Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewType = 'notes' | 'archive' | 'trash' | 'scanner' | 'settings' | 'schedule' | 'books' | 'admin' | 'discovery';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
  folders: string[];
  activeFolder: string;
  onSelectFolder: (folder: string) => void;
  onAddFolder: () => void;
  renameFolder: (oldName: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  deleteFolder: (folderName: string) => Promise<{ success: boolean; error?: string }>;
  pinnedFolders: string[];
  togglePinFolder: (folderName: string) => void;
  subscriptionTier?: string;
  onUpgrade?: () => void;
  userEmail?: string;
  userId?: string;
  onSignIn?: () => void;
  reconcileIdentity?: () => Promise<{ success: boolean; count?: number; error?: string }>;
}

export function Sidebar({
  currentView,
  onViewChange,
  isOpen,
  onClose,
  folders,
  activeFolder,
  onSelectFolder,
  onAddFolder,
  renameFolder,
  deleteFolder,
  pinnedFolders,
  togglePinFolder,
  subscriptionTier = 'free',
  onUpgrade,
  userEmail,
  userId,
  onSignIn,
  reconcileIdentity
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const navItems = [
    { id: 'notes' as ViewType, label: 'Dashboard', icon: LayoutGrid, count: 0 },
    { id: 'discovery' as ViewType, label: 'Discovery', icon: Compass, count: 0 },
    { id: 'books' as ViewType, label: 'Book Mode', icon: Book, count: 0 },
    { id: 'schedule' as ViewType, label: 'Schedule', icon: Calendar, count: 0 },
    { id: 'archive' as ViewType, label: 'Archive', icon: Archive, count: 0 },
    { id: 'trash' as ViewType, label: 'Trash', icon: Trash2, count: 0 },
    { id: 'scanner' as ViewType, label: 'PDF Editor', icon: FileEdit, count: 0 },
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

  const handleContactUs = () => {
    window.dispatchEvent(new CustomEvent('open-contact-modal'));
  };

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
        <div className="flex-none p-4 bg-slate-50 border-b border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Connect: dfxhfutflhnxjjpbqscj</p>
            </div>
            
            {userEmail ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Session Signature:</p>
                    <code className="text-[10px] font-mono text-violet-600 break-all leading-tight block">{userId}</code>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-[10px] font-black text-slate-900 mb-2 uppercase tracking-tight">Data Missing?</p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full h-10 border-violet-200 text-violet-600 bg-violet-50/50 hover:bg-violet-100 font-bold uppercase tracking-widest text-[9px] rounded-xl shadow-sm transition-all active:scale-95"
                      onClick={async () => {
                        window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                          detail: { title: 'Deep Sync Initiated', message: 'Scanning all database sectors...', type: 'info' } 
                        }));
                        const res = await reconcileIdentity?.();
                        if (res?.success) {
                          window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                            detail: { 
                              title: 'Restoration Successful', 
                              message: `Recovered ${res.count} documents. They are now linked to your session!`, 
                              type: 'success' 
                            } 
                          }));
                        } else {
                          window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                            detail: { title: 'Sync Warning', message: res?.error || 'No notes found for migration.', type: 'warning' } 
                          }));
                        }
                      }}
                    >
                      Deep Scan & Restore
                    </Button>
                    <p className="text-[7px] font-bold text-slate-400 mt-2 uppercase italic tracking-tighter">*Searches for notes matching legacy ID: cfd6e46f-...</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col gap-3">
                    <p className="text-[10px] font-black text-amber-900">92 Notes Found in Cloud</p>
                    <Button 
                      onClick={onSignIn}
                      className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-lg"
                    >
                      Authenticate Now
                    </Button>
                </div>
              )}
        </div>

        <div className="flex-none flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent tracking-tighter">
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
              className="w-full flex items-center justify-between px-4 py-3 mb-2 bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-100 rounded-xl border border-violet-100 dark:border-violet-900 transition-all group"
              aria-label="Toggle theme"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-violet-600 group-hover:scale-110 transition-transform" aria-hidden="true" />
                ) : (
                  <Sun className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
                )}
                <span className="font-bold text-violet-900 dark:text-violet-100 text-sm">
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


            {/* Subscription Badge/Button */}
            <div className="px-1">
              {subscriptionTier === 'full_access' ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl shadow-sm">
                  <Crown className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Enterprise PRO</span>
                </div>
              ) : (
                <button
                  onClick={onUpgrade}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 rounded-2xl shadow-xl shadow-violet-500/20 transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Go Premium</span>
                  </div>
                  <Zap className="w-4 h-4 text-violet-200 group-hover:text-white transition-colors" />
                </button>
              )}
            </div>
            
              <div className="flex flex-col gap-1">
                <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                  CORE SYSTEM
                </p>
                {subscriptionTier === 'admin' && (
                  <button
                    onClick={() => {
                       onViewChange('admin');
                       onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-black transition-all mb-2 ${currentView === 'admin'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5" />
                      ADMIN PANEL
                    </div>
                  </button>
                )}
                {navItems.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else if (item.id === 'discovery') {
                        onViewChange('discovery');
                      } else {
                        onViewChange(item.id);
                      }
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${currentView === item.id
                      ? 'bg-violet-100/50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                      : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-foreground'
                      }`}
                    aria-label={item.label}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-violet-600' : 'text-slate-400'
                        }`} />
                      {item.label}
                    </div>
                  </button>
                ))}
              </div>

            {/* Folders */}
            <div className="space-y-1">
               <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                KNOWLEDGE BASE
              </p>
              <div className="space-y-0.5">
                {sortedFolders.map(folder => folder !== 'Google Drive' && (
                  <div key={folder} className="group flex items-center justify-between pr-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <button
                      onClick={() => {
                        onSelectFolder(folder);
                        onViewChange('notes');
                        onClose();
                      }}
                      className={`flex-1 flex items-center gap-3 px-3 py-2 text-sm font-bold transition-colors ${activeFolder === folder
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-muted-foreground'
                        }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        {pinnedFolders.includes(folder) && <Pin className="w-3 h-3 text-violet-600 fill-violet-600 rotate-45 shrink-0" />}
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
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                            aria-label={`Options for ${folder}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            < MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl border-violet-100 shadow-xl">
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
                          }} className="rounded-xl">
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
                          }} className="rounded-xl">
                            <Pin className="w-4 h-4 mr-2" />
                            {pinnedFolders.includes(folder) ? 'Unpin Folder' : 'Pin Folder'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-xl" onClick={(e) => {
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all border border-dashed border-violet-200 dark:border-violet-800"
                >
                  <Plus className="w-4 h-4" />
                  <span className="truncate uppercase tracking-widest text-[10px]">Create Folder</span>
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-none p-5 border-t border-border space-y-3 bg-background/50 backdrop-blur-sm relative z-10">
          <button
            onClick={handleContactUs}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-black transition-all shadow-xl active:scale-95 group border border-slate-800"
          >
            <MessageSquare className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
            Contact Us / Support
          </button>

          <button
            onClick={async () => {
              window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Syncing...', message: 'Connecting to Cloud HQ', type: 'info' }
              }));
              setTimeout(() => {
                window.location.reload();
              }, 800);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest opacity-60 hover:opacity-100"
            aria-label="Offline? Connect Again"
          >
            <Cloud className="w-4 h-4" />
            Connect Again / Refresh System
          </button>

          <div className="pt-2 text-center space-y-2">
            <a
              href="https://bali.enterprises"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 hover:text-violet-600 transition-all"
            >
              Bali.Enterprises
            </a>
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
