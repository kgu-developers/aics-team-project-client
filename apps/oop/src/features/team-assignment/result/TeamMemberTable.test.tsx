import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TeamMemberTable } from './TeamMemberTable';
import * as styles from './TeamMemberTable.css';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: '',
    onchange: null,
    removeEventListener: vi.fn(),
  })),
});

describe('TeamMemberTable', () => {
  it('첫 만남 연락처를 클릭하면 휴대폰 번호를 복사한다', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    render(
      <AstryxThemeProvider>
        <ToastViewport>
          <TeamMemberTable
            members={[
              {
                department: '컴퓨터공학과',
                id: 'student-1',
                name: '한가온',
                phoneNumber: '010-1234-5678',
                studentNumber: '20261001',
              },
            ]}
            variant='firstMeeting'
          />
        </ToastViewport>
      </AstryxThemeProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: '010-1234-5678 복사' }),
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('010-1234-5678');
    });
  });

  it('학과 정보가 한 명도 없으면 학과 열을 표시하지 않는다', () => {
    render(
      <AstryxThemeProvider>
        <TeamMemberTable
          members={[
            { id: 'student-1', name: '한가온', studentNumber: '20261001' },
            { id: 'student-2', name: '김경기', studentNumber: '20261002' },
          ]}
          variant='assignment'
        />
      </AstryxThemeProvider>,
    );

    expect(
      screen.queryByRole('columnheader', { name: '학과' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('학과 미정')).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '학번' })).toBeVisible();
  });

  it('학과 없는 결과 단계에서도 팀원 이름과 학번을 표시하고 연락처는 숨긴다', () => {
    render(
      <AstryxThemeProvider>
        <TeamMemberTable
          members={[
            {
              id: 'student-1',
              name: '한가온',
              phoneNumber: '010-1234-5678',
              studentNumber: '20261001',
            },
          ]}
          variant='assignment'
        />
      </AstryxThemeProvider>,
    );

    const row = screen.getByRole('cell', { name: '한가온' }).closest('tr');
    const responsiveWrapper = screen
      .getByRole('table')
      .closest(`.${styles.table}`);

    expect(row).not.toBeNull();
    expect(responsiveWrapper).not.toHaveClass(styles.hideDepartmentOnMobile);
    expect(within(row!).getByText('한가온')).toBeVisible();
    expect(within(row!).getByText('20261001')).toBeVisible();
    expect(screen.queryByText('010-1234-5678')).not.toBeInTheDocument();
  });

  it('학과 정보가 일부라도 있으면 열을 표시하고 빈 값은 미정으로 보여 준다', () => {
    render(
      <AstryxThemeProvider>
        <TeamMemberTable
          members={[
            {
              department: '컴퓨터공학부',
              id: 'student-1',
              name: '한가온',
              studentNumber: '20261001',
            },
            { id: 'student-2', name: '김경기', studentNumber: '20261002' },
          ]}
          variant='assignment'
        />
      </AstryxThemeProvider>,
    );

    expect(screen.getByRole('columnheader', { name: '학과' })).toBeVisible();
    expect(screen.getByText('컴퓨터공학부')).toBeVisible();
    expect(screen.getByText('학과 미정')).toBeVisible();
  });

  it('휴대폰 번호가 없으면 복사 버튼 대신 미등록 상태를 표시한다', () => {
    render(
      <AstryxThemeProvider>
        <TeamMemberTable
          members={[
            {
              department: '컴퓨터공학과',
              id: 'student-1',
              name: '한가온',
              studentNumber: '20261001',
            },
          ]}
          variant='firstMeeting'
        />
      </AstryxThemeProvider>,
    );

    expect(screen.getByText('연락처 미등록')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /복사/ })).toBeNull();
  });

  it('Clipboard API가 실패하면 선택 영역 복사 방식으로 대체한다', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
      new DOMException('Clipboard API is unavailable'),
    );
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    render(
      <AstryxThemeProvider>
        <ToastViewport>
          <TeamMemberTable
            members={[
              {
                department: '컴퓨터공학과',
                id: 'student-1',
                name: '한가온',
                phoneNumber: '010-1234-5678',
                studentNumber: '20261001',
              },
            ]}
            variant='firstMeeting'
          />
        </ToastViewport>
      </AstryxThemeProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: '010-1234-5678 복사' }),
    );

    await waitFor(() => {
      expect(execCommand).toHaveBeenCalledWith('copy');
    });
  });
});
