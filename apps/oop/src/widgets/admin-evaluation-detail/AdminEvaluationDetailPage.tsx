import type { AdminPeerEvaluationRowDto } from '@aics/api-client';
import {
  Badge,
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

import { formatCourseScheduleDateTime } from '~/shared/lib/formatCourseScheduleDateTime';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import {
  useAdminPeerEvaluationTeamDetailQuery,
  useAdminPresentationEvaluationTeamDetailQuery,
} from '~/features/admin-evaluation/queries';
import { AdminLinkedMeetingsTable } from '~/features/admin-meeting/components';
import { useAdminProfessorPresentationEvaluationQuery } from '~/features/admin-milestone-review/queries';
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

function formatProfessorSavedAt(value: string | null) {
  return value ? formatCourseScheduleDateTime(value) : '-';
}

function EvaluationTitle({
  evaluationType,
  sectionId,
  title,
}: {
  evaluationType: 'peer' | 'presentation';
  sectionId: string;
  title: string;
}) {
  return (
    <div className={styles.titleRow}>
      <Heading level={1}>{title}</Heading>
      <Link
        className={styles.backLink}
        search={{
          milestoneId:
            evaluationType === 'presentation'
              ? 'presentation-evaluate'
              : 'peer-review',
          sectionId,
        }}
        to={ROUTES.ADMIN_SUBMISSIONS}
      >
        ←{' '}
        {evaluationType === 'peer' ? '상호평가 목록으로' : '발표 평가 목록으로'}
      </Link>
    </div>
  );
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

function PeerEvaluationOverview({
  evaluations,
  members,
}: {
  evaluations: AdminPeerEvaluationRowDto[];
  members: Array<{
    averageReceivedScore: number | null;
    isLeader: boolean;
    name: string;
    role: string | null;
    userId: string;
  }>;
}) {
  const submittedCount = evaluations.filter(
    evaluation => evaluation.status === 'SUBMITTED',
  ).length;

  return (
    <Card className={styles.peerOverview}>
      <div className={styles.overviewHeader}>
        <div>
          <Text className={styles.eyebrow}>상호평가 진행 현황</Text>
          <Heading level={2}>팀원 기여도 요약</Heading>
        </div>
        <Badge
          label={`${submittedCount}/${members.length}명 제출`}
          variant={
            members.length > 0 && submittedCount === members.length
              ? 'success'
              : 'neutral'
          }
        />
      </div>
      <Text className={styles.muted} type='supporting'>
        제출한 팀원별 응답과 팀원별 받은 기여도 평균을 확인할 수 있습니다.
      </Text>
      <div className={styles.memberSummaryGrid}>
        {members.map(member => (
          <article
            aria-label={`${member.name} 기여도 요약`}
            className={styles.memberSummaryCard}
            key={member.userId}
          >
            <div className={styles.memberSummaryHeader}>
              <div className={styles.memberIdentity}>
                <Text weight='semibold'>{member.name}</Text>
                {member.role && !(member.isLeader && member.role === '팀장') ? (
                  <Text color='secondary' type='supporting'>
                    {member.role}
                  </Text>
                ) : null}
              </div>
              {member.isLeader ? (
                <Badge label='팀장' variant='neutral' />
              ) : null}
            </div>
            <Text color='secondary' type='supporting'>
              받은 기여도 평균
            </Text>
            <Text className={styles.averageScore}>
              {member.averageReceivedScore == null
                ? '집계 전'
                : `${member.averageReceivedScore}%`}
            </Text>
          </article>
        ))}
      </div>
    </Card>
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
      <>
        <EvaluationTitle
          evaluationType='peer'
          sectionId={sectionId}
          title='상호평가 상세보기'
        />
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='상호평가 결과를 불러오지 못했습니다.'
        />
      </>
    );
  const { data } = query;
  return (
    <>
      <div className={styles.titleSection}>
        <EvaluationTitle
          evaluationType='peer'
          sectionId={sectionId}
          title={`${data.teamName} 상호평가 결과`}
        />
        <Text className={styles.metadata}>
          양식 #{data.formId} · 마감 {formatDateTime(data.closesAt)}
        </Text>
      </div>
      <section className={styles.section}>
        <PeerEvaluationOverview
          evaluations={data.evaluations}
          members={data.members}
        />
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <Heading level={2}>평가자별 응답</Heading>
            <Text color='secondary' type='supporting'>
              평가자 이름을 누르면 학생이 작성한 프로젝트 평가와 팀원 평가를
              확인할 수 있습니다.
            </Text>
          </div>
        </div>
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
                renderCell: (evaluation: (typeof data.evaluations)[number]) => {
                  const score = evaluation.scores.find(
                    item => item.targetUserId === member.userId,
                  )?.contributionPercent;
                  return score == null ? '-' : `${score}%`;
                },
                width: proportional(1, { minWidth: 110 }),
              })),
              {
                align: 'center',
                header: '제출 상태',
                key: 'status',
                renderCell: evaluation => (
                  <Badge
                    label={
                      evaluation.status === 'SUBMITTED' ? '제출 완료' : '초안'
                    }
                    variant={
                      evaluation.status === 'SUBMITTED' ? 'success' : 'neutral'
                    }
                  />
                ),
                width: proportional(0.9, { minWidth: 104 }),
              },
              {
                align: 'center',
                header: '평균',
                key: 'average',
                renderCell: evaluation =>
                  evaluation.averageScore == null
                    ? '-'
                    : `${evaluation.averageScore}%`,
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
  const currentUser = useAuthStore(state => state.currentUser);
  const canViewProfessorEvaluation =
    currentUser?.globalRole === 'PROFESSOR' &&
    currentUser.sections.some(
      section =>
        String(section.id) === sectionId && section.role === 'PROFESSOR',
    );
  const query = useAdminPresentationEvaluationTeamDetailQuery(
    sectionId,
    teamId,
    { milestoneId },
  );
  const professorEvaluationQuery = useAdminProfessorPresentationEvaluationQuery(
    sectionId,
    milestoneId?.toString(),
    teamId.toString(),
    Boolean(milestoneId && canViewProfessorEvaluation),
  );
  if (query.isPending)
    return <Text role='status'>발표평가 결과를 불러오는 중입니다.</Text>;
  if (query.isError || !query.data)
    return (
      <>
        <EvaluationTitle
          evaluationType='presentation'
          sectionId={sectionId}
          title='발표평가 상세보기'
        />
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='발표평가 결과를 불러오지 못했습니다.'
        />
      </>
    );
  const { data } = query;
  const criteria = [...data.criteria].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  return (
    <>
      <div className={styles.titleSection}>
        <EvaluationTitle
          evaluationType='presentation'
          sectionId={sectionId}
          title={`${data.teamName} 발표평가 결과`}
        />
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
        <Heading level={2}>교수자 평가</Heading>
        <Text className={styles.muted} type='supporting'>
          교수자 점수는 학생 평가 평균에 포함되지 않으며, 교수자 메모는 학생에게
          공개되지 않습니다.
        </Text>
        {!canViewProfessorEvaluation ? (
          <Text className={styles.muted}>
            교수자 평가와 메모는 담당 교수만 조회할 수 있습니다.
          </Text>
        ) : !milestoneId ? (
          <Text className={styles.muted}>
            발표 마일스톤 정보가 없어 교수자 평가를 조회할 수 없습니다.
          </Text>
        ) : professorEvaluationQuery.isPending ? (
          <Text role='status'>교수자 평가를 불러오는 중입니다.</Text>
        ) : professorEvaluationQuery.isError ||
          !professorEvaluationQuery.data ? (
          <Text role='alert'>교수자 평가를 불러오지 못했습니다.</Text>
        ) : (
          <Card className={styles.evaluationCard}>
            <div className={styles.responseGrid}>
              <Text className={styles.responseTitle}>평가자</Text>
              <Text>담당 교수</Text>
              {professorEvaluationQuery.data.scores.map(score => (
                <div
                  className={styles.peerResponseGroup}
                  key={score.criterionId}
                >
                  <Text className={styles.responseTitle}>{score.title}</Text>
                  <Text>
                    {score.score ?? '-'} / {score.maxScore}
                  </Text>
                </div>
              ))}
              <Text className={styles.responseTitle}>교수자 메모</Text>
              <Text>{professorEvaluationQuery.data.memo ?? '-'}</Text>
              <Text className={styles.responseTitle}>저장 시각</Text>
              <Text>
                {formatProfessorSavedAt(
                  professorEvaluationQuery.data.submittedAt,
                )}
              </Text>
            </div>
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
