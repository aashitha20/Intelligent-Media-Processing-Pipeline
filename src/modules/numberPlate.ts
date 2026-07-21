import type { ModuleIssue } from '../types/analysis.js';

/**
 * Indian vehicle registration formats (simplified MVP validation):
 * - Standard: AA00AA0000 / AA00A0000 / AA00AAA0000
 * - BH series: 00BH0000AA (Bharat series)
 */
const STANDARD_PLATE =
  /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
const BHARAT_PLATE = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

export type PlateExtraction = {
  normalized: string | null;
  valid: boolean | null;
  issues: ModuleIssue[];
};

export function normalizePlateCandidate(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

export function isValidIndianNumberPlate(plate: string): boolean {
  return STANDARD_PLATE.test(plate) || BHARAT_PLATE.test(plate);
}

export function extractIndianNumberPlate(ocrText: string): PlateExtraction {
  if (!ocrText.trim()) {
    return {
      normalized: null,
      valid: null,
      issues: [
        {
          code: 'OCR_EMPTY',
          message: 'No text extracted from image',
          severity: 'info',
        },
      ],
    };
  }

  const tokens = ocrText
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  // Also try sliding concatenations of nearby tokens (OCR often splits plates)
  const candidates = new Set<string>();
  for (const token of tokens) {
    candidates.add(normalizePlateCandidate(token));
  }
  for (let i = 0; i < tokens.length; i++) {
    let combined = '';
    for (let j = i; j < Math.min(i + 4, tokens.length); j++) {
      combined += tokens[j];
      candidates.add(normalizePlateCandidate(combined));
    }
  }

  for (const candidate of candidates) {
    if (candidate.length < 8 || candidate.length > 11) continue;
    if (isValidIndianNumberPlate(candidate)) {
      return {
        normalized: candidate,
        valid: true,
        issues: [],
      };
    }
  }

  // Prefer the longest alphanumeric-looking token as a best-effort plate
  const fallback = [...candidates]
    .filter((c) => c.length >= 6 && c.length <= 12)
    .sort((a, b) => b.length - a.length)[0];

  if (fallback) {
    return {
      normalized: fallback,
      valid: false,
      issues: [
        {
          code: 'INVALID_NUMBER_PLATE',
          message: `Extracted text "${fallback}" does not match Indian number plate formats`,
          severity: 'warning',
        },
      ],
    };
  }

  return {
    normalized: null,
    valid: false,
    issues: [
      {
        code: 'NUMBER_PLATE_NOT_FOUND',
        message: 'Could not identify a number plate in OCR text',
        severity: 'warning',
      },
    ],
  };
}
