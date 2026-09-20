import { describe, expect, it } from 'vitest';

import { clampPage, getPageCount, paginate } from './pagination';

describe('pagination', () => {
  it('10개 단위로 페이지 수를 계산한다', () => {
    expect(getPageCount(0)).toBe(0);
    expect(getPageCount(10)).toBe(1);
    expect(getPageCount(11)).toBe(2);
  });

  it('범위를 벗어난 페이지를 마지막 페이지로 보정한다', () => {
    expect(clampPage(5, 2)).toBe(1);
    expect(clampPage(-1, 2)).toBe(0);
    expect(clampPage(3, 0)).toBe(0);
  });

  it('현재 페이지의 항목만 잘라 낸다', () => {
    const items = Array.from({ length: 23 }, (_, index) => index);
    expect(paginate(items, 2)).toEqual({
      items: [20, 21, 22],
      page: 2,
      pageCount: 3,
    });
    expect(paginate(items, 9).page).toBe(2);
  });
});
