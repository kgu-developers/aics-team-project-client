import { describe, expect, it } from 'vitest';

import { isMockDevelopmentMode } from './developmentMode';

describe('isMockDevelopmentMode', () => {
  it('keeps mock previews in development', () => {
    expect(isMockDevelopmentMode(true, undefined)).toBe(true);
    expect(isMockDevelopmentMode(true, 'true')).toBe(true);
  });

  it('never enables mock previews in production', () => {
    expect(isMockDevelopmentMode(false, undefined)).toBe(false);
  });

  it('can disable mock previews for direct backend checks', () => {
    expect(isMockDevelopmentMode(true, 'false')).toBe(false);
  });
});
