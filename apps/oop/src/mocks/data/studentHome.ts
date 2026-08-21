import type {
  Submission,
  StudentHomeDashboard,
  StudentHomeMilestoneBody,
  TopicBoard,
} from '@aics/core';

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
            title: '영화관 관리 프로그램',
            proposer: '김민준',
            description: '상영작·좌석·예매 현황을 한 곳에서 관리',
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
  return {
    ...studentHomeDashboardFixture,
    milestones: studentHomeDashboardFixture.milestones.map(milestone => {
      if (milestone.id !== 'proposal' || milestone.body?.kind !== 'topic') {
        return milestone;
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
    id: 'overview',
    label: '프로젝트 개요',
    statusLabel: '작성 완료',
    status: 'completed' as const,
  },
  {
    id: 'content',
    label: '작성 내용',
    statusLabel: '작성 중',
    status: 'in-progress' as const,
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
        sections: previewSections,
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
        uploadHint: 'ZIP up to 50MB',
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
                  actionLabel: '수정 가능',
                  actionDisabled: true,
                  actionNotice: '제안서 편집·재제출은 후속 작업에서 제공돼요.',
                },
              ]
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
