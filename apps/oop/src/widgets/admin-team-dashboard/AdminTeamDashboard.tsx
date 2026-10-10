import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  Tab,
  TabList,
  Table,
  Text,
} from '@aics/design-system';
import { Link, useParams } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  AdminMeetingActionTable,
  AdminTeamMeetingRecordList,
} from '~/features/admin-meeting/components';
import {
  useAdminMeetingRecordListQuery,
  useAdminSectionMeetingActionsQuery,
} from '~/features/admin-meeting/queries';
import { isPresentationSubmissionMilestone } from '~/features/admin-milestone-review/model';
import {
  useAdminSectionMilestonesQuery,
  useAdminSubmissionVersionDetailsQueries,
} from '~/features/admin-milestone-review/queries';
import AdminStudentDetailDialog from '~/features/admin-student-team/components/AdminStudentDetailDialog';
import type { TeamMilestoneProgress } from '~/features/admin-team-dashboard/model';
import {
  useAdminTeamDashboardQuery,
  useAdminTeamMilestoneSubmissionsQueries,
} from '~/features/admin-team-dashboard/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminTeamDashboard.css';
import AdminTeamEvaluationTables from './AdminTeamEvaluationTables';
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
        description: '팀이 존재하는지 수강생·팀 관리에서 확인해 주세요.',
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

function getTeamStatusLabel(status: string) {
  if (status === 'CONFIRMED') return '확정';
  if (status === 'FORMING') return '구성 중';
  return status;
}

export default function AdminTeamDashboard() {
  const { teamId } = useParams({ from: '/admin/teams/$teamId' });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'activity' | 'overview' | 'submissions'
  >('overview');
  const currentUser = useAuthStore(state => state.currentUser);
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const teamDashboardQuery = useAdminTeamDashboardQuery(teamId);
  const dashboardSection = teamDashboardQuery.isSuccess
    ? currentUser?.sections.find(
        section => section.id === teamDashboardQuery.data.sectionId,
      )
    : undefined;
  const team =
    dashboardSection && teamDashboardQuery.isSuccess
      ? teamDashboardQuery.data
      : undefined;
  const sectionMilestonesQuery = useAdminSectionMilestonesQuery(
    team?.sectionId,
  );
  const sectionMilestones = [...(sectionMilestonesQuery.data?.content ?? [])]
    .filter(
      milestone =>
        milestone.type !== 'PEER_EVALUATION' &&
        (milestone.type !== 'PRESENTATION' ||
          isPresentationSubmissionMilestone(milestone)),
    )
    .sort((left, right) => left.weekNumber - right.weekNumber);
  const milestoneSubmissionQueries = useAdminTeamMilestoneSubmissionsQueries(
    sectionMilestones.map(milestone => String(milestone.id)),
    team?.id,
  );
  const milestoneSubmissions = sectionMilestones.map((milestone, index) => {
    const query = milestoneSubmissionQueries[index];
    return query?.data?.submissions.find(
      submission => String(submission.teamId) === String(team?.id),
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
    Boolean(team) && activeTab === 'submissions',
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
  const meetingRecordsQuery = useAdminMeetingRecordListQuery(
    accessibleSectionIds,
    team
      ? {
          page: 0,
          sectionId: team.sectionId,
          size: 3,
          teamId: team.id,
        }
      : undefined,
    Boolean(team) && activeTab === 'activity',
  );
  const meetingRecords = (meetingRecordsQuery.data?.contents ?? []).map(
    record => ({
      createdAt: record.meetingAt,
      id: String(record.id),
      sectionId: String(record.sectionId),
      sectionLabel: record.sectionName,
      teamId: String(record.teamId),
      teamLabel: record.teamName,
      title: record.title,
    }),
  );
  const meetingActionsQuery = useAdminSectionMeetingActionsQuery(
    accessibleSectionIds,
    activeTab === 'activity' ? team?.sectionId : undefined,
    team ? { page: 0, size: 20, teamId: team.id } : undefined,
  );

  useEffect(() => {
    setSelectedMemberId(null);
    setActiveTab('overview');
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
              <Link className={styles.backLink} to={ROUTES.ADMIN_SECTIONS}>
                강좌·분반 관리로
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
          description='담당 분반과 관리자 권한을 확인해 주세요.'
          headingLevel={2}
          title='이 팀에 접근할 수 없습니다.'
        />
      </div>
    );
  }

  const selectedMember = selectedMemberId
    ? (team.members.find(member => member.id === selectedMemberId) ?? null)
    : null;
  function openStudentDetail(memberId: string) {
    setSelectedMemberId(memberId);
  }

  const sectionCode = dashboardSection?.code ?? '분반 정보 없음';
  const detailSectionId = dashboardSection?.id ?? team.sectionId;

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>
          {sectionCode} - {team.name} 대시보드
        </Heading>
        {dashboardSection?.courseId === undefined ? (
          <Link className={styles.backLink} to={ROUTES.ADMIN_SECTIONS}>
            ← 강좌·분반 관리로
          </Link>
        ) : (
          <Link
            className={styles.backLink}
            params={{ courseId: String(dashboardSection.courseId) }}
            search={{ sectionId: Number(detailSectionId), tab: 'roster' }}
            to={ROUTES.ADMIN_COURSE_DETAIL}
          >
            ← 강좌·분반 관리로
          </Link>
        )}
      </div>

      <TabList
        aria-label='팀 대시보드 메뉴'
        onChange={value => {
          if (
            value === 'activity' ||
            value === 'overview' ||
            value === 'submissions'
          ) {
            setActiveTab(value);
          }
        }}
        value={activeTab}
      >
        <Tab label='개요' value='overview' />
        <Tab label='제출·평가' value='submissions' />
        <Tab label='회의록·액션플랜' value='activity' />
      </TabList>

      {activeTab === 'overview' ? (
        <>
          <section aria-labelledby='team-project-heading'>
            <Card className={styles.projectSummaryCard} padding={5}>
              <div className={styles.projectSummaryCopy}>
                <Heading id='team-project-heading' level={2}>
                  {proposalMilestoneIndex < 0
                    ? '제안서 마일스톤 없음'
                    : milestoneSubmissionQueries[proposalMilestoneIndex]
                          ?.isPending
                      ? '프로젝트 주제 조회 중'
                      : (projectTopic ?? '프로젝트 주제 미정')}
                </Heading>
                <Text color='secondary' type='supporting'>
                  제안서에 등록된 프로젝트 주제와 현재 팀 정보를 표시합니다.
                </Text>
              </div>
              <dl className={styles.projectMetadata}>
                <div>
                  <dt>분반</dt>
                  <dd>{sectionCode}</dd>
                </div>
                <div>
                  <dt>팀 상태</dt>
                  <dd>{getTeamStatusLabel(team.status)}</dd>
                </div>
                <div>
                  <dt>팀원</dt>
                  <dd>{team.members.length}명</dd>
                </div>
              </dl>
            </Card>
          </section>

          <section aria-labelledby='team-members-heading'>
            <Heading id='team-members-heading' level={2}>
              팀원 정보
            </Heading>
            <Card padding={0}>
              <Table
                aria-label='팀원 정보'
                columns={[
                  {
                    align: 'start',
                    header: '이름',
                    key: 'name',
                    renderCell: member => (
                      <button
                        className={styles.memberButton}
                        onClick={() => openStudentDetail(member.id)}
                        type='button'
                      >
                        {member.name}
                      </button>
                    ),
                  },
                  {
                    align: 'start',
                    header: '학번',
                    key: 'studentNumber',
                  },
                  {
                    align: 'start',
                    header: '구분',
                    key: 'isLeader',
                    renderCell: member =>
                      member.isLeader ? (
                        <Badge label='팀장' variant='info' />
                      ) : (
                        '팀원'
                      ),
                  },
                  {
                    align: 'start',
                    header: '프로젝트 역할',
                    key: 'projectRole',
                    renderCell: member => member.projectRole ?? '역할 미정',
                  },
                ]}
                data={team.members}
                density='balanced'
                dividers='rows'
                emptyState={<span>등록된 팀원이 없습니다.</span>}
                idKey='id'
                textOverflow='wrap'
                verticalAlign='middle'
              />
            </Card>
          </section>
        </>
      ) : null}

      {activeTab === 'submissions' ? (
        <>
          <AdminTeamMilestoneProgress
            apiSectionId={team.sectionId}
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
            readerId={currentUser?.id}
            sectionId={detailSectionId}
          />

          <AdminTeamEvaluationTables
            sectionId={team.sectionId}
            teamId={team.id}
          />
        </>
      ) : null}

      {activeTab === 'activity' ? (
        <>
          <AdminTeamMeetingRecordList
            isError={meetingRecordsQuery.isError}
            isPending={meetingRecordsQuery.isPending}
            records={meetingRecords}
            sectionId={team.sectionId}
            teamId={team.id}
          />
          <section aria-labelledby='team-actions-heading'>
            <Heading id='team-actions-heading' level={2}>
              액션플랜
            </Heading>
            {meetingActionsQuery.isPending ? (
              <Text aria-live='polite' role='status'>
                액션플랜을 불러오는 중입니다.
              </Text>
            ) : meetingActionsQuery.isError ? (
              <Text role='alert'>액션플랜을 불러오지 못했습니다.</Text>
            ) : (
              <Card padding={0}>
                <AdminMeetingActionTable
                  actions={meetingActionsQuery.data?.contents ?? []}
                  emptyMessage='등록된 액션플랜이 없습니다.'
                  showTeam={false}
                />
              </Card>
            )}
          </section>
        </>
      ) : null}

      <AdminStudentDetailDialog
        major={selectedMember?.major}
        onClose={() => setSelectedMemberId(null)}
        studentNumber={selectedMember?.studentNumber ?? null}
      />
    </div>
  );
}
