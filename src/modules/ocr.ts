import Tesseract from 'tesseract.js';
import type { AnalysisModuleResult } from '../types/analysis.js';
import { extractIndianNumberPlate } from './numberPlate.js';

export async function runOcr(filepath: string): Promise<AnalysisModuleResult> {
  const result = await Tesseract.recognize(filepath, 'eng', {
    logger: () => undefined,
  });

  const ocrText = result.data.text.replace(/\s+/g, ' ').trim();
  const plate = extractIndianNumberPlate(ocrText);

  return {
    ocrText,
    numberPlate: plate.normalized,
    numberPlateValid: plate.valid,
    issues: plate.issues,
  };
}
