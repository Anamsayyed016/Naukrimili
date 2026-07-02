/**
 * Error classification for benchmark mismatches.
 */

import type { BenchmarkErrorClass, FieldComparison, FieldMatchStatus } from './types';

export interface ClassifyMismatchInput {
  section: string;
  field: string;
  status: FieldMatchStatus;
  expected: string;
  actual: string;
  similarity: number;
  isArrayEntry?: boolean;
  isOrderIssue?: boolean;
  isDuplicate?: boolean;
  isValidationIssue?: boolean;
  isRepairRelated?: boolean;
  confidence?: number;
}

export function classifyMismatch(input: ClassifyMismatchInput): BenchmarkErrorClass {
  const {
    section,
    field,
    status,
    expected,
    actual,
    similarity,
    isArrayEntry,
    isOrderIssue,
    isDuplicate,
    isValidationIssue,
    isRepairRelated,
    confidence,
  } = input;

  if (isValidationIssue) return 'validation_rejection';
  if (isRepairRelated) return 'repair_failure';
  if (isOrderIssue) return 'ordering_issue';
  if (isDuplicate || (status === 'unexpected' && isArrayEntry)) return 'duplicate';

  if (status === 'missing' && !actual) {
    if (section === 'experience' || section === 'projects' || section === 'education') {
      return isArrayEntry ? 'boundary_detection_failure' : 'parser_missed_field';
    }
    return 'parser_missed_field';
  }

  if (status === 'unexpected' && actual && !expected) {
    return 'wrong_section';
  }

  if (status === 'partial' && (section === 'skills' || field === 'name')) {
    return 'incorrect_normalization';
  }

  if (status === 'partial' && similarity >= 0.55) {
    return 'incorrect_normalization';
  }

  if (typeof confidence === 'number' && confidence < 45 && status !== 'match') {
    return 'confidence_too_low';
  }

  if (status === 'missing') return 'parser_missed_field';
  if (status === 'unexpected') return 'wrong_section';
  if (status === 'partial') return 'incorrect_normalization';

  return 'unknown';
}

export function fieldComparisonToMismatch(fc: FieldComparison): {
  errorClass: BenchmarkErrorClass;
  section: string;
  field?: string;
  index?: number;
  message: string;
  expected?: string;
  actual?: string;
} {
  return {
    errorClass: fc.errorClass,
    section: fc.section,
    field: fc.field,
    index: fc.index,
    message: fc.message,
    expected: fc.expected || undefined,
    actual: fc.actual || undefined,
  };
}
