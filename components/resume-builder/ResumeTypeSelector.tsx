'use client';

import ResumeTypeCard from './ResumeTypeCard';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';

interface ResumeType {
  id: string;
  title: string;
  icon: string;
  description: string;
  fields: string[];
}

interface ResumeTypeSelectorProps {
  types: ResumeType[];
  selectedType: string | null;
  onSelectType: (typeId: string) => void;
}

export default function ResumeTypeSelector({
  types,
  selectedType,
  onSelectType,
}: ResumeTypeSelectorProps) {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div
      className={cn(
        "grid gap-6",
        isMobile
          ? "grid-cols-1"
          : isTablet
          ? "grid-cols-2"
          : "grid-cols-2"
      )}
    >
      {types.map((type) => (
        <ResumeTypeCard
          key={type.id}
          type={type}
          isSelected={selectedType === type.id}
          onSelect={onSelectType}
        />
      ))}
    </div>
  );
}

