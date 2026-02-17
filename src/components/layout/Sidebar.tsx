import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid,
  Archive,
  Tag,
  Settings,
  Plus,
  X,
  Scan,
} from 'lucide-react';


type ViewType = 'notes' | 'archive' | 'trash' | 'scanner' | 'settings';

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
}

export function Sidebar({ currentView, onViewChange, onCreateNote, isOpen, onClose, folders, activeFolder, onSelectFolder, onOpenSettings }: SidebarProps) {
  const tags: string[] = []; // Removed mock tags
  const activeNotesCount = 0; // Removed mock count
  const archivedNotesCount = 0; // Removed mock count

  const navItems = [
    { id: 'notes' as ViewType, label: 'All Notes', icon: LayoutGrid, count: activeNotesCount },
    { id: 'archive' as ViewType, label: 'Archive', icon: Archive, count: archivedNotesCount },
    { id: 'scanner' as ViewType, label: 'Scanner', icon: Scan, count: 0 },
  ];

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
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center gap-2 lg:hidden">
              {/* Logo removed for desktop as it's in Header */}
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Smart Notes
              </span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 py-4">
            <div className="px-3 space-y-6">
              {/* Create Button */}
              <Button
                onClick={onCreateNote}
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Note
              </Button>

              {/* Navigation */}
              <div className="space-y-1">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Menu
                </p>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentView === item.id
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-violet-600' : 'text-gray-400'
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
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Folders
                </p>
                <div className="space-y-0.5">
                  {folders.map(folder => (
                    <button
                      key={folder}
                      onClick={() => {
                        onSelectFolder(folder);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === folder
                        ? 'bg-violet-50 text-violet-700'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <span className="truncate">{folder}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Tags
                  </p>
                  <div className="space-y-0.5">
                    {tags.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{tag}</span>
                      </button>
                    ))}
                    {tags.length > 8 && (
                      <button className="w-full text-left px-3 py-2 text-sm text-violet-600 hover:text-violet-700 font-medium">
                        +{tags.length - 8} more
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'settings'
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Settings className={`w-5 h-5 ${currentView === 'settings' ? 'text-violet-600' : 'text-gray-400'}`} />
              Settings
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
