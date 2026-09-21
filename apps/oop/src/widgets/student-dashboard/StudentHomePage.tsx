import { Button, EmptyState } from '@aics/design-system';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';

import { editorSectionTo } from '~/app/constants/editorSections';

import { useAuthStore } from '~/features/auth/authStore';
import { canSubmitMidReportDocument } from '~/features/mid-report/MidReportEditorPage';
import { useCurrentMidReportQuery } from '~/features/mid-report/queries';
import { TopicApiProvider } from '~/features/project-topic/TopicApiContext';
import TopicCandidateDialog from '~/features/project-topic/TopicCandidateDialog';
import { TopicCandidateDialogProvider } from '~/features/project-topic/TopicCandidateDialogContext';
import { useTopicMilestoneEligibility } from '~/features/project-topic/useTopicMilestoneEligibility';
import { useProposalSectionsQuery } from '~/features/proposal/queries';
import StudentContextState from '~/features/section/StudentContextState';
import {
  documentFeedbackStageCopy,
  midReportFeedbackRoomStage,
  midReportFeedbackStage,
  proposalFeedbackRoomStage,
  proposalFeedbackStage,
} from '~/features/student-home/model/documentFeedbackStage';
import { homeQueryState } from '~/features/student-home/model/homeQueryState';
import { midReportSectionStatuses } from '~/features/student-home/model/midReportSectionStatuses';
import { peerEvaluationHomeSummary } from '~/features/student-home/model/peerEvaluationHomeSummary';
import { proposalSectionStatuses } from '~/features/student-home/model/proposalSectionStatuses';
import { selectActiveMilestone } from '~/features/student-home/model/selectActiveMilestone';
import {
  areAllStudentMilestonesTerminal,
  lockStudentHomeMilestone,
  resolveStudentMilestoneProgression,
} from '~/features/student-home/model/studentMilestoneProgression';
import { studentMilestoneSummary } from '~/features/student-home/model/studentMilestoneSummary';
import {
  useLiveStudentHomeQuery,
  useMilestoneScheduleClock,
  useStudentMilestonesQuery,
  usePeerEvaluationHomeQuery,
} from '~/features/student-home/queries';
import type { StudentSubmissionTarget } from '~/features/submission/StudentSubmissionPanel';
import SubmissionDialog from '~/features/submission/SubmissionDialog';
import { SubmissionDialogProvider } from '~/features/submission/SubmissionDialogContext';
import { useTeamMessagesQuery } from '~/features/team-message/queries';

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
  const midReport = useCurrentMidReportQuery(Boolean(home.teamId));
  // 피드백 대화와 문서의 실제 제출 상태를 각각 조회한다.
  const proposalMessages = useTeamMessagesQuery(home.teamId, 'PROPOSAL');
  const midReportMessages = useTeamMessagesQuery(home.teamId, 'MID_REPORT');
  const currentUserName = useAuthStore(state => state.currentUser?.name);
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

  useEffect(() => {
    const milestoneId = window.location.hash.replace(
      /^#student-milestone-/,
      '',
    );
    if (
      query.list.isSuccess &&
      (milestoneId === 'proposal' || milestoneId === 'mid-review')
    ) {
      focusStudentMilestone(milestoneId);
    }
  }, [query.list.isSuccess]);

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

  if (!sectionId) return <StudentContextState context={home.context} />;

  const submissionTargets: Record<string, StudentSubmissionTarget> = {};
  const summarizedMilestones = query.milestones.map((milestone, index) => {
    const submission = query.submissions[index];
    const summary = studentMilestoneSummary(
      milestone,
      submission?.isSuccess ? submission.data : undefined,
      now,
    );
    if (summary.body?.kind === 'presentation-evaluation') {
      const project =
        home.project.state.status === 'ready' ? home.project.data : undefined;
      summary.body.project = {
        title: project?.title || '프로젝트 정보',
        description:
          project?.description || '프로젝트 정보를 확인할 수 없어요.',
      };
      return summary;
    }
    if (milestone.type === 'PEER_EVALUATION') {
      return peerEvaluationHomeSummary(
        summary,
        peer,
        Boolean(home.teamId),
        peerMilestones.length === 1,
      );
    }
    if (!home.teamId)
      summary.statusLabel =
        home.context.status === 'ambiguous'
          ? '팀 소속 확인 필요'
          : '팀 배정 대기';
    else if (submission?.isError) summary.statusLabel = '조회 실패';
    else if (submission?.isPending) summary.statusLabel = '조회 중';
    if (milestone.type === 'MID_REPORT' && home.teamId) {
      summary.currentStepLabel = '중간보고서 작성';
      summary.interaction = 'collapsible';
      summary.isDetailAvailable = true;
      const midReportStage = midReportFeedbackStage({
        submittedAt: midReport.data?.submittedAt,
        messages: midReportMessages.data,
        relatedId:
          midReport.data?.id === undefined
            ? undefined
            : Number(midReport.data.id),
        teamMemberIds: home.teamMemberIds,
        isMessagesReady: midReportMessages.isSuccess,
      });
      const isFeedbackCycleCompleted =
        (submission?.isSuccess && submission.data.status === 'COMPLETED') ||
        (midReport.isSuccess &&
          midReport.data.status === 'SUBMITTED' &&
          Boolean(midReport.data.revision?.resubmittedAt));
      if (isFeedbackCycleCompleted) {
        summary.status = 'completed';
        summary.statusLabel = '단계 완료';
      }
      summary.body = {
        kind: 'mid-review-feedback',
        teamId: home.teamId,
        submissionId:
          midReport.data?.id === undefined
            ? undefined
            : String(midReport.data.id),
        feedbackStage: isFeedbackCycleCompleted
          ? 'completed'
          : midReportFeedbackRoomStage({
              submittedAt: midReport.data?.submittedAt,
              messages: midReportMessages.data,
              relatedId:
                midReport.data?.id === undefined
                  ? undefined
                  : Number(midReport.data.id),
              teamMemberIds: home.teamMemberIds,
              isMessagesReady: midReportMessages.isSuccess,
            }),
        feedback: [],
        canSubmitResponse: false,
        // The feedback room stays as main defines it; only the writing areas
        // are filled with the document's block states.
        sections: midReportSectionStatuses(
          midReport.isSuccess
            ? 'ready'
            : midReport.isError
              ? 'error'
              : 'pending',
          midReport.data,
        ),
        guide: '대면 피드백과 반영 내용을 기록해 주세요.',
      };
      // A submitted document is read only on the server, so the home must not
      // offer a writing or submitting action for it any more.
      const submittedReport =
        midReport.isSuccess && midReport.data.status === 'SUBMITTED';
      const readyToSubmit =
        midReport.isSuccess &&
        canSubmitMidReportDocument(midReport.data, currentUserName);
      if (
        submission?.isSuccess &&
        submission.data?.status === 'NOT_SUBMITTED' &&
        midReport.data &&
        midReport.data.status !== 'DRAFT'
      ) {
        summary.statusLabel =
          midReport.data.status === 'SUBMITTED'
            ? '제출 완료'
            : midReport.data.status === 'REVISION_REQUESTED'
              ? '수정 요청'
              : '작성 중';
      }
      summary.rows = isFeedbackCycleCompleted
        ? [
            {
              id: 'mid-report-completed',
              label: '중간보고서',
              value: '피드백 반영 및 재제출 완료',
              tone: 'muted',
            },
          ]
        : submittedReport
          ? [
              midReportStage === 'feedback-arrived'
                ? {
                    id: 'mid-report-revision',
                    label: '중간보고서 재제출',
                    value: '대면 피드백 기록을 남겼어요.',
                    tone: 'primary',
                    actionLabel: '재제출',
                    actionDisabled: true,
                    actionNotice:
                      '재제출은 담당 교수·조교가 중간보고서를 다시 열어 준 뒤에 할 수 있어요.',
                  }
                : {
                    id: 'mid-report-submitted',
                    label: '중간보고서',
                    value:
                      midReportStage === 'unknown'
                        ? midReportMessages.isError
                          ? documentFeedbackStageCopy.midReport.checkFailed
                          : documentFeedbackStageCopy.midReport.checking
                        : documentFeedbackStageCopy.midReport.awaiting,
                    tone: 'muted',
                  },
            ]
          : [
              readyToSubmit
                ? {
                    id: 'mid-report-submit',
                    label: '중간보고서 제출',
                    value: '모든 작성 영역 완료',
                    tone: 'primary',
                    actionLabel: '제출하기',
                  }
                : {
                    id: 'mid-report-writing',
                    label: '중간보고서 작성',
                    value: '작성 영역을 차례로 완료해 주세요.',
                    tone: 'primary',
                    actionLabel: '작성하기',
                    actionTo: editorSectionTo('mid-review', 'topic'),
                  },
            ];
      return summary;
    }
    if (
      (milestone.type === 'FINAL_REPORT' ||
        milestone.type === 'PRESENTATION') &&
      submission?.isSuccess &&
      home.teamId &&
      home.studentNumber &&
      String(submission.data.milestoneId) === String(milestone.id) &&
      String(submission.data.teamId) === home.teamId
    ) {
      submissionTargets[String(milestone.id)] = {
        sectionId,
        teamId: home.teamId,
        studentNumber: home.studentNumber,
        milestoneId: String(milestone.id),
        submissionId: String(submission.data.id),
        type: milestone.type,
        title:
          milestone.type === 'FINAL_REPORT'
            ? '최종 파일 제출'
            : '발표 자료 제출',
      };
      summary.interaction = 'collapsible';
      summary.isDetailAvailable = true;
      const isFinalReport = milestone.type === 'FINAL_REPORT';
      summary.body = isFinalReport
        ? {
            kind: 'final-report',
            submissionId: String(submission.data.id),
            notice: {
              description:
                milestone.description ||
                '담당 교수자가 안내한 제출 항목과 일정을 확인해 주세요.',
            },
            materials: [],
          }
        : {
            kind: 'presentation-material',
            project: {
              title: home.project.data?.title || milestone.title,
              description:
                home.project.data?.description || milestone.description || '',
            },
            sections: [],
            materials: [],
          };
      summary.rows = [
        {
          id: isFinalReport
            ? 'final-report-submission'
            : 'presentation-material',
          label: isFinalReport ? '최종보고서 제출' : '발표 자료 제출',
          value: submission.data.currentVersion
            ? `v${submission.data.currentVersion} 제출됨`
            : '미제출',
          tone: 'primary',
          actionLabel: submission.data.canSubmitNow
            ? submission.data.currentVersion
              ? '파일 교체'
              : '파일 제출'
            : '제출 내역',
          actionNotice: isFinalReport
            ? '파일 제출과 교체는 팀장만 할 수 있어요.'
            : undefined,
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
        const proposalStage = proposalFeedbackStage({
          submittedAt: project.proposalCompletedAt,
          messages: proposalMessages.data,
          relatedId: project.id,
          teamMemberIds: home.teamMemberIds,
          isMessagesReady: proposalMessages.isSuccess,
        });
        const isFeedbackCycleCompleted =
          (submission?.isSuccess && submission.data.status === 'COMPLETED') ||
          proposalStage === 'completed';
        if (isFeedbackCycleCompleted) {
          summary.status = 'completed';
          summary.statusLabel = '단계 완료';
        }
        summary.body = {
          kind: 'proposal-feedback',
          teamId: home.teamId,
          proposalId: project.id,
          feedbackStage: isFeedbackCycleCompleted
            ? 'completed'
            : proposalFeedbackRoomStage({
                submittedAt: project.proposalCompletedAt,
                messages: proposalMessages.data,
                relatedId: project.id,
                teamMemberIds: home.teamMemberIds,
                isMessagesReady: proposalMessages.isSuccess,
              }),
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
        // The leader submits once every area is complete; everyone else keeps
        // writing. A submitted proposal is read only, so it offers no action.
        const readyToSubmit =
          proposalSections.isSuccess && proposalSections.data.allCompleted;
        if (
          !isFeedbackCycleCompleted &&
          submission?.isSuccess &&
          project.proposalCompletedAt
        ) {
          summary.statusLabel = '제출 완료';
        }
        summary.rows = isFeedbackCycleCompleted
          ? [
              {
                id: 'proposal-completed',
                label: '제안서',
                value: '피드백 반영 및 재제출 완료',
                tone: 'muted',
              },
            ]
          : project.proposalCompletedAt
            ? [
                proposalStage === 'feedback-arrived'
                  ? {
                      id: 'proposal-revision',
                      label: '제안서 재제출',
                      value: '교수 피드백이 도착했어요.',
                      tone: 'primary',
                      actionLabel: '재제출',
                      actionDisabled: true,
                      actionNotice:
                        '재제출은 담당 교수·조교가 제안서를 다시 열어 준 뒤에 할 수 있어요.',
                    }
                  : {
                      id: 'proposal-submitted',
                      label: '제안서',
                      value:
                        proposalStage === 'unknown'
                          ? proposalMessages.isError
                            ? documentFeedbackStageCopy.proposal.checkFailed
                            : documentFeedbackStageCopy.proposal.checking
                          : documentFeedbackStageCopy.proposal.awaiting,
                      tone: 'muted',
                    },
              ]
            : [
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
      if (home.project.state.status !== 'ready' || home.project.data !== null) {
        summary.isDetailAvailable = false;
        summary.body = undefined;
        summary.rows = [
          {
            id: 'proposal-project-state',
            label: '프로젝트',
            value:
              home.project.state.status === 'error'
                ? '프로젝트를 불러오지 못했어요.'
                : home.project.state.status === 'pending'
                  ? '프로젝트를 확인하는 중이에요.'
                  : (home.missingTeam ?? '프로젝트 정보를 확인해 주세요.'),
            tone: 'muted',
          },
        ];
        return summary;
      }

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
  const progression = resolveStudentMilestoneProgression(
    query.milestones.map((milestone, index) => ({
      milestone,
      submission: query.submissions[index]?.isSuccess
        ? query.submissions[index].data
        : undefined,
      summary: summarizedMilestones[index]!,
    })),
    now,
  );
  const milestones = summarizedMilestones.map(milestone =>
    progression.unlockedIds.has(milestone.id)
      ? milestone
      : lockStudentHomeMilestone(milestone),
  );
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
  const isSemesterComplete =
    areAllStudentMilestonesTerminal(summarizedMilestones);
  let heroHeading = '팀 프로젝트 진행 상태를 확인해 주세요.';
  let heroDescription =
    '아래에서 단계별 일정과 내 팀 제출 상태를 확인할 수 있어요.';

  if (isSemesterComplete) {
    heroHeading = '한 학기 동안 수고 많으셨습니다.';
    heroDescription =
      '모든 팀 프로젝트 일정이 마감되었습니다. 아래에서 제출 결과와 활동 기록을 확인할 수 있어요.';
  } else if (activeMilestone) {
    heroHeading = `${activeMilestone.title} 진행 상태를 확인해 주세요.`;
    heroDescription = `${activeMilestone.title} · ${activeMilestone.statusLabel}`;
  }

  const hero = {
    date: new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      dateStyle: 'long',
    }).format(new Date()),
    heading: heroHeading,
    description: heroDescription,
    ctaLabel: '진행 단계 확인',
  };

  const focusActiveMilestone = activeMilestone
    ? () => focusStudentMilestone(activeMilestone.id)
    : undefined;

  return (
    <div className={styles.root}>
      <StudentContextState context={home.context} />
      {home.project.state.status === 'error' ? (
        <EmptyState
          title='프로젝트를 불러오지 못했어요.'
          description={home.project.state.description}
          actions={
            <Button
              label='프로젝트 다시 시도'
              onClick={home.project.state.onRetry}
            />
          }
        />
      ) : null}
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
        showCta={!isSemesterComplete}
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
            submissionTargets={submissionTargets}
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
                defaultOpenId={progression.defaultOpenId ?? null}
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
