'use client';

/**
 * Section Order Manager Component
 * Allows users to drag and drop resume sections to reorder them
 * Uses @dnd-kit for drag-and-drop functionality
 */

import { useState, useEffect } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SectionId = 
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'languages'
  | 'hobbies';

interface Section {
  id: SectionId;
  label: string;
  hasContent: boolean;
}

interface SectionOrderManagerProps {
  sectionOrder: SectionId[];
  formData: Record<string, unknown>;
  onOrderChange: (newOrder: SectionId[]) => void;
  className?: string;
}

const SECTION_LABELS: Record<SectionId, string> = {
  summary: 'Profile/Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
  hobbies: 'Hobbies & Interests',
};

// Check if a section has content
function hasSectionContent(sectionId: SectionId, formData: Record<string, unknown>): boolean {
  switch (sectionId) {
    case 'summary':
      return !!(formData.summary || formData.Summary);
    case 'experience':
      return Array.isArray(formData.experience) && formData.experience.length > 0 ||
             Array.isArray(formData['Work Experience']) && formData['Work Experience'].length > 0;
    case 'education':
      return Array.isArray(formData.education) && formData.education.length > 0 ||
             Array.isArray(formData.Education) && formData.Education.length > 0;
    case 'skills':
      return Array.isArray(formData.skills) && formData.skills.length > 0 ||
             Array.isArray(formData.Skills) && formData.Skills.length > 0;
    case 'projects':
      return Array.isArray(formData.projects) && formData.projects.length > 0 ||
             Array.isArray(formData.Projects) && formData.Projects.length > 0;
    case 'certifications':
      return Array.isArray(formData.certifications) && formData.certifications.length > 0 ||
             Array.isArray(formData.Certifications) && formData.Certifications.length > 0;
    case 'achievements':
      return Array.isArray(formData.achievements) && formData.achievements.length > 0 ||
             Array.isArray(formData.Achievements) && formData.Achievements.length > 0;
    case 'languages':
      return Array.isArray(formData.languages) && formData.languages.length > 0 ||
             Array.isArray(formData.Languages) && formData.Languages.length > 0;
    case 'hobbies':
      return Array.isArray(formData.hobbies) && formData.hobbies.length > 0 ||
             Array.isArray(formData.Hobbies) && formData.Hobbies.length > 0 ||
             Array.isArray(formData['Hobbies & Interests']) && formData['Hobbies & Interests'].length > 0;
    default:
      return false;
  }
}

function SortableSectionItem({
  section,
  isDragging,
}: {
  section: Section;
  isDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: itemIsDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: itemIsDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card',
        itemIsDragging && 'shadow-lg border-primary',
        !section.hasContent && 'opacity-60'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      
      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{section.label}</span>
          {!section.hasContent && (
            <Badge variant="outline" className="text-xs">
              Empty
            </Badge>
          )}
        </div>
        
        {section.hasContent ? (
          <Eye className="h-4 w-4 text-muted-foreground" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

export default function SectionOrderManager({
  sectionOrder,
  formData,
  onOrderChange,
  className,
}: SectionOrderManagerProps) {
  const [sections, setSections] = useState<Section[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update sections when formData or sectionOrder changes
  useEffect(() => {
    const updatedSections: Section[] = sectionOrder.map((id) => ({
      id,
      label: SECTION_LABELS[id],
      hasContent: hasSectionContent(id, formData),
    }));
    setSections(updatedSections);
  }, [sectionOrder, formData]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);

      // Notify parent of order change
      const newOrder = newSections.map((s) => s.id);
      onOrderChange(newOrder);
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Section Order</CardTitle>
        <CardDescription>
          Drag and drop sections to reorder them in your resume. Empty sections will still appear in the order you set.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  isDragging={false}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Reorder sections to highlight your most important qualifications first.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

