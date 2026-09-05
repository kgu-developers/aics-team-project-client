import { describe, expect, it } from 'vitest';

import {
  canCompletePresentationBlock,
  getCurrentPresentation,
  savePresentationBlock,
} from './presentation';

describe('presentation fixture', () => {
  it('rejects a stale block save and preserves the current version', () => {
    const presentation = getCurrentPresentation();

    const overview = presentation.blocks.find(
      block => block.key === 'project-overview',
    );
    if (!overview) throw new Error('project-overview fixture is required');

    const saved = savePresentationBlock(
      'project-overview',
      presentation.version - 1,
      overview.fields,
      'OOP 데모 학생 A',
    );

    expect(saved).toBeNull();
    expect(getCurrentPresentation().version).toBe(presentation.version);
  });

  it('exposes the four presentation sections in document order', () => {
    const keys = getCurrentPresentation().blocks.map(block => block.key);

    expect(keys).toEqual([
      'project-overview',
      'presentation-material',
      'main-features',
      'main-screens',
    ]);
  });

  it('keeps presentation-material field-free because submission owns demo URL and files', () => {
    const blocks = getCurrentPresentation().blocks;
    const material = blocks.find(
      block => block.key === 'presentation-material',
    );

    expect(material?.fields).toEqual([]);
    expect(blocks.map(block => block.key)).not.toContain('demo-video');
  });

  it.each([
    ['main-features', 'featureItems'],
    ['main-screens', 'screenItems'],
  ] as const)(
    '%s completion rejects empty rows and rows with missing required values',
    (blockKey, fieldKey) => {
      const block = getCurrentPresentation().blocks.find(
        item => item.key === blockKey,
      );
      if (!block) throw new Error(`${blockKey} fixture is required`);

      const withItems = (items: unknown[]) => ({
        ...block,
        fields: block.fields.map(field =>
          field.key === fieldKey
            ? { ...field, value: JSON.stringify(items) }
            : field,
        ),
      });

      expect(canCompletePresentationBlock(block)).toBe(true);
      expect(canCompletePresentationBlock({ ...block, fields: [] })).toBe(
        false,
      );
      expect(canCompletePresentationBlock(withItems([]))).toBe(false);
      expect(
        canCompletePresentationBlock(
          withItems([
            { id: 'reservation', name: '', description: '예매 흐름' },
          ]),
        ),
      ).toBe(false);
    },
  );

  it('requires the complete overview field schema', () => {
    const overview = getCurrentPresentation().blocks.find(
      block => block.key === 'project-overview',
    );
    if (!overview) throw new Error('project-overview fixture is required');

    expect(canCompletePresentationBlock(overview)).toBe(true);
    expect(
      canCompletePresentationBlock({
        ...overview,
        fields: overview.fields.filter(field => field.key === 'title'),
      }),
    ).toBe(false);
  });
});
