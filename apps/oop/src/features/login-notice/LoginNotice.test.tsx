import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { loginNotice } from '~/course/loginNotice';

import LoginNotice from './LoginNotice';
import { hideLoginNoticeForWeek, isLoginNoticeHidden } from './noticeDismissal';

const user = {
  id: 'notice-student',
  studentNumber: '20269999',
  name: '안내 테스트 학생',
  email: 'notice@example.com',
  globalRole: 'STUDENT' as const,
  sections: [],
};

function signIn() {
  useAuthStore.getState().markAuthenticated('STUDENT');
  useAuthStore.getState().setCurrentUser(user);
}

beforeEach(() => {
  localStorage.clear();
  useAuthStore.getState().clearSession();
});

afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
});

it('로그인한 학생에게 전달 계획 안내를 표시하고 닫으면 재렌더에서도 닫힌다', async () => {
  signIn();
  const { rerender } = render(<LoginNotice />);
  expect(screen.getByRole('dialog', { name: loginNotice.title })).toBeVisible();
  expect(screen.getByText(loginNotice.message)).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: /^닫기$/ }));
  rerender(<LoginNotice />);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(localStorage.length).toBe(0);
  act(() => useAuthStore.getState().clearSession());
  act(signIn);
  expect(screen.getByRole('dialog', { name: loginNotice.title })).toBeVisible();
});

it('비로그인 또는 운영자에게 공지를 표시하지 않는다', () => {
  const { rerender } = render(<LoginNotice />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  act(() => {
    useAuthStore.getState().markAuthenticated('ADMIN');
    useAuthStore
      .getState()
      .setCurrentUser({ ...user, globalRole: 'PROFESSOR' });
  });
  rerender(<LoginNotice />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('일주일간 안 보기를 누르면 새로 마운트해도 공지가 숨겨진다', async () => {
  signIn();
  const { unmount } = render(<LoginNotice />);
  await userEvent.click(
    screen.getByRole('button', { name: '일주일간 안 보기' }),
  );
  unmount();
  render(<LoginNotice />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('7일 경계부터 다시 표시하며 다른 계정과 공지 버전의 숨김은 적용하지 않는다', () => {
  const now = Date.now();
  hideLoginNoticeForWeek(user.id, now);
  const week = 7 * 24 * 60 * 60 * 1000;
  expect(isLoginNoticeHidden(user.id, now + week - 1)).toBe(true);
  expect(isLoginNoticeHidden(user.id, now + week)).toBe(false);
  expect(isLoginNoticeHidden('other-student', now)).toBe(false);
  localStorage.clear();
  localStorage.setItem(
    `oop:login-notice:${loginNotice.id}:v0:${user.id}`,
    String(now + week),
  );
  expect(isLoginNoticeHidden(user.id, now)).toBe(false);
});

it('손상된 저장값과 스토리지 접근 거부에도 안내를 표시하고 닫을 수 있다', async () => {
  const key = `oop:login-notice:${loginNotice.id}:v${loginNotice.version}:${user.id}`;
  localStorage.setItem(key, 'broken');
  expect(isLoginNoticeHidden(user.id)).toBe(false);
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  signIn();
  render(<LoginNotice />);
  await userEvent.click(
    screen.getByRole('button', { name: '일주일간 안 보기' }),
  );
  expect(screen.getByRole('alert')).toHaveTextContent('저장할 수 없습니다');
  await userEvent.click(screen.getByRole('button', { name: /^닫기$/ }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
});

it('Escape로 닫으면 7일 숨김을 저장하지 않는다', async () => {
  signIn();
  render(<LoginNotice />);
  await userEvent.keyboard('{Escape}');
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(localStorage.length).toBe(0);
});
