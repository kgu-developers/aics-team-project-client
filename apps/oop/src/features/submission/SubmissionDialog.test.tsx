import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SubmissionDialog from './SubmissionDialog';
import {
  SubmissionDialogProvider,
  useSubmissionDialog,
} from './SubmissionDialogContext';

const submissionPanel = vi.hoisted(() => vi.fn());
const finalPanel = vi.hoisted(() => vi.fn());
vi.mock('./FinalReportSubmissionPanel', () => ({
  default: (props: unknown) => {
    finalPanel(props);
    return <div>실제 최종보고서 폼</div>;
  },
}));

vi.mock('@aics/design-system', async importOriginal => {
  const actual = await importOriginal<typeof import('@aics/design-system')>();
  return {
    ...actual,
    Dialog: ({
      'aria-label': ariaLabel,
      children,
      isOpen,
      onOpenChange,
    }: {
      'aria-label': string;
      children: ReactNode;
      isOpen: boolean;
      onOpenChange: (isOpen: boolean) => void;
    }) =>
      isOpen ? (
        <div aria-label={ariaLabel} role='dialog'>
          {children}
          <button onClick={() => onOpenChange(false)} type='button'>
            닫기
          </button>
        </div>
      ) : null,
  };
});

vi.mock('./SubmissionFilePanel', () => ({
  default: (props: {
    milestoneId: string;
    showCurrentFiles: boolean;
    title: string;
  }) => {
    submissionPanel(props);
    return <div>{props.title}</div>;
  },
}));

function DialogHarness() {
  const { openDialog } = useSubmissionDialog();

  return (
    <>
      <button onClick={() => openDialog('presentation')} type='button'>
        발표 열기
      </button>
      <button onClick={() => openDialog('final-report')} type='button'>
        최종 열기
      </button>
      <SubmissionDialog />
    </>
  );
}

describe('SubmissionDialog', () => {
  beforeEach(() => submissionPanel.mockReset());

  it('발표 자료와 최종보고서 제출을 같은 Dialog 흐름으로 연다', async () => {
    const user = userEvent.setup();
    render(
      <SubmissionDialogProvider>
        <DialogHarness />
      </SubmissionDialogProvider>,
    );

    await user.click(screen.getByRole('button', { name: '발표 열기' }));
    expect(
      screen.getByRole('dialog', { name: '발표 자료 제출' }),
    ).toBeInTheDocument();
    expect(submissionPanel).toHaveBeenLastCalledWith({
      milestoneId: 'presentation',
      showCurrentFiles: false,
      title: '발표 자료 제출',
    });

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('button', { name: '최종 열기' }));
    expect(
      screen.getByRole('dialog', { name: '최종 파일 제출' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('최종보고서 제출 대상을 확인할 수 없어요.'),
    ).toBeInTheDocument();
  });
});

it('선택한 최종보고서의 실제 ID를 기존 다이얼로그에 전달한다', async () => {
  const target = {
    sectionId: '1',
    teamId: '7',
    studentNumber: '20260001',
    milestoneId: '20',
    submissionId: '15',
    type: 'FINAL_REPORT' as const,
    title: '최종 파일 제출',
  };
  function ActualReport() {
    const { openDialog } = useSubmissionDialog();
    return (
      <>
        <button onClick={() => openDialog('final-report', '20')}>
          20번 최종보고서
        </button>
        <SubmissionDialog />
      </>
    );
  }
  render(
    <SubmissionDialogProvider finalReportTargets={{ '20': target }}>
      <ActualReport />
    </SubmissionDialogProvider>,
  );
  await userEvent.click(
    screen.getByRole('button', { name: '20번 최종보고서' }),
  );
  expect(finalPanel).toHaveBeenLastCalledWith({ target });
  expect(
    screen.getByRole('dialog', { name: '최종 파일 제출' }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '닫기' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
