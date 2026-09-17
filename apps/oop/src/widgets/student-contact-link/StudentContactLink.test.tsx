import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_OPEN_CHAT_URL } from '~/shared/config/openChat';

import StudentContactLink from './StudentContactLink';

afterEach(() => vi.unstubAllEnvs());

function renderContact(value?: string) {
  if (value !== undefined) vi.stubEnv('VITE_OPEN_CHAT_URL', value);
  render(
    <AstryxThemeProvider>
      <StudentContactLink />
    </AstryxThemeProvider>,
  );
}

describe('학생 문의 링크', () => {
  it('별도 개발 설정이 없어도 기본 카카오 문의 링크를 연다', () => {
    renderContact();
    expect(screen.getByRole('link', { name: '문의하기' })).toHaveAttribute(
      'href',
      DEFAULT_OPEN_CHAT_URL,
    );
  });

  it.each([
    '',
    '  ',
    'not-a-url',
    'javascript:alert(1)',
    'http://chat.example.com',
    'https://user:password@chat.example.com',
  ])('안전한 HTTPS 설정이 없으면 비활성 문의 텍스트만 표시한다: %s', value => {
    renderContact(value);
    expect(screen.getByText('문의하기')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('설정된 HTTPS 문의 링크를 새 창으로 열고 opener와 referrer를 차단한다', () => {
    renderContact(' https://chat.example.com/invite/course ');
    const link = screen.getByRole('link', { name: '문의하기' });
    expect(link).toHaveAttribute(
      'href',
      'https://chat.example.com/invite/course',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
