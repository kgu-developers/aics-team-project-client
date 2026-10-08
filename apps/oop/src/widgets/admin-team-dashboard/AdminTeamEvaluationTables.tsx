import type { AdminPeerEvaluationRowDto } from '@aics/api-client';
import {
  Card,
  EmptyState,
  Heading,
  proportional,
  Table,
  Text,
} from '@aics/design-system';
import { useState } from 'react';

import PresentationEvaluationResults from '~/features/admin-evaluation/components/PresentationEvaluationResults';
import {
  useAdminPeerEvaluationTeamDetailQuery,
  useAdminPeerEvaluationsQuery,
  useAdminPresentationEvaluationTeamDetailQuery,
  useAdminPresentationEvaluationsQuery,
} from '~/features/admin-evaluation/queries';
import AdminStudentDetailDialog from '~/features/admin-student-team/components/AdminStudentDetailDialog';

import * as styles from './AdminTeamEvaluationTables.css';

type Props = {
  sectionId: string;
  teamId: string;
};

function PeerEvaluationResponses({
  evaluation,
}: {
  evaluation: AdminPeerEvaluationRowDto | undefined;
}) {
  if (!evaluation) return null;

  return (
    <section className={styles.responseGrid}>
      <Text className={styles.responseTitle}>본인 기여도</Text>
      <Text>{evaluation.selfContribution ?? '-'}</Text>
      <Text className={styles.responseTitle}>프로젝트 총평</Text>
      <Text>{evaluation.projectReviewComment ?? '-'}</Text>
      <Text className={styles.responseTitle}>개인 회고</Text>
      <Text>{evaluation.reflectionComment ?? '-'}</Text>
      {evaluation.teammateAssessments.map(assessment => (
        <div className={styles.peerResponseGroup} key={assessment.targetUserId}>
          <Text className={styles.responseTitle}>
            {assessment.targetUserName} 평가
          </Text>
          <div className={styles.peerResponseBody}>
            <Text>기여 내용: {assessment.contributionDetail ?? '-'}</Text>
            <Text>평가: {assessment.teammateAssessment ?? '-'}</Text>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function AdminTeamEvaluationTables({
  sectionId,
  teamId,
}: Props) {
  const numericTeamId = Number(teamId);
  const [selectedPeerEvaluatorId, setSelectedPeerEvaluatorId] = useState<
    string | null
  >(null);
  const [selectedPresentationEvaluatorId, setSelectedPresentationEvaluatorId] =
    useState<string | null>(null);
  const peerListQuery = useAdminPeerEvaluationsQuery(sectionId);
  const presentationListQuery = useAdminPresentationEvaluationsQuery(sectionId);
  const peerFormId = peerListQuery.data?.formId ?? undefined;
  const presentationMilestoneId =
    presentationListQuery.data?.milestoneId ?? undefined;
  const hasPeerTeam = Boolean(
    peerListQuery.data?.teams.some(team => team.teamId === numericTeamId),
  );
  const hasPresentationTeam = Boolean(
    presentationListQuery.data?.teams.some(
      team => team.teamId === numericTeamId,
    ),
  );
  const peerQuery = useAdminPeerEvaluationTeamDetailQuery(
    sectionId,
    peerFormId && hasPeerTeam ? numericTeamId : undefined,
    { formId: peerFormId },
  );
  const presentationQuery = useAdminPresentationEvaluationTeamDetailQuery(
    sectionId,
    presentationMilestoneId && hasPresentationTeam ? numericTeamId : undefined,
    { milestoneId: presentationMilestoneId },
  );

  return (
    <section aria-label='팀 평가 결과' className={styles.root}>
      <section className={styles.section}>
        <Heading level={2}>발표 평가</Heading>
        {presentationListQuery.isPending ? (
          <Text role='status'>발표평가 목록을 불러오는 중입니다.</Text>
        ) : presentationListQuery.isError ? (
          <EmptyState
            description='잠시 후 다시 시도해 주세요.'
            title='발표평가 목록을 불러오지 못했습니다.'
          />
        ) : !presentationMilestoneId || !hasPresentationTeam ? (
          <Text>설정된 발표평가 결과가 없습니다.</Text>
        ) : presentationQuery.isPending ? (
          <Text role='status'>발표평가 결과를 불러오는 중입니다.</Text>
        ) : presentationQuery.isError || !presentationQuery.data ? (
          <EmptyState
            description='잠시 후 다시 시도해 주세요.'
            title='발표평가 결과를 불러오지 못했습니다.'
          />
        ) : (
          <PresentationEvaluationResults
            criteria={presentationQuery.data.criteria}
            evaluations={presentationQuery.data.evaluations}
            formatSubmissionStatus={evaluation =>
              evaluation.isSubmitted ? '제출' : '미제출'
            }
            onSelectEvaluator={setSelectedPresentationEvaluatorId}
          />
        )}
      </section>

      <section className={styles.section}>
        <Heading level={2}>상호평가</Heading>
        {peerListQuery.isPending ? (
          <Text role='status'>상호평가 목록을 불러오는 중입니다.</Text>
        ) : peerListQuery.isError ? (
          <EmptyState
            description='잠시 후 다시 시도해 주세요.'
            title='상호평가 목록을 불러오지 못했습니다.'
          />
        ) : !peerFormId || !hasPeerTeam ? (
          <Text>설정된 상호평가 결과가 없습니다.</Text>
        ) : peerQuery.isPending ? (
          <Text role='status'>상호평가 결과를 불러오는 중입니다.</Text>
        ) : peerQuery.isError || !peerQuery.data ? (
          <EmptyState
            description='잠시 후 다시 시도해 주세요.'
            title='상호평가 결과를 불러오지 못했습니다.'
          />
        ) : (
          <Card>
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
                        setSelectedPeerEvaluatorId(evaluation.evaluatorId)
                      }
                      type='button'
                    >
                      {evaluation.evaluatorName}
                      {evaluation.isLeader ? ' (팀장)' : ''}
                    </button>
                  ),
                  width: proportional(1, { minWidth: 140 }),
                },
                ...peerQuery.data.members.map(member => ({
                  align: 'center' as const,
                  header: member.name,
                  key: member.userId,
                  renderCell: (
                    evaluation: (typeof peerQuery.data.evaluations)[number],
                  ) =>
                    evaluation.scores.find(
                      score => score.targetUserId === member.userId,
                    )?.contributionPercent ?? '-',
                  width: proportional(1, { minWidth: 110 }),
                })),
                {
                  align: 'center',
                  header: '평균',
                  key: 'average',
                  renderCell: evaluation => evaluation.averageScore ?? '-',
                  width: proportional(0.7, { minWidth: 84 }),
                },
              ]}
              data={peerQuery.data.evaluations}
              dividers='rows'
              emptyState={
                <span className={styles.emptyCell}>
                  제출된 상호평가가 없습니다.
                </span>
              }
              verticalAlign='middle'
            />
          </Card>
        )}
      </section>
      <AdminStudentDetailDialog
        studentNumber={selectedPresentationEvaluatorId}
        onClose={() => setSelectedPresentationEvaluatorId(null)}
      />
      <AdminStudentDetailDialog
        details={
          selectedPeerEvaluatorId ? (
            <PeerEvaluationResponses
              evaluation={peerQuery.data?.evaluations.find(
                evaluation =>
                  evaluation.evaluatorId === selectedPeerEvaluatorId,
              )}
            />
          ) : undefined
        }
        studentNumber={selectedPeerEvaluatorId}
        onClose={() => setSelectedPeerEvaluatorId(null)}
      />
    </section>
  );
}
