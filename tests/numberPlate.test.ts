import { describe, expect, it } from 'vitest';
import {
  extractIndianNumberPlate,
  isValidIndianNumberPlate,
  normalizePlateCandidate,
} from '../src/modules/numberPlate.js';
import { hammingDistance } from '../src/modules/duplicate.js';

describe('Indian number plate validation', () => {
  it('accepts standard and BH formats', () => {
    expect(isValidIndianNumberPlate('MH12AB1234')).toBe(true);
    expect(isValidIndianNumberPlate('KA03MK9999')).toBe(true);
    expect(isValidIndianNumberPlate('22BH1234AA')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidIndianNumberPlate('INVALID')).toBe(false);
    expect(isValidIndianNumberPlate('MH12')).toBe(false);
    expect(isValidIndianNumberPlate('1234567890')).toBe(false);
  });

  it('extracts a valid plate from noisy OCR text', () => {
    const result = extractIndianNumberPlate('Vehicle No: MH 12 AB 1234 State: Maharashtra');
    expect(result.normalized).toBe('MH12AB1234');
    expect(result.valid).toBe(true);
  });

  it('normalizes candidates', () => {
    expect(normalizePlateCandidate('mh-12-ab-1234')).toBe('MH12AB1234');
  });
});

describe('perceptual hash distance', () => {
  it('returns 0 for identical hashes', () => {
    expect(hammingDistance('ffffffffffffffff', 'ffffffffffffffff')).toBe(0);
  });

  it('detects differing bits', () => {
    expect(hammingDistance('ffffffffffffffff', 'fffffffffffffffe')).toBe(1);
  });
});
