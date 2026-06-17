'use client';

import { cn } from '@/lib/utils';
import {
  ALL_BUSINESS_PLAN_KEYS,
  ALL_INDIVIDUAL_PLAN_KEYS,
  ALL_PLAN_KEYS,
  PLAN_DISPLAY_NAMES,
  type PlanKey,
} from '@/lib/services/razorpay-plans';
import { Button } from '@/components/ui/button';

interface CouponPlanChipsProps {
  selected: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}

function Chip({
  planKey,
  selected,
  onToggle,
  disabled,
}: {
  planKey: PlanKey;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors min-h-9',
        selected
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
      )}
      aria-pressed={selected}
    >
      {PLAN_DISPLAY_NAMES[planKey]}
    </button>
  );
}

export function CouponPlanChips({ selected, onChange, disabled }: CouponPlanChipsProps) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 text-xs border-gray-300"
          onClick={() => onChange([...ALL_PLAN_KEYS])}
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 text-xs border-gray-300"
          onClick={() => onChange([])}
        >
          Clear All
        </Button>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Individual Plans
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_INDIVIDUAL_PLAN_KEYS.map((k) => (
            <Chip
              key={k}
              planKey={k}
              selected={selected.includes(k)}
              onToggle={() => toggle(k)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          Business Plans
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_BUSINESS_PLAN_KEYS.map((k) => (
            <Chip
              key={k}
              planKey={k}
              selected={selected.includes(k)}
              onToggle={() => toggle(k)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
