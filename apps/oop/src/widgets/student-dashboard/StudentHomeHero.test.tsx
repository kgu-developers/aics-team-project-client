import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => mockNavigate,
}));

import StudentHomeHero from './StudentHomeHero';

import { getMeetingRecords } from '~/mocks/data/meeting';
import { studentHomeDashboardFixture } from '~/mocks/data/studentHome';
import { demoStudent } from '~/mocks/data/users';
import { renderWithRouter } from '~/test/renderWithRouter';

describe('StudentHomeHero', () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
    window.localStorage.clear();
  });

  it('별도 페이지가 없는 주제 선정 CTA는 진행 상태로 비활성 표시한다', () => {
    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: studentHomeDashboardFixture.hero.ctaLabel,
      }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('커스텀 바로가기 탭을 클릭해서 전환한다', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    await user.click(screen.getByRole('tab', { name: '회의록' }));

    expect(screen.getByRole('tab', { name: '회의록' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      '아직 작성된 회의록이 없어요.',
    );
  });

  it('회의록 바로가기와 작성 CTA를 각각 목록·작성 화면으로 연결한다', async () => {
    const user = userEvent.setup();
    mockNavigate.mockClear();

    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    await user.click(screen.getByRole('tab', { name: '회의록' }));
    await user.click(screen.getByRole('button', { name: '더보기' }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/student/meetings' });

    await user.click(screen.getByRole('button', { name: '회의록 작성' }));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/student/meetings/new',
    });
  });

  it('공지 제목과 더보기를 각각 상세·목록 화면으로 연결한다', async () => {
    const user = userEvent.setup();
    const [announcement] = studentHomeDashboardFixture.announcements;
    if (!announcement) throw new Error('announcement fixture is required');
    mockNavigate.mockClear();

    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    expect(screen.getByText(announcement.title).closest('a')).toHaveAttribute(
      'href',
      `/student/notices/${announcement.id}`,
    );

    await user.click(screen.getByRole('button', { name: '더보기' }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/student/notices' });
  });

  it('읽지 않은 홈 공지에 새 글 상태를 표시한다', () => {
    useAuthStore.getState().setCurrentUser(demoStudent);

    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    expect(screen.getAllByText('새 글')).toHaveLength(3);
  });

  it('액션 플랜 탭에 전용 빈 상태 문구를 표시한다', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    await user.click(screen.getByRole('tab', { name: '액션 플랜' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      '내게 배정된 액션 플랜이 없어요.',
    );
  });

  it('회의록과 내 액션 플랜을 원본 회의록 상세 링크로 표시한다', async () => {
    const user = userEvent.setup();
    const meetingRecord = getMeetingRecords('team-07').find(
      record => record.id === 'meeting-1',
    );
    if (!meetingRecord) throw new Error('meeting fixture is required');

    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        assignedActions={meetingRecord.actions}
        hero={studentHomeDashboardFixture.hero}
        recentMeetingRecords={[meetingRecord]}
      />,
    );

    await user.click(screen.getByRole('tab', { name: '회의록' }));
    expect(
      screen.getByRole('link', { name: /프로젝트 킥오프/ }),
    ).toHaveAttribute('href', '/student/meetings/meeting-1');

    await user.click(screen.getByRole('tab', { name: '액션 플랜' }));
    expect(
      screen.getByRole('link', { name: /도메인 모델 초안 작성/ }),
    ).toHaveAttribute('href', '/student/meetings/meeting-1');
    expect(screen.getByText('담당 OOP 데모 학생 A')).toBeInTheDocument();
  });

  it('홈 공지와 회의록은 각각 최대 3개만 표시한다', async () => {
    const user = userEvent.setup();
    const [baseMeeting] = getMeetingRecords('team-07');
    if (!baseMeeting) throw new Error('meeting fixture is required');
    const meetingRecords = Array.from({ length: 4 }, (_, index) => ({
      ...baseMeeting,
      id: `meeting-limit-${index + 1}`,
      title: index === 3 ? '숨겨질 네 번째 회의록' : `회의록 ${index + 1}`,
    }));
    const hiddenAnnouncement = {
      ...studentHomeDashboardFixture.announcements[0]!,
      id: 'hidden-notice',
      title: '숨겨질 네 번째 공지',
    };

    renderWithRouter(
      <StudentHomeHero
        announcements={[
          ...studentHomeDashboardFixture.announcements,
          hiddenAnnouncement,
        ]}
        hero={studentHomeDashboardFixture.hero}
        recentMeetingRecords={meetingRecords}
      />,
    );

    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(
      screen.queryByText(hiddenAnnouncement.title),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '회의록' }));

    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.queryByText('숨겨질 네 번째 회의록')).not.toBeInTheDocument();
  });

  it('방향키로 다음 탭을 선택하고 포커스를 이동한다', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    const noticeTab = screen.getByRole('tab', { name: '공지사항' });
    noticeTab.focus();
    await user.keyboard('{ArrowRight}');

    const minutesTab = screen.getByRole('tab', { name: '회의록' });
    expect(minutesTab).toHaveFocus();
    expect(minutesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('공지가 없으면 빈 상태를 표시한다', () => {
    renderWithRouter(
      <StudentHomeHero
        announcements={[]}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    expect(screen.getByText('등록된 공지가 없어요.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '더보기' }),
    ).not.toBeInTheDocument();
  });

  it('연결된 CTA를 클릭하면 지정한 경로로 이동한다', async () => {
    const user = userEvent.setup();
    const hero = {
      ...studentHomeDashboardFixture.hero,
      actionTo: '/student/milestones',
    };
    mockNavigate.mockClear();

    renderWithRouter(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={hero}
      />,
    );

    await user.click(screen.getByRole('button', { name: hero.ctaLabel }));

    expect(mockNavigate).toHaveBeenCalledWith({ to: hero.actionTo });
  });
});
