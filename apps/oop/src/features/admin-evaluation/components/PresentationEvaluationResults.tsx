import type {
  AdminPresentationEvaluationCriterionDto,
  AdminPresentationEvaluationRowDto,
} from '@aics/api-client';
import {
  Badge,
  Card,
  HStack,
  IconButton,
  proportional,
  Selector,
  Table,
  Text,
} from '@aics/design-system';
import { ArrowDown, ArrowDownUp, ArrowUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import { paginate } from '~/shared/lib/pagination';
import ListPagination from '~/shared/ui/ListPagination/ListPagination';
import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import * as styles from './PresentationEvaluationResults.css';

type SubmissionFilter = 'all' | 'submitted' | 'not-submitted';
type TotalScoreSort = 'ascending' | 'default' | 'descending';

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

function getNextTotalScoreSort(sort: TotalScoreSort): TotalScoreSort {
  switch (sort) {
    case 'default':
      return 'descending';
    case 'descending':
      return 'ascending';
    case 'ascending':
      return 'default';
  }
}

function getTotalScoreSortButton(sort: TotalScoreSort) {
  switch (sort) {
    case 'default':
      return {
        icon: <ArrowDownUp aria-hidden='true' size={16} />,
        label: '총점 높은 순으로 정렬',
      };
    case 'descending':
      return {
        icon: <ArrowDown aria-hidden='true' size={16} />,
        label: '총점 낮은 순으로 정렬',
      };
    case 'ascending':
      return {
        icon: <ArrowUp aria-hidden='true' size={16} />,
        label: '총점 기본순으로 정렬',
      };
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
  const [totalScoreSort, setTotalScoreSort] =
    useState<TotalScoreSort>('default');
  const [page, setPage] = useState(0);
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
  const displayedEvaluations = useMemo(() => {
    if (totalScoreSort === 'default') return filteredEvaluations;

    return [...filteredEvaluations].sort((left, right) => {
      if (left.totalScore == null) return 1;
      if (right.totalScore == null) return -1;
      return totalScoreSort === 'descending'
        ? right.totalScore - left.totalScore
        : left.totalScore - right.totalScore;
    });
  }, [filteredEvaluations, totalScoreSort]);
  const pagedEvaluations = paginate(displayedEvaluations, page);
  const totalScoreSortButton = getTotalScoreSortButton(totalScoreSort);

  if (evaluations.length === 0) {
    return <Text color='secondary'>발표 평가 대상자가 없습니다.</Text>;
  }

  return (
    <div className={styles.content}>
      <div className={styles.toolbar}>
        <Selector
          label='제출 상태'
          onChange={value => {
            setSubmissionFilter(value as SubmissionFilter);
            setPage(0);
          }}
          options={SUBMISSION_FILTER_OPTIONS}
          size='sm'
          value={submissionFilter}
          width={144}
        />
        <Badge
          label={`발표 평가 대상 ${evaluations.length}명 중 ${submittedCount}명 제출`}
          variant={
            submittedCount === evaluations.length ? 'success' : 'neutral'
          }
        />
      </div>
      {filteredEvaluations.length === 0 ? (
        <Text aria-live='polite' className={styles.emptyState}>
          {getEmptyMessage(submissionFilter)}
        </Text>
      ) : (
        <>
          <Card padding={0}>
            <Table
              columns={[
                {
                  align: 'start',
                  header: '평가자',
                  key: 'evaluator',
                  renderCell: evaluation => (
                    <button
                      className={styles.evaluatorButton}
                      onClick={() => onSelectEvaluator(evaluation.evaluatorId)}
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
                  renderCell: (evaluation: AdminPresentationEvaluationRowDto) =>
                    evaluation.scores.find(
                      score => score.criterionId === criterion.criterionId,
                    )?.score ?? '-',
                  width: proportional(1, { minWidth: 130 }),
                })),
                {
                  align: 'center',
                  header: (
                    <HStack align='center' gap={0}>
                      총점
                      <IconButton
                        icon={totalScoreSortButton.icon}
                        label={totalScoreSortButton.label}
                        onClick={() => {
                          setTotalScoreSort(
                            getNextTotalScoreSort(totalScoreSort),
                          );
                          setPage(0);
                        }}
                        size='sm'
                        tooltip={totalScoreSortButton.label}
                        variant='ghost'
                      />
                    </HStack>
                  ),
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
              data={pagedEvaluations.items}
              dividers='rows'
              plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
              verticalAlign='middle'
            />
          </Card>
          <ListPagination
            label='발표 평가 결과 페이지 이동'
            onPageChange={setPage}
            page={pagedEvaluations.page}
            pageCount={pagedEvaluations.pageCount}
          />
        </>
      )}
    </div>
  );
}
