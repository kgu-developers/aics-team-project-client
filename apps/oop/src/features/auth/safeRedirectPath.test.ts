import { describe, expect, it } from 'vitest';

import { safeRedirectPath } from './safeRedirectPath';

describe('safeRedirectPath', () => {
  it('앱 내부 절대 경로만 허용한다', () => {
    expect(safeRedirectPath('/admin/milestones/new?sectionId=1')).toBe(
      '/admin/milestones/new?sectionId=1',
    );
  });

  it.each([
    '//evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    '/login',
    '/login?redirect=/admin',
    'admin',
    '/a\\b',
    42,
    undefined,
  ])('%s 는 무시한다', value => {
    expect(safeRedirectPath(value)).toBeUndefined();
  });
});
