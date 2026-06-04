'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ef } from '@/lib/employer-form-ui';

interface EmployerAiSuggestionCardsProps {
  items: string[];
  onSelect: (text: string) => void;
  companyName?: string;
  subtitle?: string;
}

export function EmployerAiSuggestionCards({
  items,
  onSelect,
  companyName,
  subtitle,
}: EmployerAiSuggestionCardsProps) {
  if (!items?.length) return null;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className={ef.suggestionPanel}
      >
        <div className="mb-3 space-y-1">
          <p className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden />
            </span>
            AI Suggestions
          </p>
          {companyName ? (
            <p className="text-[11px] sm:text-xs text-[#64748B] pl-8">
              Generated for:{' '}
              <span className="font-semibold text-[#2563EB]">{companyName}</span>
            </p>
          ) : null}
          {subtitle ? (
            <p className="text-[11px] text-[#64748B] pl-8">{subtitle}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          {items.map((suggestion, idx) => (
            <motion.button
              key={`${idx}-${suggestion.slice(0, 32)}`}
              type="button"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              onClick={() => onSelect(suggestion)}
              className={ef.suggestionCard}
            >
              <span className={ef.suggestionAccent} aria-hidden />
              <span className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#7C3AED] opacity-70 group-hover:opacity-100" aria-hidden />
                <span className="flex-1 leading-relaxed text-[#0F172A]">{suggestion}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
