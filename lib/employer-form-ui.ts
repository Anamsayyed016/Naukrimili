/**
 * Shared employer form visual tokens (company + job posting).
 * Styling only — no layout dimensions or business logic.
 */
export const ef = {
  pageBg: 'bg-white min-h-screen',
  pageBgSoft: 'min-h-screen bg-gradient-to-b from-white via-slate-50/40 to-blue-50/20',

  mainCard:
    'shadow-[0_8px_32px_-8px_rgba(37,99,235,0.12),0_20px_48px_-16px_rgba(15,23,42,0.08)] border border-[#2563EB]/12 bg-white/92 backdrop-blur-xl rounded-[18px] sm:rounded-[20px]',

  sectionCard:
    'relative rounded-[16px] sm:rounded-[18px] bg-white/90 backdrop-blur-xl border border-[#2563EB]/12 shadow-[0_0_0_1px_rgba(37,99,235,0.05),0_8px_24px_-10px_rgba(37,99,235,0.1)] transition-[box-shadow] duration-200 hover:shadow-[0_12px_32px_-12px_rgba(37,99,235,0.14)] p-4 sm:p-6',

  sectionTitle: 'text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight',
  sectionDesc: 'text-[#64748B] text-sm sm:text-base font-medium',
  sectionIconWrap:
    'p-3 sm:p-4 bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#06B6D4] rounded-full shadow-[0_4px_20px_-4px_rgba(37,99,235,0.45)] ring-2 ring-white/80 flex items-center justify-center',

  label: 'text-sm sm:text-base font-semibold text-[#0F172A]',
  labelBlock: 'text-sm sm:text-base font-semibold text-[#0F172A] mb-2 block',

  input:
    'bg-white border border-[#2563EB]/15 text-[#0F172A] placeholder:text-[#64748B] rounded-xl shadow-[inset_0_1px_2px_0_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 focus:border-[#2563EB] focus:outline-none focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] focus-visible:ring-0',

  textarea:
    'resize-none bg-white border border-[#2563EB]/15 text-[#0F172A] placeholder:text-[#64748B] placeholder:font-medium rounded-xl shadow-[inset_0_1px_2px_0_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 focus:border-[#2563EB] focus:outline-none focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] focus-visible:ring-0',

  selectTrigger:
    'border border-[#2563EB]/15 bg-white rounded-xl shadow-[inset_0_1px_2px_0_rgba(15,23,42,0.04)] focus:border-[#2563EB] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] transition-all duration-200',

  aiButton:
    'bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] text-white border-0 hover:from-[#1d4ed8] hover:via-[#6d28d9] hover:to-[#0891b2] shadow-[0_2px_10px_-2px_rgba(37,99,235,0.35)] hover:shadow-[0_4px_18px_-4px_rgba(37,99,235,0.42)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0',

  aiBadge:
    'bg-gradient-to-r from-[#2563EB]/10 via-[#7C3AED]/8 to-[#06B6D4]/6 text-[#2563EB] border border-[#2563EB]/15 text-xs font-semibold',

  headerIcon:
    'relative p-3 bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#06B6D4] rounded-2xl shadow-[0_4px_20px_-4px_rgba(37,99,235,0.45)] ring-2 ring-white/80',

  headerBadge:
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/80 backdrop-blur-md border border-[#2563EB]/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#2563EB] shadow-sm',

  suggestionPanel:
    'mt-3 space-y-2.5 rounded-[14px] border border-[#2563EB]/10 bg-gradient-to-br from-[#2563EB]/[0.04] via-white to-[#06B6D4]/[0.03] p-3 sm:p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',

  suggestionCard:
    'group relative w-full text-left text-sm pl-4 pr-4 py-3.5 rounded-xl border border-[#2563EB]/15 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-[#2563EB]/[0.05] hover:shadow-[0_8px_20px_-8px_rgba(37,99,235,0.22)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35',

  suggestionAccent:
    'pointer-events-none absolute left-2 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-[#2563EB] via-[#7C3AED] to-[#06B6D4] opacity-80 group-hover:opacity-100',

  skillChipSelected:
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] text-white font-semibold text-sm shadow-[0_2px_8px_-2px_rgba(37,99,235,0.35)] transition-all duration-200 hover:-translate-y-0.5',

  skillChipAdd:
    'h-9 rounded-full border border-[#2563EB]/20 text-[#475569] font-medium hover:border-[#2563EB]/35 hover:bg-[#2563EB]/5 hover:text-[#2563EB] transition-all duration-200 hover:-translate-y-0.5',

  benefitChip:
    'rounded-full border font-medium transition-all duration-200 hover:-translate-y-0.5',

  benefitChipOn:
    'bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] text-white border-transparent shadow-[0_2px_8px_-2px_rgba(37,99,235,0.3)]',

  benefitChipOff:
    'bg-white border-[#2563EB]/15 text-[#475569] hover:border-[#2563EB]/30 hover:bg-[#2563EB]/5',

  toggleCard:
    'flex items-center gap-3 sm:gap-4 p-4 rounded-[16px] border border-[#2563EB]/12 bg-white/85 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-[0_8px_20px_-10px_rgba(37,99,235,0.12)] min-w-0',

  switchOn: 'data-[state=checked]:bg-[#2563EB] data-[state=checked]:shadow-[0_0_12px_-2px_rgba(37,99,235,0.5)]',
  switchOff: 'data-[state=unchecked]:bg-slate-200',

  stepActive:
    'bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#06B6D4] text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.45)] border-[#2563EB]',
  stepInactive: 'bg-white text-[#64748B] border-[#2563EB]/20 shadow-sm',

  aiHint:
    'p-2.5 sm:p-3 rounded-xl border border-[#2563EB]/12 bg-gradient-to-r from-[#2563EB]/5 via-white to-[#06B6D4]/5 text-xs sm:text-sm text-[#475569] font-medium',
} as const;
