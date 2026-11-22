// @vitest-environment node

import { readFile } from 'node:fs/promises';

import { getDocument } from 'pdfjs-dist';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('PdfPreview PDF.js 런타임 호환성', () => {
  let originalToHex: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalToHex = Object.getOwnPropertyDescriptor(
      Uint8Array.prototype,
      'toHex',
    );
    delete (Uint8Array.prototype as { toHex?: unknown }).toHex;
  });

  afterEach(() => {
    if (originalToHex)
      Object.defineProperty(Uint8Array.prototype, 'toHex', originalToHex);
  });

  it('Uint8Array.toHex가 없는 브라우저 세대에서도 PDF를 읽는다', async () => {
    expect('toHex' in Uint8Array.prototype).toBe(false);
    const data = new Uint8Array(
      await readFile(
        new URL(
          '../../../../public/evaluation/bookloop-presentation.pdf',
          import.meta.url,
        ),
      ),
    );
    const loadingTask = getDocument({ data });

    try {
      const pdf = await loadingTask.promise;

      expect(pdf.numPages).toBeGreaterThan(0);
      expect(pdf.fingerprints[0]).toMatch(/^[0-9a-f]+$/);
    } finally {
      await loadingTask.destroy();
    }
  });
});
