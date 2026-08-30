import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import LoginForm from './LoginForm';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../queries/useLoginMutation', () => ({
  useLoginMutation: () => ({
    error: null,
    isError: false,
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

describe('LoginForm', () => {
  it('로그인 폼만 노출하고 개발 계정 안내는 표시하지 않는다', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: '로그인' })).toBeVisible();
    expect(screen.getByLabelText(/학번/)).toBeVisible();
    expect(screen.getByLabelText(/비밀번호/)).toBeVisible();
    expect(screen.getByRole('button', { name: '로그인' })).toBeVisible();
    expect(screen.queryByText('개발용 MSW 계정')).not.toBeInTheDocument();
    expect(screen.queryByText(/oop-demo-/)).not.toBeInTheDocument();
  });

  it('필수 로그인 정보가 비어 있으면 입력 오류를 안내한다', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('학번을 입력해 주세요.')).toBeVisible();
    expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeVisible();
  });
});
