import type {
  AdminPresentationEvaluationCriterionDto,
  AdminPresentationEvaluationRowDto,
} from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
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

function renderResults() {
  const onSelectEvaluator = vi.fn();
  render(
    <AstryxThemeProvider>
      <PresentationEvaluationResults
        criteria={criteria}
        evaluations={evaluations}
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
  it('제출 현황을 유지한 채 평가자 표를 접고 제출 상태로 필터링한다', async () => {
    const user = userEvent.setup();
    const { onSelectEvaluator } = renderResults();

    expect(
      screen.getByText('발표 평가 대상 2명 중 1명 제출'),
    ).toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /평가자별 결과/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('펼치기');
    expect(
      screen.queryByRole('columnheader', { name: '평가자' }),
    ).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveTextContent('접기');

    expect(
      await screen.findByRole('button', { name: '제출 학생' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: '발표 평가 결과 표' }),
    ).toContainElement(screen.getByRole('table'));
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
});
