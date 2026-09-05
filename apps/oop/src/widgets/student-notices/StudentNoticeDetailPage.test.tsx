import type { SectionResponse, SectionAnnouncement } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { screen, waitFor } from '@testing-library/react';
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

import StudentNoticeDetailPage from './StudentNoticeDetailPage';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { renderWithRouter } from '~/test/renderWithRouter';

const mockMySectionsQuery = vi.hoisted(() => vi.fn());

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
    content: '분반 공지 내용\n두 번째 줄',
    publishedAt: '2025-12-17 09:00',
    attachments: [
      {
        id: 'attachment-image',
        fileName: '일정 이미지.svg',
        contentType: 'image/svg+xml',
        sizeBytes: 12_000,
        url: '/evaluation/cineflow-screen-1.svg',
      },
      {
        id: 'attachment-pdf',
        fileName: '일정 안내.pdf',
        contentType: 'application/pdf',
        sizeBytes: 240_000,
        url: '/evaluation/cineflow-presentation.pdf',
      },
    ],
  },
];

const mockSectionAnnouncementsQuery = vi.fn();

vi.mock('~/features/student-notices/queries', () => ({
  useSectionAnnouncementsQuery: (...args: unknown[]) =>
    mockSectionAnnouncementsQuery(...args),
}));

describe('StudentNoticeDetailPage', () => {
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
    window.localStorage.clear();
  });

  it('공지 제목과 내용을 표시한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeDetailPage noticeId='1' />
      </AstryxThemeProvider>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: '우리 분반 공지' }),
    ).toBeInTheDocument();
    expect(screen.getByText('분반 공지 내용')).toBeInTheDocument();
    expect(screen.getByText('두 번째 줄')).toBeInTheDocument();
  });

  it('게시일과 분반 정보를 표시한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeDetailPage noticeId='1' />
      </AstryxThemeProvider>,
    );

    expect(screen.getByText(/게시일 : 2025-12-17/)).toBeInTheDocument();
    expect(screen.getByText(/분반 :/)).toBeInTheDocument();
  });

  it('이미지 첨부는 본문 하단에 표시하고 모든 첨부파일을 다운로드한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeDetailPage noticeId='1' />
      </AstryxThemeProvider>,
    );

    const downloadLinks = screen.getAllByRole('link', { name: '다운로드' });
    expect(downloadLinks[0]).toHaveAttribute(
      'href',
      '/evaluation/cineflow-screen-1.svg',
    );
    expect(downloadLinks[0]).toHaveAttribute('download', '일정 이미지.svg');

    expect(
      screen.getByRole('region', { name: '첨부 이미지 미리보기' }),
    ).toBeInTheDocument();
    expect(screen.getByAltText('일정 이미지.svg 미리보기')).toHaveAttribute(
      'src',
      '/evaluation/cineflow-screen-1.svg',
    );
    expect(
      screen.queryByAltText('일정 안내.pdf 미리보기'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '미리보기' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: '첨부 이미지 미리보기' }),
    ).not.toBeInTheDocument();
  });

  it('상세를 열면 사용자와 분반별 로컬 읽음 상태를 저장한다', async () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });
    const storageKey = getStudentNoticeReadStorageKey(
      demoStudent.id,
      String(activeSection.id),
    );
    if (!storageKey) throw new Error('storage key is required');

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeDetailPage noticeId='1' />
      </AstryxThemeProvider>,
    );

    await waitFor(() => {
      expect(
        JSON.parse(window.localStorage.getItem(storageKey) ?? '[]'),
      ).toContain('1');
    });
  });

  it('존재하지 않는 공지 ID는 안내 메시지를 표시한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeDetailPage noticeId='999' />
      </AstryxThemeProvider>,
    );

    expect(screen.getByText('공지사항을 찾을 수 없어요.')).toBeInTheDocument();
  });

  it('로딩 중이면 불러오는 중 메시지를 표시한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeDetailPage noticeId='1' />
      </AstryxThemeProvider>,
    );

    expect(screen.getByText('공지사항을 불러오는 중...')).toBeInTheDocument();
  });

  it('에러 발생 시 오류 메시지를 표시한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: undefined,
      error: new Error('fail'),
      isError: true,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeDetailPage noticeId='1' />
      </AstryxThemeProvider>,
    );

    expect(
      screen.getByText('공지사항을 불러오지 못했어요.'),
    ).toBeInTheDocument();
  });

  it('공지사항 경로와 목록으로 돌아가기 링크를 표시한다', () => {
    mockSectionAnnouncementsQuery.mockReturnValue({
      data: mySectionAnnouncements,
      isError: false,
      isPending: false,
    });

    renderWithRouter(
      <AstryxThemeProvider>
        <StudentNoticeDetailPage noticeId='1' />
      </AstryxThemeProvider>,
    );

    expect(
      screen.getByRole('navigation', { name: '공지사항 경로' }),
    ).toBeInTheDocument();
    const breadcrumb = screen.getByRole('navigation', {
      name: '공지사항 경로',
    });
    const backLink = screen.getByRole('link', {
      name: '공지사항 목록으로 돌아가기',
    });

    expect(breadcrumb).toHaveTextContent('공지사항');
    expect(screen.getByText('공지사항')).toHaveAttribute(
      'href',
      expect.stringContaining('/student/notices'),
    );
    expect(backLink).toHaveTextContent('목록으로');
    expect(backLink.parentElement).toContainElement(breadcrumb);
  });
});
