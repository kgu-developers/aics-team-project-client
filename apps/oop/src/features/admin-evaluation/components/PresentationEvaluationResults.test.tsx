import type {
  AdminPresentationEvaluationCriterionDto,
  AdminPresentationEvaluationRowDto,
} from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import PresentationEvaluationResults from './PresentationEvaluationResults';

const criteria: AdminPresentationEvaluationCriterionDto[] = [
  {
    criterionId: 1,
    displayOrder: 1,
    maxScore: 10,
    title: '프로젝트 완성도',
  },
];

const evaluations: AdminPresentationEvaluationRowDto[] = [
  {
    evaluatorId: '20230001',
    evaluatorName: '제출 학생',
    isSubmitted: true,
    scores: [{ criterionId: 1, criterionTitle: '프로젝트 완성도', score: 9 }],
    submittedAt: '2026-12-01T12:00:00+09:00',
    teamName: '브라보',
    totalScore: 9,
  },
  {
    evaluatorId: '20230002',
    evaluatorName: '미제출 학생',
    isSubmitted: false,
    scores: [],
    submittedAt: null,
    teamName: '찰리',
    totalScore: null,
  },
];

function renderResults(
  resultEvaluations: readonly AdminPresentationEvaluationRowDto[] = evaluations,
) {
  const onSelectEvaluator = vi.fn();
  render(
    <AstryxThemeProvider>
      <PresentationEvaluationResults
        criteria={criteria}
        evaluations={resultEvaluations}
        formatSubmissionStatus={evaluation =>
          evaluation.isSubmitted ? '제출' : '미제출'
        }
        onSelectEvaluator={onSelectEvaluator}
      />
    </AstryxThemeProvider>,
  );
  return { onSelectEvaluator };
}

describe('PresentationEvaluationResults', () => {
  it('제출 현황을 표시하고 평가자 표를 제출 상태로 필터링한다', async () => {
    const user = userEvent.setup();
    const { onSelectEvaluator } = renderResults();

    expect(
      screen.getByText('발표 평가 대상 2명 중 1명 제출'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: '제출 학생' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Table' })).toHaveAttribute(
      'data-aics-table-scroll-wrapper',
    );
    expect(
      screen.getByRole('button', { name: '미제출 학생' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: '제출 상태' }));
    await user.click(await screen.findByRole('option', { name: '제출' }));

    expect(
      screen.getByRole('button', { name: '제출 학생' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '미제출 학생' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '제출 학생' }));
    expect(onSelectEvaluator).toHaveBeenCalledWith('20230001');
  });

  it('평가자 결과를 10명씩 나누고 필터를 바꾸면 첫 페이지를 표시한다', async () => {
    const user = userEvent.setup();
    const pagedEvaluations = Array.from({ length: 11 }, (_, index) => ({
      ...evaluations[0]!,
      evaluatorId: `20230${String(index + 1).padStart(3, '0')}`,
      evaluatorName: `평가자 ${index + 1}`,
    }));

    renderResults(pagedEvaluations);

    expect(
      await screen.findByRole('button', { name: '평가자 1' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '평가자 11' }),
    ).not.toBeInTheDocument();

    const pagination = screen.getByRole('navigation', {
      name: '발표 평가 결과 페이지 이동',
    });
    await user.click(
      within(pagination).getByRole('button', { name: '다음 페이지' }),
    );
    expect(
      await screen.findByRole('button', { name: '평가자 11' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: '제출 상태' }));
    await user.click(await screen.findByRole('option', { name: '제출' }));

    expect(
      screen.getByRole('button', { name: '평가자 1' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '평가자 11' }),
    ).not.toBeInTheDocument();
  });
});
