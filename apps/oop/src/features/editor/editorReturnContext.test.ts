import { describe, expect, it } from 'vitest';

import {
  editorReturnLabel,
  validateEditorReturnContext,
} from './editorReturnContext';

describe('editor return context', () => {
  it.each([
    ['proposal', 'proposal'],
    ['mid-review', 'mid-review'],
  ] as const)('%s 문서는 같은 마일스톤 컨텍스트만 허용한다', (docId, value) => {
    expect(validateEditorReturnContext(docId, value)).toBe(value);
  });

  it.each([
    ['proposal', 'https://evil.example'],
    ['proposal', '/admin'],
    ['proposal', 'mid-review'],
    ['mid-review', 'proposal'],
    ['mid-review', undefined],
  ] as const)('%s 문서는 임의의 returnTo %s를 버린다', (docId, value) => {
    expect(validateEditorReturnContext(docId, value)).toBeUndefined();
  });

  it('직접 진입은 학생 홈으로 안전하게 안내한다', () => {
    expect(editorReturnLabel(undefined)).toBe('학생 홈으로');
  });
});
