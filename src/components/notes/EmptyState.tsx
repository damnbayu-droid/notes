import { FileSearch, Archive, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'search' | 'archive' | 'notes' | 'trash';
  onAction?: () => void;
  onClearFilters?: () => void;
}

export function EmptyState({ type, onAction, onClearFilters }: EmptyStateProps) {
  const configs = {
    search: {
      icon: FileSearch,
      title: 'No notes found',
      description: 'Try adjusting your search or filters to find what you\'re looking for.',
      action: null,
    },
    archive: {
      icon: Archive,
      title: 'No archived notes',
      description: 'Notes you archive will appear here.',
      action: null,
    },
    notes: {
      icon: Lightbulb,
      title: 'No notes yet',
      description: 'Start creating notes to organize your thoughts and ideas.',
      action: {
        label: 'Create your first note',
        onClick: onAction,
      },
    },
    trash: {
      icon: Archive,
      title: 'Trash is empty',
      description: 'Notes in trash are deleted after 30 days.',
      action: null,
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {config.title}
      </h3>
      <p className="text-gray-500 max-w-sm mb-6">
        {config.description}
      </p>
      {config.action && (
        <Button onClick={config.action.onClick} className="gap-2">
          <Icon className="w-4 h-4" />
          {config.action.label}
        </Button>
      )}
      {type === 'search' && onClearFilters && (
        <Button variant="ghost" onClick={onClearFilters} className="mt-4">
          Clear filters
        </Button>
      )}
    </div>
  );
}
