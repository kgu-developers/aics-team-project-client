import type { AdminPeerEvaluationRowDto } from '@aics/api-client';
import {
  Card,
  EmptyState,
  Heading,
  proportional,
  Table,
  Text,
} from '@aics/design-system';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import {
  useAdminPeerEvaluationTeamDetailQuery,
  useAdminPresentationEvaluationTeamDetailQuery,
} from '~/features/admin-evaluation/queries';
import { AdminLinkedMeetingsTable } from '~/features/admin-meeting/components';
import AdminStudentDetailDialog from '~/features/admin-student-team/components/AdminStudentDetailDialog';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminEvaluationDetailPage.css';

function asOptionalPositiveInteger(value: string | number | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function formatDateTime(value: string | null) {
  return value ? formatSeoulDateTime(value) : '-';
}

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

function Meetings({
  records,
}: {
  records: Array<{
    id: number;
    meetingAt: string;
    participantCount: number;
    phase: string;
    title: string;
  }>;
}) {
  if (records.length === 0)
    return <Text className={styles.muted}>연결된 회의록이 없습니다.</Text>;
  return <AdminLinkedMeetingsTable records={records} />;
}

function PeerDetail({
  formId,
  sectionId,
  teamId,
}: {
  formId?: number;
  sectionId: string;
  teamId: number;
}) {
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    string | null
  >(null);
  const query = useAdminPeerEvaluationTeamDetailQuery(sectionId, teamId, {
    formId,
  });
  if (query.isPending)
    return <Text role='status'>상호평가 결과를 불러오는 중입니다.</Text>;
  if (query.isError || !query.data)
    return (
      <EmptyState
        description='잠시 후 다시 시도해 주세요.'
        title='상호평가 결과를 불러오지 못했습니다.'
      />
    );
  const { data } = query;
  return (
    <>
      <div>
        <Heading level={1}>{data.teamName} 상호평가 결과</Heading>
        <Text className={styles.metadata}>
          양식 #{data.formId} · 마감 {formatDateTime(data.closesAt)}
        </Text>
      </div>
      <section className={styles.section}>
        <Heading level={2}>평가 결과</Heading>
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
                      setSelectedEvaluationId(evaluation.evaluatorId)
                    }
                    type='button'
                  >
                    {evaluation.evaluatorName}
                    {evaluation.isLeader ? ' (팀장)' : ''}
                  </button>
                ),
                width: proportional(1, { minWidth: 140 }),
              },
              ...data.members.map(member => ({
                align: 'center' as const,
                header: member.name,
                key: member.userId,
                renderCell: (evaluation: (typeof data.evaluations)[number]) =>
                  evaluation.scores.find(
                    item => item.targetUserId === member.userId,
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
            data={data.evaluations}
            dividers='rows'
            verticalAlign='middle'
          />
        </Card>
      </section>
      <section className={styles.section}>
        <Heading level={2}>관련 회의록</Heading>
        <Meetings records={data.meetingRecords} />
      </section>
      <AdminStudentDetailDialog
        details={
          selectedEvaluationId ? (
            <PeerEvaluationResponses
              evaluation={data.evaluations.find(
                item => item.evaluatorId === selectedEvaluationId,
              )}
            />
          ) : undefined
        }
        studentNumber={selectedEvaluationId}
        onClose={() => setSelectedEvaluationId(null)}
      />
    </>
  );
}

function PresentationDetail({
  milestoneId,
  sectionId,
  teamId,
}: {
  milestoneId?: number;
  sectionId: string;
  teamId: number;
}) {
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string | null>(
    null,
  );
  const query = useAdminPresentationEvaluationTeamDetailQuery(
    sectionId,
    teamId,
    { milestoneId },
  );
  if (query.isPending)
    return <Text role='status'>발표평가 결과를 불러오는 중입니다.</Text>;
  if (query.isError || !query.data)
    return (
      <EmptyState
        description='잠시 후 다시 시도해 주세요.'
        title='발표평가 결과를 불러오지 못했습니다.'
      />
    );
  const { data } = query;
  const criteria = [...data.criteria].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  return (
    <>
      <div>
        <Heading level={1}>{data.teamName} 발표평가 결과</Heading>
        <Text className={styles.metadata}>
          {data.projectTitle ?? '프로젝트 주제 없음'} · 마감{' '}
          {formatDateTime(data.closesAt)}
        </Text>
      </div>
      <section className={styles.section}>
        <Heading level={2}>평가자별 결과</Heading>
        {data.evaluations.length === 0 ? (
          <Text className={styles.muted}>제출된 평가가 없습니다.</Text>
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
                        setSelectedEvaluatorId(evaluation.evaluatorId)
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
                ...criteria.map(criterion => ({
                  align: 'center' as const,
                  header: `${criterion.title} (${criterion.maxScore})`,
                  key: String(criterion.criterionId),
                  renderCell: (evaluation: (typeof data.evaluations)[number]) =>
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
                  renderCell: evaluation =>
                    evaluation.isSubmitted
                      ? formatDateTime(evaluation.submittedAt)
                      : '미제출',
                  width: proportional(1.2, { minWidth: 160 }),
                },
              ]}
              data={data.evaluations}
              dividers='rows'
              verticalAlign='middle'
            />
          </Card>
        )}
      </section>
      <section className={styles.section}>
        <Heading level={2}>관련 회의록</Heading>
        <Meetings records={data.meetingRecords} />
      </section>
      <AdminStudentDetailDialog
        studentNumber={selectedEvaluatorId}
        onClose={() => setSelectedEvaluatorId(null)}
      />
    </>
  );
}

export default function AdminEvaluationDetailPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const { evaluationType, teamId: rawTeamId } = useParams({
    from: '/admin/evaluations/$evaluationType/teams/$teamId',
  });
  const search = useSearch({
    from: '/admin/evaluations/$evaluationType/teams/$teamId',
  }) as {
    formId?: number | string;
    milestoneId?: number | string;
    sectionId?: string;
  };
  const teamId = asOptionalPositiveInteger(rawTeamId);
  const isAccessibleSection = Boolean(
    search.sectionId &&
    currentUser?.sections.some(section => section.id === search.sectionId),
  );
  const isValidType =
    evaluationType === 'peer' || evaluationType === 'presentation';
  return (
    <main className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>
          {evaluationType === 'peer'
            ? '상호평가 상세보기'
            : '발표평가 상세보기'}
        </Heading>
        <Link
          className={styles.backLink}
          search={{
            milestoneId:
              evaluationType === 'presentation'
                ? 'presentation-evaluate'
                : 'peer-review',
            sectionId: search.sectionId,
          }}
          to={ROUTES.ADMIN_SUBMISSIONS}
        >
          ←{' '}
          {evaluationType === 'peer'
            ? '상호평가 목록으로'
            : '발표 평가 목록으로'}
        </Link>
      </div>
      {!isValidType || !teamId ? (
        <EmptyState
          description='올바른 평가 결과 주소인지 확인해 주세요.'
          title='평가 결과를 찾을 수 없습니다.'
        />
      ) : !isAccessibleSection || !search.sectionId ? (
        <EmptyState
          description='담당 분반의 평가 결과만 조회할 수 있습니다.'
          title='접근할 수 없는 분반입니다.'
        />
      ) : evaluationType === 'peer' ? (
        <PeerDetail
          formId={asOptionalPositiveInteger(search.formId)}
          sectionId={search.sectionId}
          teamId={teamId}
        />
      ) : (
        <PresentationDetail
          milestoneId={asOptionalPositiveInteger(search.milestoneId)}
          sectionId={search.sectionId}
          teamId={teamId}
        />
      )}
    </main>
  );
}
