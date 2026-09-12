import { Button, EmptyState } from '@aics/design-system';
import { isAxiosError } from 'axios';

import { editorSectionTo } from '~/app/constants/editorSections';

import { TopicApiProvider } from '~/features/project-topic/TopicApiContext';
import TopicCandidateDialog from '~/features/project-topic/TopicCandidateDialog';
import { TopicCandidateDialogProvider } from '~/features/project-topic/TopicCandidateDialogContext';
import { useTopicMilestoneEligibility } from '~/features/project-topic/useTopicMilestoneEligibility';
import { useProposalSectionsQuery } from '~/features/proposal/queries';
import { homeQueryState } from '~/features/student-home/model/homeQueryState';
import { peerEvaluationHomeSummary } from '~/features/student-home/model/peerEvaluationHomeSummary';
import { proposalSectionStatuses } from '~/features/student-home/model/proposalSectionStatuses';
import { selectActiveMilestone } from '~/features/student-home/model/selectActiveMilestone';
import { studentMilestoneSummary } from '~/features/student-home/model/studentMilestoneSummary';
import {
  useLiveStudentHomeQuery,
  useMilestoneScheduleClock,
  useStudentMilestonesQuery,
  usePeerEvaluationHomeQuery,
} from '~/features/student-home/queries';
import type { FinalReportSubmissionTarget } from '~/features/submission/FinalReportSubmissionPanel';
import SubmissionDialog from '~/features/submission/SubmissionDialog';
import { SubmissionDialogProvider } from '~/features/submission/SubmissionDialogContext';

import MilestoneList from '~/widgets/milestone-summary/MilestoneList';

import StudentHomeHero from './StudentHomeHero';
import * as styles from './StudentHomePage.css';
import StudentHomeShortcutState from './StudentHomeShortcutState';

type DashboardErrorContent = {
  title: string;
  description: string;
};

export function getDashboardErrorContent(
  error: unknown,
): DashboardErrorContent {
  if (!isAxiosError(error)) {
    return {
      title: '대시보드를 불러오지 못했어요.',
      description: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    };
  }

  switch (error.response?.status) {
    case 401:
      return {
        title: '로그인이 필요해요.',
        description: '세션을 확인한 뒤 다시 로그인해 주세요.',
      };
    case 403:
      return {
        title: '이 분반에 접근할 수 없어요.',
        description: '소속 분반과 학생 권한을 확인해 주세요.',
      };
    case 404:
      return {
        title: '분반 대시보드를 찾지 못했어요.',
        description: '분반이 개설되었는지 담당자에게 확인해 주세요.',
      };
    default:
      return {
        title: '대시보드를 불러오지 못했어요.',
        description: '잠시 후 다시 시도해 주세요.',
      };
  }
}

export function focusStudentMilestone(milestoneId: string) {
  const milestoneElement = document.getElementById(
    `student-milestone-${milestoneId}`,
  );
  milestoneElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  milestoneElement?.focus({ preventScroll: true });
}

export default function StudentHomePage() {
  const home = useLiveStudentHomeQuery();
  const sectionId = home.sectionId;
  const query = useStudentMilestonesQuery(sectionId, home.teamId);
  const proposalProject =
    home.project.state.status === 'ready' ? home.project.data : undefined;
  const proposalSections = useProposalSectionsQuery(proposalProject?.id);
  const peerMilestones = query.milestones.filter(
    milestone => milestone.type === 'PEER_EVALUATION',
  );
  const peer = usePeerEvaluationHomeQuery(
    peerMilestones.length && home.teamId ? sectionId : undefined,
    home.studentNumber,
  );
  const now = useMilestoneScheduleClock(
    query.milestones,
    sectionId,
    home.teamId,
  );
  const topicEligibility = useTopicMilestoneEligibility(
    query.list.isSuccess ? query.list.data : undefined,
    sectionId,
  );
  const { isFetching, refetch } = query;
  const error = home.identity.error;

  if (home.identity.isPending) {
    return (
      <p aria-live='polite' className={styles.status} role='status'>
        대시보드를 불러오는 중...
      </p>
    );
  }
  if (error) {
    const errorContent = getDashboardErrorContent(error);
    return (
      <div className={styles.root}>
        <EmptyState
          title={errorContent.title}
          description={errorContent.description}
          actions={
            <Button
              label='다시 시도'
              variant='primary'
              clickAction={async () => {
                await home.identity.refetch();
              }}
            />
          }
        />
      </div>
    );
  }

  if (!sectionId) {
    return (
      <div className={styles.root}>
        <EmptyState
          description='수강 분반 배정이 완료되면 학생 홈을 이용할 수 있어요.'
          headingLevel={2}
          title='소속 분반이 없어요.'
        />
      </div>
    );
  }

  const finalReportTargets: Record<string, FinalReportSubmissionTarget> = {};
  const milestones = query.milestones.map((milestone, index) => {
    const submission = query.submissions[index];
    const summary = studentMilestoneSummary(
      milestone,
      submission?.isSuccess ? submission.data : undefined,
      now,
    );
    if (milestone.type === 'PEER_EVALUATION') {
      return peerEvaluationHomeSummary(
        summary,
        peer,
        Boolean(home.teamId),
        peerMilestones.length === 1,
      );
    }
    if (!home.teamId) summary.statusLabel = '팀 배정 대기';
    else if (submission?.isError) summary.statusLabel = '조회 실패';
    else if (submission?.isPending) summary.statusLabel = '조회 중';
    if (milestone.type === 'MID_REPORT' && home.teamId) {
      summary.currentStepLabel = '중간보고서 작성';
      summary.interaction = 'collapsible';
      summary.isDetailAvailable = true;
      summary.body = {
        kind: 'mid-review-feedback',
        teamId: home.teamId,
        feedback: [],
        canSubmitResponse: false,
        sections: [],
        guide: '대면 피드백과 반영 내용을 기록해 주세요.',
      };
      return summary;
    }
    if (
      milestone.type === 'FINAL_REPORT' &&
      submission?.isSuccess &&
      home.teamId &&
      home.studentNumber &&
      String(submission.data.milestoneId) === String(milestone.id) &&
      String(submission.data.teamId) === home.teamId
    ) {
      finalReportTargets[String(milestone.id)] = {
        sectionId,
        teamId: home.teamId,
        studentNumber: home.studentNumber,
        milestoneId: String(milestone.id),
        submissionId: String(submission.data.id),
        type: 'FINAL_REPORT',
        title: '최종 파일 제출',
      };
      summary.interaction = 'collapsible';
      summary.isDetailAvailable = true;
      summary.body = {
        kind: 'final-report',
        submissionId: String(submission.data.id),
        notice: {
          description:
            milestone.description ||
            '담당 교수자가 안내한 제출 항목과 일정을 확인해 주세요.',
        },
        materials: [],
      };
      summary.rows = [
        {
          id: 'final-report-submission',
          label: '최종보고서 제출',
          value: submission.data.currentVersion
            ? `v${submission.data.currentVersion} 제출됨`
            : '미제출',
          tone: 'primary',
          actionLabel: submission.data.canSubmitNow
            ? submission.data.currentVersion
              ? '파일 교체'
              : '파일 제출'
            : '제출 내역',
          actionNotice: '파일 제출과 교체는 팀장만 할 수 있어요.',
        },
      ];
    }
    if (milestone.type === 'PROPOSAL') {
      const project =
        home.project.state.status === 'ready' ? home.project.data : undefined;
      if (project) {
        // An existing project can be continued regardless of how it was created.
        // This does not assert a selected candidate ID or invent block progress.
        // The feedback room body stays as main defines it; only the writing
        // areas are filled with the server's section states.
        summary.currentStepLabel = '제안서 작성';
        summary.interaction = 'collapsible';
        summary.isDetailAvailable = true;
        summary.body = {
          kind: 'proposal-feedback',
          teamId: home.teamId,
          feedback: [],
          canSubmitResponse: false,
          replyPlaceholder: '피드백을 반영한 내용을 작성해 주세요.',
          sections: proposalSectionStatuses(
            proposalSections.isSuccess
              ? 'ready'
              : proposalSections.isError
                ? 'error'
                : 'pending',
            proposalSections.data,
          ),
          guide: '피드백을 반영한 내용을 답변으로 남겨 주세요.',
        };
        // The leader submits once every area is complete; everyone else keeps writing.
        const readyToSubmit =
          proposalSections.isSuccess && proposalSections.data.allCompleted;
        summary.rows = [
          readyToSubmit && home.isTeamLeader
            ? {
                id: 'proposal-submit',
                label: '제안서 제출',
                value: '모든 작성 영역 완료',
                tone: 'primary',
                actionLabel: '제출하기',
              }
            : {
                id: 'proposal-writing',
                label: '제안서 작성',
                value: readyToSubmit
                  ? '팀장이 제출할 수 있어요.'
                  : project.title?.trim() || '프로젝트 내용 확인',
                tone: 'primary',
                actionLabel: '작성하기',
                actionTo: editorSectionTo('proposal', 'team-info'),
              },
        ];
      }

      if (project) return summary;

      summary.interaction = 'collapsible';
      summary.isDetailAvailable = true;
      summary.currentStepLabel = '주제 선정';
      summary.body = {
        kind: 'topic',
        guidance: '팀원이 등록한 주제 후보를 확인하고, 투표해 주세요.',
        topicCandidates: [],
        completion: { label: '', value: '' },
      };
      summary.rows = [
        {
          id: 'proposal-topic-selection',
          label: '주제 선정',
          value:
            topicEligibility.status === 'open'
              ? '후보를 등록하고 투표해 주세요.'
              : '참여 기간 확인',
          tone: 'default',
          actionLabel: '후보 추가',
          actionDisabled: topicEligibility.status !== 'open',
        },
      ];
    }
    return summary;
  });
  const activeMilestone = selectActiveMilestone(
    milestones,
    new Set(
      query.submissions.flatMap(item =>
        item.isSuccess && item.data.canSubmitNow
          ? [String(item.data.milestoneId)]
          : [],
      ),
    ),
  );
  const hero = {
    date: new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      dateStyle: 'long',
    }).format(new Date()),
    heading: activeMilestone
      ? `${activeMilestone.title} 진행 상태를 확인해 주세요.`
      : '팀 프로젝트 진행 상태를 확인해 주세요.',
    description: activeMilestone
      ? `${activeMilestone.title} · ${activeMilestone.statusLabel}`
      : '아래에서 단계별 일정과 내 팀 제출 상태를 확인할 수 있어요.',
    ctaLabel: '진행 단계 확인',
  };

  const focusActiveMilestone = activeMilestone
    ? () => focusStudentMilestone(activeMilestone.id)
    : undefined;

  return (
    <div className={styles.root}>
      <StudentHomeHero
        announcements={home.notices.items}
        assignedActions={home.actions.items}
        hero={hero}
        recentMeetingRecords={home.meetings.items}
        noticeState={home.notices.state}
        actionState={home.actions.state}
        recordState={home.meetings.state}
        meetingMetadataState={home.meetings.metadataState}
        sectionId={home.sectionId}
        canCreateMeeting={Boolean(home.teamId)}
        onCtaClick={focusActiveMilestone}
      />
      <TopicApiProvider
        sectionId={home.sectionId}
        teamId={home.teamId}
        studentNumber={home.studentNumber}
        eligibility={topicEligibility}
      >
        <TopicCandidateDialogProvider>
          <TopicCandidateDialog />
          <SubmissionDialogProvider
            key={`${home.studentNumber}:${sectionId}:${home.teamId}`}
            finalReportTargets={finalReportTargets}
          >
            <SubmissionDialog />
            {query.list.isPending || query.list.isError ? (
              <StudentHomeShortcutState
                state={homeQueryState(query.list)}
                label='마일스톤 목록'
              />
            ) : (
              <MilestoneList
                milestones={milestones}
                description='단계별 일정과 내 팀 제출 상태를 확인해 주세요.'
                persistenceKey={`${home.studentNumber ?? 'anonymous'}:${sectionId}:${home.teamId ?? 'unassigned'}`}
              />
            )}
            {peerMilestones.length > 0 && peer.error ? (
              <Button
                label='상호평가 상태 다시 시도'
                clickAction={peer.refetch}
                variant='secondary'
              />
            ) : null}
            {query.submissions.some(submission => submission.isError) ? (
              <Button
                label='제출 상태 다시 시도'
                isLoading={isFetching}
                clickAction={refetch}
                variant='secondary'
              />
            ) : null}
          </SubmissionDialogProvider>
        </TopicCandidateDialogProvider>
      </TopicApiProvider>
    </div>
  );
}
