'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableSectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export default function DraggableSection({ id, children, className }: DraggableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50 shadow-lg',
        className
      )}
    >
      {/* Drag Handle - Visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-4 cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'text-gray-400 hover:text-gray-600',
          'flex items-center justify-center w-8 h-8 rounded-md',
          'hover:bg-gray-100 border border-gray-200',
          'touch-none'
        )}
        title="Drag to reorder section"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className={cn('transition-all', isDragging && 'scale-[1.02]')}>
        {children}
      </div>
    </div>
  );
}

