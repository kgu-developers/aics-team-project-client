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
vi.mock('./StudentSubmissionPanel', () => ({
  default: (props: unknown) => {
    submissionPanel(props);
    return <div>실제 제출 폼</div>;
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
    expect(
      screen.getByText('제출 대상을 확인할 수 없어요.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('button', { name: '최종 열기' }));
    expect(
      screen.getByRole('dialog', { name: '최종 파일 제출' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('제출 대상을 확인할 수 없어요.'),
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
    <SubmissionDialogProvider submissionTargets={{ '20': target }}>
      <ActualReport />
    </SubmissionDialogProvider>,
  );
  await userEvent.click(
    screen.getByRole('button', { name: '20번 최종보고서' }),
  );
  expect(submissionPanel).toHaveBeenLastCalledWith({ target });
  expect(
    screen.getByRole('dialog', { name: '최종 파일 제출' }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '닫기' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('발표 종류와 실제 마일스톤 ID가 일치할 때만 폼을 연다', async () => {
  const target = {
    sectionId: '1',
    teamId: '7',
    studentNumber: '20260001',
    milestoneId: '21',
    submissionId: '16',
    type: 'PRESENTATION' as const,
    title: '발표 자료 제출',
  };
  function Harness() {
    const { openDialog } = useSubmissionDialog();
    return (
      <>
        <button onClick={() => openDialog('presentation', '21')}>
          발표 제출
        </button>
        <button onClick={() => openDialog('final-report', '21')}>
          잘못된 종류
        </button>
        <SubmissionDialog />
      </>
    );
  }
  render(
    <SubmissionDialogProvider submissionTargets={{ '21': target }}>
      <Harness />
    </SubmissionDialogProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: '발표 제출' }));
  expect(submissionPanel).toHaveBeenLastCalledWith({ target });
  await userEvent.click(screen.getByRole('button', { name: '닫기' }));
  await userEvent.click(screen.getByRole('button', { name: '잘못된 종류' }));
  expect(screen.getByText('제출 대상을 확인할 수 없어요.')).toBeInTheDocument();
});
