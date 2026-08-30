import type { SectionAnnouncement } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { getStudentNoticeReadStorageKey } from '~/features/student-notices/useStudentNoticeReadState';

import StudentNoticeListPage from './StudentNoticeListPage';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { renderWithRouter } from '~/test/renderWithRouter';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mySectionAnnouncements: SectionAnnouncement[] = [
  {
    id: '1',
    sectionId: 'oop-2026-2-01',
    title: '우리 분반 공지',
    content: '분반 공지 내용',
    createdAt: '2025-12-17 09:00',
    updatedAt: '2025-12-17 09:00',
    authorName: '이은정',
  },
];

const mockSectionAnnouncementsQuery = vi.fn();

vi.mock('~/features/student-notices/queries', () => ({
  useSectionAnnouncementsQuery: (...args: unknown[]) =>
    mockSectionAnnouncementsQuery(...args),
}));

describe('StudentNoticeListPage', () => {
  beforeAll(() => {
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().setCurrentUser(demoStudent);
  });

  afterAll(() => {
    useAuthStore.getState().clearSession();
  });

  beforeEach(() => {
    mockSectionAnnouncementsQuery.mockReset();
    mockNavigate.mockReset();
    window.localStorage.clear();
  });

  it('소속 분반의 공지만 표시한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeListPage />
      </AstryxThemeProvider>,
    );

    expect(screen.getByText('우리 분반 공지')).toBeInTheDocument();

    expect(screen.queryByText('타 분반 공지')).not.toBeInTheDocument();
    expect(screen.getByText('새 글')).toBeInTheDocument();
  });

  it('로컬에 저장된 공지는 새 글로 표시하지 않는다', () => {
    const storageKey = getStudentNoticeReadStorageKey(
      demoStudent.id,
      demoStudent.sections[0]?.id ?? '',
    );
    if (!storageKey) throw new Error('storage key is required');
    window.localStorage.setItem(storageKey, JSON.stringify(['1']));
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeListPage />
      </AstryxThemeProvider>,
    );

    expect(screen.queryByText('새 글')).not.toBeInTheDocument();
  });

  it('소속 분반 ID로 공지 조회를 요청한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeListPage />
      </AstryxThemeProvider>,
    );

    expect(mockSectionAnnouncementsQuery).toHaveBeenCalledWith(
      demoStudent.sections[0]?.id,
    );
  });

  it('반응형 테이블에서 표준 링크와 행 클릭으로 공지 상세를 연다', async () => {
    const user = userEvent.setup();

    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeListPage />
      </AstryxThemeProvider>,
    );

    const titleLink = screen.getByRole('link', { name: '우리 분반 공지' });
    expect(titleLink).toHaveAttribute('href', '/student/notices/1');

    const row = titleLink.closest('tr');
    if (!row) throw new Error('공지사항 테이블 행을 찾을 수 없어요.');
    expect(row).toHaveAttribute('data-student-notice-row');

    await user.click(row);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/student/notices/$noticeId',
      params: { noticeId: '1' },
    });

    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(
      screen.getByRole('columnheader', { name: '작성자' }),
    ).toBeInTheDocument();
  });
});
