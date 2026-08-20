import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import StudentHomeHero from './StudentHomeHero';

import { studentHomeDashboardFixture } from '~/mocks/data/studentHome';

describe('StudentHomeHero', () => {
  it('별도 페이지가 없는 주제 선정 CTA는 진행 상태로 비활성 표시한다', () => {
    render(
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

    render(
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

  it('액션 플랜 탭에 전용 빈 상태 문구를 표시한다', async () => {
    const user = userEvent.setup();

    render(
      <StudentHomeHero
        announcements={studentHomeDashboardFixture.announcements}
        hero={studentHomeDashboardFixture.hero}
      />,
    );

    await user.click(screen.getByRole('tab', { name: '액션 플랜' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      '아직 등록된 액션 플랜이 없어요.',
    );
  });

  it('방향키로 다음 탭을 선택하고 포커스를 이동한다', async () => {
    const user = userEvent.setup();

    render(
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
    render(
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
});
