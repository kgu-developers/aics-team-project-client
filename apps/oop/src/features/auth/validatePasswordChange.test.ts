import { describe, expect, it } from 'vitest';

import { validatePasswordChange } from './validatePasswordChange';

describe('validatePasswordChange', () => {
  it.each([
    ['', 'new-password', 'new-password', 'currentPassword'],
    ['   ', 'new-password', 'new-password', 'currentPassword'],
    ['current-password', '', '', 'newPassword'],
    ['current-password', '        ', '        ', 'newPassword'],
    ['current-password', 'new-password', '', 'confirmPassword'],
    ['current-password', 'new-password', 'different', 'confirmPassword'],
    ['same-password', 'same-password', 'same-password', 'newPassword'],
  ])(
    '필수값·확인 일치·기존 비밀번호 재사용을 검증한다 (%s, %s, %s)',
    (current, next, confirm, field) => {
      expect(validatePasswordChange(current, next, confirm)?.field).toBe(field);
    },
  );

  it.each([
    ['a'.repeat(7), false],
    ['a'.repeat(8), true],
    ['a'.repeat(64), true],
    ['a'.repeat(65), false],
    ['가'.repeat(24), true],
    ['가'.repeat(24) + 'a', false],
    ['😀'.repeat(18), true],
    ['😀'.repeat(18) + 'a', false],
    [' valid-password ', true],
  ])('문자 수와 UTF-8 바이트 경계를 검증한다 (%s)', (password, valid) => {
    const result = validatePasswordChange(
      'current-password',
      password,
      password,
    );
    if (valid) expect(result).toBeNull();
    else expect(result?.field).toBe('newPassword');
  });
});
