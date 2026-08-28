import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  Text,
} from '@aics/design-system';
import { Link, useParams } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { AdminTeamMeetingRecordList } from '~/features/admin-meeting/components';
import { useAdminMeetingRecordsQuery } from '~/features/admin-meeting/queries';
import StudentDetailDialog from '~/features/admin-student-team/components/StudentDetailDialog';
import { useAdminTeamDashboardQuery } from '~/features/admin-team-dashboard/queries';
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
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const currentUser = useAuthStore(state => state.currentUser);
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const teamDashboardQuery = useAdminTeamDashboardQuery(teamId);
  const meetingRecordsQuery = useAdminMeetingRecordsQuery(
    accessibleSectionIds,
    teamDashboardQuery.data
      ? {
          sectionId: teamDashboardQuery.data.section.id,
          teamId,
        }
      : undefined,
    Boolean(teamDashboardQuery.data),
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

  const team = teamDashboardQuery.data;
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

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>
          {team.section.code}반 - {team.name} 대시보드
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
            프로젝트 주제: <strong>{team.projectTopic ?? '미정'}</strong>
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
        milestones={team.milestones}
        meetingCountState={
          meetingRecordsQuery.isSuccess
            ? {
                count: meetingRecordsQuery.data.records.length,
                status: 'ready',
              }
            : meetingRecordsQuery.isError
              ? { status: 'error' }
              : { status: 'pending' }
        }
        projectTopic={team.projectTopic}
        sectionId={team.section.id}
        teamId={team.id}
        teamMemberCount={team.members.length}
        teamLeaderName={
          team.members.find(member => member.isLeader)?.name ?? null
        }
      />

      <AdminTeamMeetingRecordList
        isError={meetingRecordsQuery.isError}
        isPending={meetingRecordsQuery.isPending}
        records={meetingRecordsQuery.data?.records ?? []}
        sectionId={team.section.id}
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
