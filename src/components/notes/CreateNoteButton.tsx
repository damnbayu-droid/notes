import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Lightbulb, CheckSquare, Image as ImageIcon } from 'lucide-react';

interface CreateNoteButtonProps {
  onClick: () => void;
}

export function CreateNoteButton({ onClick }: CreateNoteButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer border-dashed border-2 border-gray-300 bg-gray-50/50 hover:bg-white hover:border-violet-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Create new note"
    >
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg transition-all duration-300 ${isHovered ? 'scale-110 shadow-violet-300' : ''
          }`}>
          <Plus className="w-8 h-8 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Create new note
        </h3>
        <p className="mt-1 text-sm text-gray-500 max-w-[200px]">
          Click to add a new note to your collection
        </p>

        {/* Quick actions hint */}
        <div className={`flex items-center gap-4 mt-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Idea</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>List</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Media</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
