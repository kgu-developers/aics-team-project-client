import { afterEach, expect, it, vi } from 'vitest';

import { saveDownload } from './saveDownload';
afterEach(() => vi.restoreAllMocks());
it.each([false, true])(
  'clicks a connected anchor and cleans up, even if click fails (%s)',
  fails => {
    const blob = new Blob(['archive']);
    const create = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:archive');
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
      expect(this.isConnected).toBe(true);
      expect(this.download).toBe('결과.zip');
      expect(this.href).toBe('blob:archive');
      if (fails) throw new Error('click failed');
    });
    if (fails)
      expect(() => saveDownload(blob, '결과.zip')).toThrow('click failed');
    else saveDownload(blob, '결과.zip');
    expect(create).toHaveBeenCalledWith(blob);
    expect(clicked[0]?.isConnected).toBe(false);
    expect(revoke).toHaveBeenCalledWith('blob:archive');
  },
);
