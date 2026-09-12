import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  Text,
} from '@aics/design-system';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { AdminTeamMeetingRecordList } from '~/features/admin-meeting/components';
import { useAdminMeetingRecordsQuery } from '~/features/admin-meeting/queries';
import { isPresentationSubmissionMilestone } from '~/features/admin-milestone-review/model';
import {
  useAdminSectionMilestonesQuery,
  useAdminSubmissionVersionDetailsQueries,
} from '~/features/admin-milestone-review/queries';
import StudentDetailDialog from '~/features/admin-student-team/components/StudentDetailDialog';
import type { TeamMilestoneProgress } from '~/features/admin-team-dashboard/model';
import {
  useAdminTeamDashboardQuery,
  useAdminTeamMilestoneSubmissionsQueries,
} from '~/features/admin-team-dashboard/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminTeamDashboard.css';
import AdminTeamMilestoneProgress from './AdminTeamMilestoneProgress';

type TeamDashboardErrorContent = {
  title: string;
  description: string;
  canRetry: boolean;
};

function getTeamDashboardErrorContent(
  error: unknown,
): TeamDashboardErrorContent {
  if (!isAxiosError(error)) {
    return {
      title: '팀 정보를 불러오지 못했습니다.',
      description: '잠시 후 다시 시도해 주세요.',
      canRetry: true,
    };
  }

  if (!error.response) {
    return {
      title: '팀 정보를 불러오지 못했습니다.',
      description: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
      canRetry: true,
    };
  }

  switch (error.response.status) {
    case 401:
      return {
        title: '로그인이 필요합니다.',
        description: '세션을 확인한 뒤 다시 로그인해 주세요.',
        canRetry: false,
      };
    case 403:
      return {
        title: '이 팀에 접근할 수 없습니다.',
        description: '담당 분반과 관리자 권한을 확인해 주세요.',
        canRetry: false,
      };
    case 404:
      return {
        title: '팀 정보를 찾을 수 없습니다.',
        description: '팀이 존재하는지 수강생/팀 관리에서 확인해 주세요.',
        canRetry: false,
      };
    default:
      return {
        title: '팀 정보를 불러오지 못했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
        canRetry: true,
      };
  }
}

export default function AdminTeamDashboard() {
  const { teamId } = useParams({ from: '/admin/teams/$teamId' });
  const search = useSearch({ from: '/admin/teams/$teamId' }) as {
    sectionId?: string;
  };
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const currentUser = useAuthStore(state => state.currentUser);
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const teamDashboardQuery = useAdminTeamDashboardQuery(teamId);
  const team = teamDashboardQuery.data;
  const dashboardSection = team
    ? (currentUser?.sections.find(section => section.id === search.sectionId) ??
      currentUser?.sections.find(section => section.id === team.sectionId) ??
      (currentUser?.sections.length === 1
        ? currentUser.sections[0]
        : undefined))
    : undefined;
  const sectionMilestonesQuery = useAdminSectionMilestonesQuery(
    team?.sectionId,
  );
  const sectionMilestones = [...(sectionMilestonesQuery.data?.content ?? [])]
    .filter(
      milestone =>
        milestone.type !== 'PRESENTATION' ||
        isPresentationSubmissionMilestone(milestone),
    )
    .sort((left, right) => left.weekNumber - right.weekNumber);
  const milestoneSubmissionQueries = useAdminTeamMilestoneSubmissionsQueries(
    sectionMilestones.map(milestone => String(milestone.id)),
    team?.id,
  );
  const milestoneSubmissions = sectionMilestones.map((milestone, index) => {
    const query = milestoneSubmissionQueries[index];
    return query?.data?.submissions.find(
      submission => submission.teamId === team?.id,
    );
  });
  const versionTargets = milestoneSubmissions.flatMap((submission, index) =>
    submission?.submissionId &&
    submission.currentVersion > 0 &&
    sectionMilestones[index]?.type !== 'PEER_EVALUATION'
      ? [
          {
            submissionId: submission.submissionId,
            version: submission.currentVersion,
          },
        ]
      : [],
  );
  const versionQueries = useAdminSubmissionVersionDetailsQueries(
    versionTargets,
    Boolean(team),
  );
  const versionQueryBySubmissionId = new Map(
    versionTargets.map((target, index) => [
      target.submissionId,
      versionQueries[index],
    ]),
  );
  const teamMilestoneProgresses: TeamMilestoneProgress[] =
    sectionMilestones.map((milestone, index) => {
      const submissionQuery = milestoneSubmissionQueries[index];
      const submission = milestoneSubmissions[index] ?? null;
      const versionQuery = submission?.submissionId
        ? versionQueryBySubmissionId.get(submission.submissionId)
        : undefined;

      return {
        milestone,
        submission,
        submissionState: submissionQuery?.isError
          ? 'error'
          : submissionQuery?.isSuccess
            ? 'ready'
            : 'pending',
        version: versionQuery?.data ?? null,
        versionState:
          !submission || submission.currentVersion === 0
            ? 'idle'
            : versionQuery?.isError
              ? 'error'
              : versionQuery?.isSuccess
                ? 'ready'
                : 'pending',
      };
    });
  const proposalMilestoneIndex = sectionMilestones.findIndex(
    milestone => milestone.type === 'PROPOSAL',
  );
  const proposalSubmission =
    proposalMilestoneIndex >= 0
      ? milestoneSubmissions[proposalMilestoneIndex]
      : undefined;
  const projectTopic = proposalSubmission?.projectTitle ?? null;
  const meetingRecordsQuery = useAdminMeetingRecordsQuery(
    accessibleSectionIds,
    team
      ? {
          sectionId: team.sectionId,
          teamId: team.id,
        }
      : undefined,
    Boolean(team),
  );

  useEffect(() => {
    setSelectedMemberId(null);
  }, [teamId]);

  if (teamDashboardQuery.isPending) {
    return (
      <div className={styles.page}>
        <p aria-live='polite' role='status'>
          팀 정보를 불러오는 중입니다.
        </p>
      </div>
    );
  }

  if (teamDashboardQuery.isError) {
    const errorContent = getTeamDashboardErrorContent(teamDashboardQuery.error);

    return (
      <div className={styles.page}>
        <EmptyState
          actions={
            <div className={styles.errorActions}>
              {errorContent.canRetry ? (
                <Button
                  clickAction={async () => {
                    await teamDashboardQuery.refetch();
                  }}
                  isLoading={teamDashboardQuery.isFetching}
                  label='다시 시도'
                  variant='primary'
                />
              ) : null}
              <Link className={styles.backLink} to={ROUTES.ADMIN_STUDENT_TEAM}>
                수강생/팀 관리로
              </Link>
            </div>
          }
          description={errorContent.description}
          headingLevel={2}
          title={errorContent.title}
        />
      </div>
    );
  }

  if (!team) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 식별자를 확인한 뒤 다시 시도해 주세요.'
          headingLevel={2}
          title='팀 정보를 찾을 수 없습니다.'
        />
      </div>
    );
  }

  const selectedMember = selectedMemberId
    ? (team.members.find(member => member.id === selectedMemberId) ?? null)
    : null;
  const selectedStudent = selectedMember
    ? {
        name: selectedMember.name,
        studentNumber: selectedMember.studentNumber,
        major: selectedMember.major,
        team: { name: team.name },
      }
    : null;

  function openStudentDetail(memberId: string) {
    setSelectedMemberId(memberId);
  }

  const sectionCode = dashboardSection?.code ?? '분반 정보 없음';

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>
          {sectionCode} - {team.name} 대시보드
        </Heading>
        <Link className={styles.backLink} to={ROUTES.ADMIN_STUDENT_TEAM}>
          ← 수강생/팀 관리로
        </Link>
      </div>

      <section aria-labelledby='team-detail-heading'>
        <Card className={styles.teamInfoCard} padding={6}>
          <Heading id='team-detail-heading' level={2}>
            {team.name} 상세
          </Heading>
          <Text>
            프로젝트 주제:{' '}
            <strong>
              {proposalMilestoneIndex < 0
                ? '제안서 마일스톤 없음'
                : milestoneSubmissionQueries[proposalMilestoneIndex]?.isPending
                  ? '조회 중'
                  : (projectTopic ?? '미정')}
            </strong>
          </Text>

          <ul className={styles.memberList}>
            {team.members.map(member => (
              <li key={member.id}>
                <Card className={styles.memberCard} padding={4}>
                  <button
                    className={styles.memberButton}
                    onClick={() => openStudentDetail(member.id)}
                    type='button'
                  >
                    {member.name}
                  </button>
                  <span className={styles.studentNumber}>
                    {member.studentNumber}
                  </span>
                  <div className={styles.memberBadges}>
                    {member.isLeader ? (
                      <Badge label='팀장' variant='info' />
                    ) : null}
                    <Badge
                      label={member.projectRole ?? '역할 미정'}
                      variant='neutral'
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <AdminTeamMilestoneProgress
        milestones={
          sectionMilestonesQuery.isSuccess ? teamMilestoneProgresses : []
        }
        milestoneListState={
          sectionMilestonesQuery.isError
            ? 'error'
            : sectionMilestonesQuery.isSuccess
              ? 'ready'
              : 'pending'
        }
        sectionId={team.sectionId}
      />

      <AdminTeamMeetingRecordList
        isError={meetingRecordsQuery.isError}
        isPending={meetingRecordsQuery.isPending}
        records={meetingRecordsQuery.data?.records ?? []}
        sectionId={team.sectionId}
        teamId={team.id}
      />

      <StudentDetailDialog
        isOpen={selectedStudent !== null}
        onClose={() => setSelectedMemberId(null)}
        student={selectedStudent}
      />
    </div>
  );
}
