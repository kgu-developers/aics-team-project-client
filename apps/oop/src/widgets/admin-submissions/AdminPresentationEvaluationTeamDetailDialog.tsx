import {
  Button,
  Dialog,
  Heading,
  Table,
  Text,
  VStack,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import { useAdminPresentationEvaluationTeamQuery } from '~/features/admin-milestone-review/queries';

import * as styles from './AdminPresentationEvaluationSettingsDialog.css';

type Props = {
  isOpen: boolean;
  milestoneId: string | undefined;
  onClose: () => void;
  sectionId: string;
  teamId: number | undefined;
};

export function AdminPresentationEvaluationTeamDetailDialog({
  isOpen,
  milestoneId,
  onClose,
  sectionId,
  teamId,
}: Props) {
  const query = useAdminPresentationEvaluationTeamQuery(
    sectionId,
    isOpen ? teamId : undefined,
    milestoneId,
  );
  const detail = query.data;

  return (
    <Dialog
      aria-label='팀 발표 평가 결과 상세'
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) onClose();
      }}
      purpose='info'
      width={760}
    >
      <VStack className={styles.content} gap={4}>
        {query.isPending ? (
          <Text aria-live='polite' role='status'>
            팀 발표 평가 결과를 불러오는 중입니다.
          </Text>
        ) : query.isError ? (
          <VStack gap={2}>
            <Heading level={2}>
              팀 발표 평가 결과를 불러오지 못했습니다.
            </Heading>
            <Text>잠시 후 다시 시도해 주세요.</Text>
            <Button
              label='다시 시도'
              onClick={() => void query.refetch()}
              type='button'
              variant='secondary'
            />
          </VStack>
        ) : detail ? (
          <>
            <Heading level={2}>{detail.teamName} 발표 평가 결과</Heading>
            <Text color='secondary'>
              프로젝트 주제: {detail.projectTitle ?? '-'}
            </Text>
            <Heading level={3}>평가자별 결과</Heading>
            <Table
              columns={[
                {
                  header: '평가자',
                  key: 'evaluatorName',
                  renderCell: evaluation => evaluation.evaluatorName,
                },
                {
                  header: '평가 팀',
                  key: 'teamName',
                  renderCell: evaluation => evaluation.teamName,
                },
                ...detail.criteria
                  .slice()
                  .sort((left, right) => left.displayOrder - right.displayOrder)
                  .map(criterion => ({
                    align: 'center' as const,
                    header: criterion.title,
                    key: String(criterion.criterionId),
                    renderCell: (
                      evaluation: (typeof detail.evaluations)[number],
                    ) =>
                      evaluation.scores.find(
                        score => score.criterionId === criterion.criterionId,
                      )?.score ?? '-',
                  })),
                {
                  align: 'center' as const,
                  header: '합계',
                  key: 'totalScore',
                  renderCell: evaluation => evaluation.totalScore ?? '-',
                },
                {
                  align: 'center' as const,
                  header: '제출 상태',
                  key: 'isSubmitted',
                  renderCell: evaluation =>
                    evaluation.isSubmitted ? '제출' : '미제출',
                },
              ]}
              data={detail.evaluations}
              dividers='rows'
              textOverflow='wrap'
              verticalAlign='middle'
            />
            <Heading level={3}>팀 회의록</Heading>
            {detail.meetingRecords.length === 0 ? (
              <Text color='secondary'>연결된 회의록이 없습니다.</Text>
            ) : (
              <VStack gap={1}>
                {detail.meetingRecords.map(record => (
                  <Link
                    className={styles.meetingLink}
                    key={record.id}
                    params={{ meetingId: String(record.id) }}
                    to={ROUTES.ADMIN_MEETING_DETAIL}
                  >
                    {record.title} · {record.phase} ·{' '}
                    {formatSeoulDateTime(record.meetingAt)} · 참가자{' '}
                    {record.participantCount}명
                  </Link>
                ))}
              </VStack>
            )}
          </>
        ) : null}
        <div className={styles.dialogActions}>
          <Button
            className={styles.closeButton}
            label='닫기'
            onClick={onClose}
            type='button'
            variant='secondary'
          />
        </div>
      </VStack>
    </Dialog>
  );
}
