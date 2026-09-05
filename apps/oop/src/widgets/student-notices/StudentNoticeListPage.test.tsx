import type { SectionResponse, SectionAnnouncement } from '@aics/core';
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
const mockMySectionsQuery = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('~/features/section/queries', () => ({
  useMySectionsQuery: (...args: unknown[]) => mockMySectionsQuery(...args),
}));

const activeSection: SectionResponse = {
  id: 1,
  code: 'CS101',
  name: '01',
  classTime: '월123',
  capacity: 40,
  contactVisibleFrom: null,
  contactVisibleUntil: null,
  courseId: 1,
  courseName: '객체지향프로그래밍',
  year: 2026,
  semester: 'SPRING',
  status: 'ACTIVE',
};

const mySectionAnnouncements: SectionAnnouncement[] = [
  {
    id: 1,
    sectionId: 1,
    title: '우리 분반 공지',
    content: '분반 공지 내용',
    publishedAt: '2025-12-17 09:00',
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
    mockMySectionsQuery.mockReset();
    mockMySectionsQuery.mockReturnValue({
      data: [activeSection],
      error: null,
      isPending: false,
    });
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
      String(activeSection.id),
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
      activeSection.id,
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
      screen.queryByRole('columnheader', { name: '작성자' }),
    ).not.toBeInTheDocument();
  });

  it('활성 분반이 없으면 공지 조회 대신 선행조건 안내를 표시한다', () => {
    mockMySectionsQuery.mockReturnValue({
      data: [],
      error: null,
      isPending: false,
    });
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeListPage />
      </AstryxThemeProvider>,
    );

    expect(screen.getByText('소속 분반이 없어요.')).toBeInTheDocument();
    expect(mockSectionAnnouncementsQuery).toHaveBeenCalledWith(undefined);
  });
});
