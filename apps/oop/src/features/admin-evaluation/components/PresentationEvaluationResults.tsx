import type {
  AdminPresentationEvaluationCriterionDto,
  AdminPresentationEvaluationRowDto,
} from '@aics/api-client';
import {
  Badge,
  Card,
  Collapsible,
  proportional,
  Selector,
  Table,
  Text,
} from '@aics/design-system';
import type { TableProps } from '@aics/design-system';
import { useMemo, useState } from 'react';

import * as styles from './PresentationEvaluationResults.css';

type SubmissionFilter = 'all' | 'submitted' | 'not-submitted';

const SUBMISSION_FILTER_OPTIONS: Array<{
  label: string;
  value: SubmissionFilter;
}> = [
  { label: '전체', value: 'all' },
  { label: '제출', value: 'submitted' },
  { label: '미제출', value: 'not-submitted' },
];

function getEmptyMessage(filter: SubmissionFilter) {
  switch (filter) {
    case 'submitted':
      return '제출한 평가자가 없습니다.';
    case 'not-submitted':
      return '미제출 평가자가 없습니다.';
    default:
      return '발표 평가 대상자가 없습니다.';
  }
}

type PresentationEvaluationResultsProps = {
  criteria: readonly AdminPresentationEvaluationCriterionDto[];
  evaluations: readonly AdminPresentationEvaluationRowDto[];
  formatSubmissionStatus: (
    evaluation: AdminPresentationEvaluationRowDto,
  ) => string;
  onSelectEvaluator: (evaluatorId: string) => void;
};

type PresentationResultTableScrollWrapper = NonNullable<
  TableProps<AdminPresentationEvaluationRowDto>['scrollWrapper']
>;

/**
 * Astryx 기본 wrapper는 접힌 Collapsible에서 측정한 상태를 스크롤바로 남길 수
 * 있다. 이 표는 측정 상태에 의존하지 않는 단일 native wrapper를 사용한다.
 */
const PresentationResultTableScrollWrapper: PresentationResultTableScrollWrapper =
  // eslint-disable-next-line react/prop-types -- Astryx invokes this typed Table render callback; the rule cannot infer its generic props.
  ({ afterTable, beforeTable, children, htmlProps, xstyle }) => {
    // This screen does not install StyleX-based table wrapper plugins. Keep the
    // public wrapper contract explicit rather than forwarding xstyle to the DOM.
    void xstyle;
    const { className, ...restHtmlProps } = htmlProps ?? {};

    return (
      <div
        {...restHtmlProps}
        aria-label='발표 평가 결과 표'
        className={[className, styles.tableScrollViewport]
          .filter(Boolean)
          .join(' ')}
        role='region'
      >
        {beforeTable}
        {children}
        {afterTable}
      </div>
    );
  };

/**
 * 두 관리자 화면에서 같은 발표 평가 대상·제출 상태 기준을 보여준다.
 * API 응답을 다시 요청하거나 변경하지 않고, 받은 대상 목록만 필터링한다.
 */
export default function PresentationEvaluationResults({
  criteria,
  evaluations,
  formatSubmissionStatus,
  onSelectEvaluator,
}: PresentationEvaluationResultsProps) {
  const [submissionFilter, setSubmissionFilter] =
    useState<SubmissionFilter>('all');
  const [isOpen, setIsOpen] = useState(false);
  const submittedCount = evaluations.filter(
    evaluation => evaluation.isSubmitted,
  ).length;
  const sortedCriteria = useMemo(
    () => [...criteria].sort((a, b) => a.displayOrder - b.displayOrder),
    [criteria],
  );
  const filteredEvaluations = useMemo<
    AdminPresentationEvaluationRowDto[]
  >(() => {
    if (submissionFilter === 'submitted') {
      return evaluations.filter(evaluation => evaluation.isSubmitted);
    }
    if (submissionFilter === 'not-submitted') {
      return evaluations.filter(evaluation => !evaluation.isSubmitted);
    }
    return [...evaluations];
  }, [evaluations, submissionFilter]);

  if (evaluations.length === 0) {
    return <Text color='secondary'>발표 평가 대상자가 없습니다.</Text>;
  }

  return (
    <Card>
      <Collapsible
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <div className={styles.trigger}>
            <div className={styles.triggerCopy}>
              <Text weight='semibold'>평가자별 결과</Text>
              <Text color='secondary' type='supporting'>
                수강생 평가자 {evaluations.length}명
              </Text>
            </div>
            <div className={styles.triggerActions}>
              <Badge
                label={`발표 평가 대상 ${evaluations.length}명 중 ${submittedCount}명 제출`}
                variant={
                  submittedCount === evaluations.length ? 'success' : 'neutral'
                }
              />
              <Text color='secondary' type='supporting'>
                {isOpen ? '접기' : '펼치기'}
              </Text>
            </div>
          </div>
        }
      >
        {isOpen ? (
          <div className={styles.content}>
            <div className={styles.filterRow}>
              <Selector
                label='제출 상태'
                onChange={value =>
                  setSubmissionFilter(value as SubmissionFilter)
                }
                options={SUBMISSION_FILTER_OPTIONS}
                size='sm'
                value={submissionFilter}
                width={144}
              />
            </div>
            {filteredEvaluations.length === 0 ? (
              <Text aria-live='polite' className={styles.emptyState}>
                {getEmptyMessage(submissionFilter)}
              </Text>
            ) : (
              <Table
                columns={[
                  {
                    align: 'start',
                    header: '평가자',
                    key: 'evaluator',
                    renderCell: evaluation => (
                      <button
                        className={styles.evaluatorButton}
                        onClick={() =>
                          onSelectEvaluator(evaluation.evaluatorId)
                        }
                        type='button'
                      >
                        {evaluation.evaluatorName}
                      </button>
                    ),
                    width: proportional(1, { minWidth: 120 }),
                  },
                  {
                    align: 'start',
                    header: '소속 팀',
                    key: 'teamName',
                    renderCell: evaluation => evaluation.teamName,
                    width: proportional(1.2, { minWidth: 140 }),
                  },
                  ...sortedCriteria.map(criterion => ({
                    align: 'center' as const,
                    header: `${criterion.title} (${criterion.maxScore})`,
                    key: String(criterion.criterionId),
                    renderCell: (
                      evaluation: AdminPresentationEvaluationRowDto,
                    ) =>
                      evaluation.scores.find(
                        score => score.criterionId === criterion.criterionId,
                      )?.score ?? '-',
                    width: proportional(1, { minWidth: 130 }),
                  })),
                  {
                    align: 'center',
                    header: '총점',
                    key: 'total',
                    renderCell: evaluation => evaluation.totalScore ?? '-',
                    width: proportional(0.7, { minWidth: 80 }),
                  },
                  {
                    align: 'center',
                    header: '제출 상태',
                    key: 'submitted',
                    renderCell: formatSubmissionStatus,
                    width: proportional(1.2, { minWidth: 160 }),
                  },
                ]}
                data={filteredEvaluations}
                dividers='rows'
                scrollWrapper={PresentationResultTableScrollWrapper}
                verticalAlign='middle'
              />
            )}
          </div>
        ) : null}
      </Collapsible>
    </Card>
  );
}
