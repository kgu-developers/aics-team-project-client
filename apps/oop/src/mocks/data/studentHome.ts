import type {
  MidReport,
  Presentation,
  Proposal,
  Submission,
  StudentHomeDashboard,
  StudentHomeMilestoneBody,
  TopicBoard,
} from '@aics/core';

import { editorSectionTo } from '~/app/constants/editorSections';

const CURRENT_PERIOD = '기간 : 20260928 ~ 20261012';
const UPCOMING_PERIOD = '기간 : 20261013 ~ 20261026';

export const studentHomeDashboardFixture: StudentHomeDashboard = {
  hero: {
    date: '2026년 10월 2일',
    heading: '아직 주제를 선정하지 않았어요.',
    description:
      '제안서의 주제 선정 기간이에요.\n아래 진행 단계를 확인해보세요.',
    ctaLabel: '주제 선정 진행 중',
  },
  announcements: [
    {
      id: 'notice-1',
      title: '프로젝트 진행 일정 안내',
      content: '제안서 주제 선정 기간과 제출 일정을 확인해 주세요.',
      date: '26/09/28',
    },
  ],
  milestones: [
    {
      id: 'proposal',
      title: '제안서',
      period: CURRENT_PERIOD,
      statusLabel: '기간 중',
      status: 'in-progress',
      dueDate: '~ 2026/10/12 자정',
      currentStepLabel: '주제 선정',
      interaction: 'collapsible',
      isDetailAvailable: true,
      body: {
        kind: 'topic',
        guidance: '팀원이 등록한 주제 후보를 확인하고, 투표해 주세요.',
        topicCandidates: [
          {
            id: 'topic-1',
            title: 'CineFlow · 영화관 통합 관리 시스템',
            proposer: '김민준',
            description: '상영 일정, 좌석, 예매와 결제 흐름을 통합 관리합니다.',
            voteCount: 3,
            isMine: false,
            isMyVote: true,
          },
          {
            id: 'topic-2',
            title: '도서 대여 관리 프로그램',
            proposer: '이서연',
            description: '도서·회원·대여 및 반납 현황 관리',
            voteCount: 1,
            isMine: true,
            isMyVote: false,
          },
          {
            id: 'topic-3',
            title: '카페 주문 관리 프로그램',
            proposer: '박지훈',
            description: '메뉴·주문·결제 및 제조 상태 관리',
            voteCount: 0,
            isMine: false,
            isMyVote: false,
          },
        ],
        completion: {
          label: '완료 4/5명',
          value: '내 투표 완료',
        },
      },
      rows: [
        {
          id: 'proposal-topic-selection',
          label: '주제 선정',
          value: '내 투표 완료',
          tone: 'primary',
          actionLabel: '후보 추가',
        },
      ],
    },
    {
      id: 'mid-review',
      title: '중간',
      period: UPCOMING_PERIOD,
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '~ 2026/10/26 자정',
      interaction: 'static',
      isDetailAvailable: false,
      rows: [
        {
          id: 'mid-review-submission',
          label: '중간보고서 제출',
          value: '제안서 완료 후 열림',
          tone: 'muted',
          actionLabel: '기간 전',
          actionDisabled: true,
          actionNotice:
            '제안서를 제출하면 이 팀에 한해 조기 활성화될 수 있어요.',
        },
      ],
    },
    {
      id: 'presentation',
      title: '발표',
      period: '기간 : 20261027 ~ 20261109',
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '~ 2026/11/09 자정',
      interaction: 'static',
      isDetailAvailable: false,
      rows: [
        {
          id: 'presentation-material',
          label: '발표 자료',
          value: '기간 전',
          tone: 'muted',
          actionLabel: '기간 전',
          actionDisabled: true,
        },
      ],
    },
    {
      id: 'final-report',
      title: '최종',
      period: '기간 : 20261110 ~ 20261207',
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '~ 2026/12/07 자정',
      interaction: 'static',
      isDetailAvailable: false,
      rows: [
        {
          id: 'final-report-submission',
          label: '최종보고서 제출',
          value: '기간 전',
          tone: 'muted',
          actionLabel: '기간 전',
          actionDisabled: true,
        },
      ],
    },
    {
      id: 'peer-evaluation',
      title: '상호',
      period: '기간 : 20261208 ~ 20261214',
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '~ 2026/12/14 자정',
      interaction: 'static',
      isDetailAvailable: false,
      rows: [
        {
          id: 'peer-evaluation-submission',
          label: '상호 평가',
          value: '기간 전',
          tone: 'muted',
          actionLabel: '기간 전',
          actionDisabled: true,
        },
      ],
    },
  ],
};

export function createStudentHomeDashboardWithTopicBoard(
  board: TopicBoard,
): StudentHomeDashboard {
  const selectedCandidate = board.selection.selectedCandidateId
    ? board.candidates.find(
        candidate => candidate.id === board.selection.selectedCandidateId,
      )
    : undefined;

  return {
    ...studentHomeDashboardFixture,
    hero: selectedCandidate
      ? {
          ...studentHomeDashboardFixture.hero,
          heading: '제안서를 작성해 주세요.',
          description: `${selectedCandidate.title} 주제가 선정됐어요.\n아래 제안서 작성 단계를 진행해 주세요.`,
          ctaLabel: '제안서 작성 진행 중',
        }
      : studentHomeDashboardFixture.hero,
    milestones: studentHomeDashboardFixture.milestones.map(milestone => {
      if (milestone.id !== 'proposal' || milestone.body?.kind !== 'topic') {
        return milestone;
      }

      if (selectedCandidate) {
        return {
          ...milestone,
          currentStepLabel: '제안서 작성',
          body: {
            kind: 'proposal',
            project: {
              title: selectedCandidate.title,
              description: selectedCandidate.description,
            },
            sections: previewSections,
          },
          rows: [
            {
              id: 'proposal-writing',
              label: '제안서 작성',
              value: '작성 가능',
              tone: 'primary',
              actionLabel: '작성하기',
              actionTo: editorSectionTo('proposal', 'team-info'),
              actionNotice: '제안서의 다섯 작성 영역을 차례로 작성합니다.',
            },
          ],
        };
      }

      return {
        ...milestone,
        rows: milestone.rows.map(row =>
          row.id === 'proposal-topic-selection'
            ? {
                ...row,
                tone: board.candidates.some(candidate => candidate.isMyVote)
                  ? 'primary'
                  : 'muted',
                value: board.candidates.some(candidate => candidate.isMyVote)
                  ? '내 투표 완료'
                  : '내 투표 전',
              }
            : row,
        ),
        body: {
          ...milestone.body,
          topicCandidates: board.candidates.map(candidate => ({
            id: candidate.id,
            title: candidate.title,
            proposer: candidate.proposerName,
            description: candidate.description,
            voteCount: candidate.voteCount,
            isMine: candidate.isMine,
            isMyVote: candidate.isMyVote,
          })),
          completion: {
            label: `완료 ${board.participation.votedMemberCount}/${board.participation.totalMemberCount}명`,
            value: board.candidates.some(candidate => candidate.isMyVote)
              ? '내 투표 완료'
              : '내 투표 전',
          },
        },
      };
    }),
  };
}

export function createStudentHomeDashboardWithProposalProgress(
  dashboard: StudentHomeDashboard,
  proposal: Proposal,
): StudentHomeDashboard {
  return {
    ...dashboard,
    milestones: dashboard.milestones.map(milestone => {
      if (milestone.id !== 'proposal' || milestone.body?.kind !== 'proposal') {
        return milestone;
      }

      const sections = proposal.blocks.map(block => ({
        id: block.key,
        label: block.title.replace(/^\d+\.\s*/, ''),
        statusLabel: block.status === 'COMPLETED' ? '작성 완료' : '작성 중',
        status:
          block.status === 'COMPLETED'
            ? ('completed' as const)
            : ('in-progress' as const),
        updatedAt: new Intl.DateTimeFormat('ko-KR', {
          month: 'numeric',
          day: 'numeric',
        }).format(new Date(block.lastSavedAt)),
        to: editorSectionTo('proposal', block.key),
      }));
      const isSubmitted = proposal.status === 'SUBMITTED';
      const allCompleted = proposal.blocks.every(
        block => block.status === 'COMPLETED',
      );

      return {
        ...milestone,
        currentStepLabel: isSubmitted ? '제출 완료' : '제안서 작성',
        status: isSubmitted ? 'completed' : 'in-progress',
        statusLabel: isSubmitted ? '완료' : '기간 중',
        body: { ...milestone.body, sections },
        rows: [
          {
            id: 'proposal-writing',
            label: '제안서 작성',
            value: isSubmitted
              ? '제출 완료'
              : allCompleted
                ? '모든 영역 작성 완료'
                : `작성 완료 ${proposal.blocks.filter(block => block.status === 'COMPLETED').length}/${proposal.blocks.length}`,
            tone: isSubmitted ? 'default' : allCompleted ? 'primary' : 'muted',
            actionLabel: isSubmitted ? '제출 완료' : '작성하기',
            actionDisabled: isSubmitted,
            actionTo: editorSectionTo('proposal', 'team-info'),
            actionNotice: isSubmitted
              ? '제출된 제안서는 읽기 전용으로 확인할 수 있어요.'
              : allCompleted
                ? '팀장은 작성 화면에서 제안서를 제출할 수 있어요.'
                : '작성 영역을 모두 완료 처리하면 팀장이 제출할 수 있어요.',
          },
        ],
      };
    }),
  };
}

function documentSections(
  document: MidReport | Presentation,
  docId: 'mid-review' | 'presentation',
) {
  return document.blocks.map(block => ({
    id: block.key,
    label: block.title.replace(/^\d+\.\s*/, ''),
    statusLabel: block.status === 'COMPLETED' ? '작성 완료' : '작성 중',
    status:
      block.status === 'COMPLETED'
        ? ('completed' as const)
        : ('in-progress' as const),
    to: editorSectionTo(docId, block.key),
  }));
}

function withDocumentProgress(
  dashboard: StudentHomeDashboard,
  milestoneId: 'mid-review' | 'presentation',
  document: MidReport | Presentation,
  documentLabel: string,
): StudentHomeDashboard {
  const submitted = document.status === 'SUBMITTED';
  const completed = document.blocks.every(
    block => block.status === 'COMPLETED',
  );
  return {
    ...dashboard,
    milestones: dashboard.milestones.map(milestone => {
      if (milestone.id !== milestoneId) return milestone;
      const body = milestone.body;
      const hasSections =
        body?.kind === 'mid-review' || body?.kind === 'presentation-material';
      return {
        ...milestone,
        currentStepLabel: submitted ? '제출 완료' : `${documentLabel} 작성`,
        status: submitted ? 'completed' : milestone.status,
        statusLabel: submitted ? '완료' : milestone.statusLabel,
        body: hasSections
          ? { ...body, sections: documentSections(document, milestoneId) }
          : body,
        rows: milestone.rows.map(row => {
          const canOpenEditor =
            row.actionDisabled !== true && Boolean(row.actionTo);

          return {
            ...row,
            value: submitted
              ? '제출 완료'
              : completed
                ? '모든 영역 작성 완료'
                : `작성 완료 ${document.blocks.filter(block => block.status === 'COMPLETED').length}/${document.blocks.length}`,
            tone: submitted ? 'default' : completed ? 'primary' : 'muted',
            actionLabel: submitted ? '제출 완료' : row.actionLabel,
            actionDisabled: submitted || !canOpenEditor,
            actionNotice: submitted
              ? `제출된 ${documentLabel}는 읽기 전용으로 확인할 수 있어요.`
              : canOpenEditor
                ? completed
                  ? `팀장은 작성 화면에서 ${documentLabel}를 제출할 수 있어요.`
                  : '작성 영역을 모두 완료 처리하면 팀장이 제출할 수 있어요.'
                : row.actionNotice,
          };
        }),
      };
    }),
  };
}

export function createStudentHomeDashboardWithMidReportProgress(
  dashboard: StudentHomeDashboard,
  report: MidReport,
) {
  return withDocumentProgress(dashboard, 'mid-review', report, '중간보고서');
}

export function createStudentHomeDashboardWithPresentationProgress(
  dashboard: StudentHomeDashboard,
  presentation: Presentation,
) {
  return withDocumentProgress(
    dashboard,
    'presentation',
    presentation,
    '발표 문서',
  );
}

export const milestonePreviewScenarios = [
  'proposal-topic',
  'proposal-writing',
  'proposal-feedback',
  'mid-report',
  'proposal-feedback-mid-report',
  'mid-feedback',
  'presentation-material',
  'presentation-evaluation',
  'final-report',
  'peer-evaluation',
] as const;

export type MilestonePreviewScenario =
  (typeof milestonePreviewScenarios)[number];

const previewTargetByScenario = {
  'proposal-topic': { milestoneId: 'proposal', stepLabel: '주제 선정' },
  'proposal-writing': { milestoneId: 'proposal', stepLabel: '제안서 작성' },
  'proposal-feedback': { milestoneId: 'proposal', stepLabel: '피드백 반영' },
  'mid-report': { milestoneId: 'mid-review', stepLabel: '중간보고서 작성' },
  'proposal-feedback-mid-report': {
    milestoneId: 'mid-review',
    stepLabel: '중간보고서 작성',
  },
  'mid-feedback': { milestoneId: 'mid-review', stepLabel: '피드백 반영' },
  'presentation-material': {
    milestoneId: 'presentation',
    stepLabel: '발표 자료 작성',
  },
  'presentation-evaluation': {
    milestoneId: 'presentation',
    stepLabel: '발표 평가',
  },
  'final-report': { milestoneId: 'final-report', stepLabel: '최종보고서 제출' },
  'peer-evaluation': { milestoneId: 'peer-evaluation', stepLabel: '상호 평가' },
} as const;

const previewProject = {
  title: 'CineFlow — 영화관 통합 관리 시스템',
  description:
    '상영 일정, 좌석, 예매와 결제 흐름을 통합 관리하는 팀 프로젝트입니다.',
} as const;

const previewSections = [
  {
    id: 'team-info',
    label: '팀 정보',
    statusLabel: '작성 완료',
    status: 'completed' as const,
    to: editorSectionTo('proposal', 'team-info'),
  },
  {
    id: 'topic',
    label: '주제',
    statusLabel: '작성 완료',
    status: 'completed' as const,
    to: editorSectionTo('proposal', 'topic'),
  },
  {
    id: 'data-composition',
    label: '데이터 구성',
    statusLabel: '작성 중',
    status: 'in-progress' as const,
    to: editorSectionTo('proposal', 'data-composition'),
  },
  {
    id: 'screen-composition',
    label: '화면 구성',
    statusLabel: '작성 전',
    status: 'not-started' as const,
    to: editorSectionTo('proposal', 'screen-composition'),
  },
  {
    id: 'team-operations',
    label: '팀 운영 방식',
    statusLabel: '작성 전',
    status: 'not-started' as const,
    to: editorSectionTo('proposal', 'team-operations'),
  },
];

const presentationPreviewSections = [
  {
    id: 'project-overview',
    label: '프로젝트 개요',
    statusLabel: '작성 완료',
    status: 'completed' as const,
    to: editorSectionTo('presentation', 'project-overview'),
  },
  {
    id: 'presentation-material',
    label: '프레젠테이션 자료',
    statusLabel: '작성 중',
    status: 'in-progress' as const,
    to: editorSectionTo('presentation', 'presentation-material'),
  },
  {
    id: 'main-features',
    label: '주요 기능',
    statusLabel: '작성 전',
    status: 'not-started' as const,
    to: editorSectionTo('presentation', 'main-features'),
  },
  {
    id: 'main-screens',
    label: '주요 화면',
    statusLabel: '작성 전',
    status: 'not-started' as const,
    to: editorSectionTo('presentation', 'main-screens'),
  },
  {
    id: 'demo-video',
    label: '시연 영상',
    statusLabel: '작성 전',
    status: 'not-started' as const,
    to: editorSectionTo('presentation', 'demo-video'),
  },
];

function createPreviewBody(
  scenario: MilestonePreviewScenario,
): StudentHomeMilestoneBody {
  const topic = studentHomeDashboardFixture.milestones.find(
    milestone => milestone.id === 'proposal',
  )?.body;

  switch (scenario) {
    case 'proposal-topic':
      if (!topic || topic.kind !== 'topic')
        throw new Error('주제 선정 fixture가 없습니다.');
      return topic;
    case 'proposal-writing':
      return {
        kind: 'proposal',
        project: previewProject,
        sections: previewSections,
      };
    case 'proposal-feedback':
      return {
        kind: 'proposal-feedback',
        feedback: [
          {
            id: 'proposal-feedback',
            title: '이은정 교수님 (2026-10-13 17:25)',
            content: '핵심 사용자와 문제 상황을 더 구체적으로 정리해 주세요.',
          },
        ],
        replyPlaceholder: '피드백 답변은 후속 작업에서 제공돼요.',
        sections: previewSections,
        guide: '피드백을 반영한 뒤 제안서를 다시 제출해 주세요.',
      };
    case 'mid-report':
    case 'proposal-feedback-mid-report':
      return {
        kind: 'mid-review',
        project: previewProject,
        sections: previewSections,
      };
    case 'mid-feedback':
      return {
        kind: 'mid-review-feedback',
        feedback: [
          {
            id: 'mid-feedback',
            title: '이은정 교수님 (2026-10-27 17:25)',
            content: '시연에서 확인한 보완 사항을 제출 이력에 남겨 주세요.',
          },
        ],
        sections: previewSections,
        guide: '피드백 반영 내용과 변경 사항을 확인해 주세요.',
      };
    case 'presentation-material':
      return {
        kind: 'presentation-material',
        project: previewProject,
        sections: presentationPreviewSections,
        recentFile: {
          id: 'presentation-file',
          extension: 'PPT',
          name: 'cineflow-presentation.pptx',
          meta: '서진규 · 2026-11-04 18:20 업로드',
        },
      };
    case 'presentation-evaluation':
      return {
        kind: 'presentation-evaluation',
        project: previewProject,
        orderGuide: '발표 순서 : CineFlow(7팀) > 어플명(1팀) > 이름(3팀)',
        teams: [
          { id: 'team-07', label: 'CineFlow (7팀)', isMine: true },
          { id: 'team-01', label: '어플명 (1팀)', isMine: false },
        ],
        timeGuide: '평가는 금일 강의 시간 중에만 가능합니다.',
      };
    case 'final-report':
      return {
        kind: 'final-report',
        notice: {
          description: '최종보고서와 필수 소스코드 ZIP을 제출해 주세요.',
        },
      };
    case 'peer-evaluation':
      return { kind: 'peer-evaluation', sections: previewSections };
  }
}

export function isMilestonePreviewScenario(
  value: string | null,
): value is MilestonePreviewScenario {
  return milestonePreviewScenarios.some(scenario => scenario === value);
}

export function createStudentHomeDashboardPreview(
  scenario: MilestonePreviewScenario,
): StudentHomeDashboard {
  const target = previewTargetByScenario[scenario];
  const hasProposalFeedbackAndMidReport =
    scenario === 'proposal-feedback-mid-report';
  const currentIndex = studentHomeDashboardFixture.milestones.findIndex(
    milestone => milestone.id === target.milestoneId,
  );

  return {
    ...studentHomeDashboardFixture,
    hero: {
      ...studentHomeDashboardFixture.hero,
      heading: `${target.stepLabel} 단계예요.`,
      description: '개발용 마일스톤 미리보기 상태입니다.',
    },
    milestones: studentHomeDashboardFixture.milestones.map(
      (milestone, index) => {
        const isTargetMilestone = milestone.id === target.milestoneId;
        const isProposalFeedbackAvailable =
          hasProposalFeedbackAndMidReport && milestone.id === 'proposal';
        const isDetailAvailable =
          isTargetMilestone || isProposalFeedbackAvailable;
        const isPastMilestone =
          index < currentIndex && !isProposalFeedbackAvailable;
        return {
          ...milestone,
          isDetailAvailable,
          currentStepLabel: isTargetMilestone
            ? target.stepLabel
            : isProposalFeedbackAvailable
              ? '피드백 반영'
              : undefined,
          interaction: isDetailAvailable ? 'collapsible' : 'static',
          status: isProposalFeedbackAvailable
            ? 'revision-available'
            : index < currentIndex
              ? 'completed'
              : isTargetMilestone
                ? 'in-progress'
                : 'before-period',
          statusLabel: isProposalFeedbackAvailable
            ? '수정 가능'
            : index < currentIndex
              ? '완료'
              : isTargetMilestone
                ? '기간 중'
                : '기간 전',
          dueDate: isProposalFeedbackAvailable
            ? '수정 가능 ~ 2026/10/26 자정'
            : milestone.dueDate,
          rows: isProposalFeedbackAvailable
            ? [
                {
                  id: 'proposal-revision',
                  label: '제안서 수정',
                  value: '피드백 반영 가능',
                  tone: 'primary',
                  actionLabel: '작성하기',
                  actionTo: editorSectionTo('proposal', 'team-info'),
                  actionNotice:
                    '제안서의 다섯 작성 영역을 다시 확인하고 수정합니다.',
                },
              ]
            : isPastMilestone
              ? milestone.rows.map(row => ({
                  ...row,
                  actionLabel: undefined,
                  actionDisabled: true,
                  actionNotice: undefined,
                  tone: 'primary',
                  value: '완료',
                }))
              : isTargetMilestone && milestone.id === 'proposal'
                ? milestone.rows.map(row => ({
                    ...row,
                    id: 'proposal-writing',
                    label: '제안서 작성',
                    value: '작성 가능',
                    tone: 'primary',
                    actionDisabled: false,
                    actionLabel: '작성하기',
                    actionTo: editorSectionTo('proposal', 'team-info'),
                    actionNotice:
                      '제안서의 다섯 작성 영역을 차례로 작성합니다.',
                  }))
                : isTargetMilestone && milestone.id === 'mid-review'
                  ? milestone.rows.map(row => ({
                      ...row,
                      actionDisabled: false,
                      actionLabel: '작성하기',
                      actionTo: editorSectionTo('mid-review', 'topic'),
                      actionNotice:
                        '중간보고서의 다섯 작성 영역을 차례로 작성합니다.',
                      tone: 'primary',
                      value: '작성 가능',
                    }))
                  : isTargetMilestone && milestone.id === 'presentation'
                    ? milestone.rows.map(row => ({
                        ...row,
                        actionDisabled: false,
                        actionLabel: '작성하기',
                        actionTo: editorSectionTo(
                          'presentation',
                          'presentation-material',
                        ),
                        actionNotice:
                          '발표 에디터에서 PPT/PPTX 자료를 등록하거나 교체합니다.',
                        tone: 'primary',
                        value: '작성 가능',
                      }))
                    : isTargetMilestone && milestone.id === 'final-report'
                      ? milestone.rows.map(row => ({
                          ...row,
                          tone: 'primary',
                          actionDisabled: false,
                          actionLabel: '파일 제출',
                          actionNotice:
                            '최종보고서 PDF와 소스코드 ZIP을 제출하거나 교체합니다.',
                          value: '제출 가능',
                        }))
                      : milestone.rows,
          body: isProposalFeedbackAvailable
            ? createPreviewBody('proposal-feedback')
            : isTargetMilestone
              ? createPreviewBody(scenario)
              : undefined,
        };
      },
    ),
  };
}

export function createStudentHomeDashboardWithFinalReportSubmission(
  dashboard: StudentHomeDashboard,
  submission: Submission | undefined,
): StudentHomeDashboard {
  const version = submission?.currentVersion;
  if (!version) return dashboard;

  const submittedFiles = version.artifacts
    .filter(artifact => artifact.kind === 'FILE')
    .map(artifact => ({
      id: artifact.id,
      extension: artifact.name.split('.').pop()?.toUpperCase() ?? 'FILE',
      name: artifact.name,
      meta: `${version.submittedBy.name} · ${new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(version.submittedAt))} 제출`,
    }));

  return {
    ...dashboard,
    milestones: dashboard.milestones.map(milestone => {
      if (milestone.id !== 'final-report') return milestone;

      return {
        ...milestone,
        rows: milestone.rows.map(row =>
          row.id === 'final-report-submission'
            ? {
                ...row,
                actionDisabled: !submission.canSubmitNow,
                actionLabel: submission.canSubmitNow ? '파일 교체' : undefined,
                actionNotice: submission.canSubmitNow
                  ? '최종보고서 PDF와 소스코드 ZIP을 교체합니다.'
                  : submission.submitDisabledReason,
                tone: 'primary',
                value: '제출 완료',
              }
            : row,
        ),
        body:
          milestone.body?.kind === 'final-report'
            ? { ...milestone.body, submittedFiles }
            : milestone.body,
      };
    }),
  };
}
