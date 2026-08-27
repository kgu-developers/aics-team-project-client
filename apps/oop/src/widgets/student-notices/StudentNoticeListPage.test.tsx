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

  it('공지 제목 링크가 상세 페이지로 이동한다', async () => {
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

    const titleLink = screen.getByText('우리 분반 공지');
    expect(titleLink).toHaveAttribute(
      'href',
      expect.stringContaining('/student/notices/'),
    );

    await user.click(titleLink);

    expect(titleLink).toBeInTheDocument();
  });
});
