import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface CreateNoteButtonProps {
  onClick: () => void;
  variant?: 'card' | 'icon';
}

export function CreateNoteButton({ onClick, variant = 'card' }: CreateNoteButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'icon') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        title="Create new note"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    );
  }

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
      <div className="p-6 flex flex-col items-center justify-center min-h-[140px] text-center">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg transition-all duration-300 ${isHovered ? 'scale-120 shadow-violet-300' : ''
          }`}>
          <Plus className="w-6 h-6 text-white" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-gray-900">
          Create new note
        </h3>
        <p className="mt-1 text-[11px] text-gray-500 max-w-[150px] leading-tight opacity-70">
          Add a new note to your secured collection
        </p>
      </div>
    </Card>
  );
}
