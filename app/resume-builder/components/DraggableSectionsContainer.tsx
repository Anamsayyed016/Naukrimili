'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ResumeBuilderData } from '../types';

export type SectionId = 
  | 'personalInfo'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'internships';

interface DraggableSectionsContainerProps {
  children: React.ReactNode;
  sectionOrder: SectionId[];
  onSectionOrderChange: (newOrder: SectionId[]) => void;
}

export default function DraggableSectionsContainer({
  children,
  sectionOrder,
  onSectionOrderChange,
}: DraggableSectionsContainerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as SectionId);
      const newIndex = sectionOrder.indexOf(over.id as SectionId);

      const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
      onSectionOrderChange(newOrder);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

