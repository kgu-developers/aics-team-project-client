import type {
  MidReportFeedback,
  MidReport,
  MyPeerEvaluationResponse,
  Presentation,
  PresentationEvaluationOverview,
  Proposal,
  ProposalFeedbackResponse,
  Submission,
  StudentHomeDashboard,
  StudentHomeMilestoneBody,
  StudentHomeSubmissionMaterial,
  TopicBoard,
} from '@aics/core';

import { editorSectionTo } from '~/app/constants/editorSections';
import { ROUTES } from '~/app/constants/routes';

import {
  demoMidReportSubmissionId,
  demoProposalReviewId,
} from './studentFeedback';

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
      id: '10',
      title: '[첨부 테스트] 이미지 미리보기 확인',
      content: '이미지 첨부파일이 본문 하단에 표시되는지 확인해 주세요.',
      date: '26/08/27',
    },
    {
      id: '11',
      title: '[첨부 테스트] PDF 다운로드 확인',
      content: 'PDF 첨부파일의 다운로드 동작을 확인해 주세요.',
      date: '26/08/27',
    },
    {
      id: '12',
      title: '[읽음 테스트] 첨부파일 없는 공지',
      content: '상세 확인 후 새 글 표시가 사라지는지 확인해 주세요.',
      date: '26/08/27',
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
      if (
        milestone.id !== 'proposal' ||
        (milestone.body?.kind !== 'proposal' &&
          milestone.body?.kind !== 'proposal-feedback')
      ) {
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
      const isFeedbackRevision =
        milestone.body.kind === 'proposal-feedback' &&
        proposal.status === 'REVISION_REQUESTED';
      const isFeedbackResubmitted =
        milestone.body.kind === 'proposal-feedback' &&
        isSubmitted &&
        Boolean(proposal.revision?.resubmittedAt);
      const allCompleted = proposal.blocks.every(
        block => block.status === 'COMPLETED',
      );

      if (milestone.body.kind === 'proposal-feedback') {
        return {
          ...milestone,
          currentStepLabel: isFeedbackResubmitted ? '답변 작성' : '피드백 반영',
          status: isFeedbackRevision ? 'revision-available' : 'in-progress',
          statusLabel: isFeedbackRevision ? '수정 가능' : '답변 필요',
          body: { ...milestone.body, sections },
          rows: [
            {
              id: 'proposal-revision',
              label: '제안서 수정',
              value: isFeedbackRevision
                ? allCompleted
                  ? '수정 영역 완료'
                  : '피드백 반영 중'
                : '수정본 재제출 완료',
              tone: isFeedbackRevision ? 'primary' : 'default',
              actionLabel: isFeedbackRevision ? '수정하기' : '재제출 완료',
              actionDisabled: !isFeedbackRevision,
              actionTo: editorSectionTo(
                'proposal',
                proposal.revision?.affectedBlockKeys[0] ?? 'team-info',
              ),
              actionNotice: isFeedbackRevision
                ? '피드백 대상 영역을 실제로 수정하고 완료 처리한 뒤 다시 제출해 주세요.'
                : '수정본을 다시 제출했어요. 이제 반영 답변을 남길 수 있어요.',
            },
          ],
        };
      }

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
  const visibleBlocks =
    docId === 'presentation'
      ? document.blocks.filter(block => block.key === 'presentation-material')
      : document.blocks;

  return visibleBlocks.map(block => ({
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
  const visibleBlocks =
    milestoneId === 'presentation'
      ? document.blocks.filter(block => block.key === 'presentation-material')
      : document.blocks;
  const submitted = document.status === 'SUBMITTED';
  const completed = visibleBlocks.every(block => block.status === 'COMPLETED');
  return {
    ...dashboard,
    milestones: dashboard.milestones.map(milestone => {
      if (milestone.id !== milestoneId) return milestone;
      const body = milestone.body;
      const hasSections =
        body?.kind === 'mid-review' ||
        body?.kind === 'mid-review-feedback' ||
        body?.kind === 'presentation-material';
      const isFeedbackRevision =
        body?.kind === 'mid-review-feedback' &&
        document.status === 'REVISION_REQUESTED';
      const isFeedbackResubmitted =
        body?.kind === 'mid-review-feedback' &&
        submitted &&
        Boolean(document.revision?.resubmittedAt);
      return {
        ...milestone,
        currentStepLabel: isFeedbackResubmitted
          ? '반영 기록 작성'
          : isFeedbackRevision
            ? '피드백 반영'
            : submitted
              ? '제출 완료'
              : milestoneId === 'presentation'
                ? '발표 자료 제출'
                : `${documentLabel} 작성`,
        status: isFeedbackRevision
          ? 'revision-available'
          : isFeedbackResubmitted
            ? 'in-progress'
            : submitted
              ? 'completed'
              : milestone.status,
        statusLabel: isFeedbackRevision
          ? '수정 가능'
          : isFeedbackResubmitted
            ? '기록 필요'
            : submitted
              ? '완료'
              : milestone.statusLabel,
        body: hasSections
          ? { ...body, sections: documentSections(document, milestoneId) }
          : body,
        rows: milestone.rows.map(row => {
          const actionTo =
            isFeedbackRevision && document.revision?.affectedBlockKeys[0]
              ? editorSectionTo(
                  milestoneId,
                  document.revision.affectedBlockKeys[0],
                )
              : row.actionTo;
          const canOpenEditor =
            row.actionDisabled !== true && Boolean(actionTo);

          return {
            ...row,
            actionTo,
            value: isFeedbackRevision
              ? completed
                ? '수정 영역 완료'
                : '피드백 반영 중'
              : submitted
                ? '제출 완료'
                : completed
                  ? '모든 영역 작성 완료'
                  : `작성 완료 ${visibleBlocks.filter(block => block.status === 'COMPLETED').length}/${visibleBlocks.length}`,
            tone:
              submitted && !isFeedbackRevision
                ? 'default'
                : completed
                  ? 'primary'
                  : 'muted',
            actionLabel: isFeedbackRevision
              ? '수정하기'
              : submitted
                ? isFeedbackResubmitted
                  ? '재제출 완료'
                  : '제출 완료'
                : row.actionLabel,
            actionDisabled:
              (submitted && !isFeedbackRevision) || !canOpenEditor,
            actionNotice: isFeedbackRevision
              ? '피드백 대상 영역을 실제로 수정하고 완료 처리한 뒤 다시 제출해 주세요.'
              : submitted
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
    '발표 자료',
  );
}

export const milestonePreviewScenarios = [
  'proposal-topic',
  'proposal-writing',
  'proposal-feedback',
  'proposal-feedback-ready',
  'mid-report',
  'proposal-feedback-mid-report',
  'mid-feedback',
  'mid-feedback-ready',
  'presentation-material-empty',
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
  'proposal-feedback-ready': {
    milestoneId: 'proposal',
    stepLabel: '답변 작성',
  },
  'mid-report': { milestoneId: 'mid-review', stepLabel: '중간보고서 작성' },
  'proposal-feedback-mid-report': {
    milestoneId: 'mid-review',
    stepLabel: '중간보고서 작성',
  },
  'mid-feedback': { milestoneId: 'mid-review', stepLabel: '피드백 반영' },
  'mid-feedback-ready': {
    milestoneId: 'mid-review',
    stepLabel: '반영 기록 작성',
  },
  'presentation-material': {
    milestoneId: 'presentation',
    stepLabel: '발표 자료 제출',
  },
  'presentation-material-empty': {
    milestoneId: 'presentation',
    stepLabel: '발표 자료 제출',
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

const midReportPreviewSections = [
  {
    id: 'topic',
    label: '주제',
    statusLabel: '작성 완료',
    status: 'completed' as const,
    to: editorSectionTo('mid-review', 'topic'),
  },
  {
    id: 'gui-design',
    label: '화면 GUI 설계',
    statusLabel: '작성 완료',
    status: 'completed' as const,
    to: editorSectionTo('mid-review', 'gui-design'),
  },
  {
    id: 'engine-design',
    label: '엔진부 설계',
    statusLabel: '작성 중',
    status: 'in-progress' as const,
    to: editorSectionTo('mid-review', 'engine-design'),
  },
  {
    id: 'project-plan',
    label: '팀프로젝트 진행 계획',
    statusLabel: '작성 전',
    status: 'not-started' as const,
    to: editorSectionTo('mid-review', 'project-plan'),
  },
];

const presentationPreviewSections = [
  {
    id: 'presentation-material',
    label: '발표 자료 제출',
    statusLabel: '작성 중',
    status: 'in-progress' as const,
    to: editorSectionTo('presentation', 'presentation-material'),
  },
];

const peerEvaluationPreviewSections = [
  {
    id: 'project-evaluation',
    label: '프로젝트 평가',
    statusLabel: '작성 전',
    status: 'not-started' as const,
  },
  {
    id: 'teammate-contribution',
    label: '팀원 기여도 평가',
    statusLabel: '작성 전',
    status: 'not-started' as const,
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
    case 'proposal-feedback-ready':
      return {
        kind: 'proposal-feedback',
        reviewId: demoProposalReviewId,
        feedback: [
          {
            id: 'proposal-feedback',
            title: '이은정 교수님 (2026-10-13 17:25)',
            content: '핵심 사용자와 문제 상황을 더 구체적으로 정리해 주세요.',
          },
        ],
        canSubmitResponse: false,
        responseBlockedReason:
          '제안서를 수정해 다시 제출한 뒤 반영 답변을 남겨 주세요.',
        replyPlaceholder: '피드백을 반영한 내용을 작성해 주세요.',
        sections: previewSections,
        guide: '피드백을 반영한 뒤 제안서를 다시 제출해 주세요.',
      };
    case 'mid-report':
    case 'proposal-feedback-mid-report':
      return {
        kind: 'mid-review',
        project: previewProject,
        sections: midReportPreviewSections,
      };
    case 'mid-feedback':
    case 'mid-feedback-ready':
      return {
        kind: 'mid-review-feedback',
        submissionId: demoMidReportSubmissionId,
        feedback: [],
        canSubmitResponse: false,
        responseBlockedReason:
          '중간보고서를 수정해 다시 제출한 뒤 반영 내용을 남겨 주세요.',
        sections: midReportPreviewSections,
        guide:
          '대면 피드백에서 들은 내용과 이를 어떻게 반영했는지 먼저 남겨 주세요.',
      };
    case 'presentation-material':
    case 'presentation-material-empty':
      return {
        kind: 'presentation-material',
        project: previewProject,
        sections: presentationPreviewSections,
        materials: [
          {
            id: 'PRESENTATION_DEMO_URL',
            kind: 'LINK',
            label: '시연 URL',
            extension: 'URL',
            value: 'https://demo.example.com/cineflow',
            href: 'https://demo.example.com/cineflow',
          },
          {
            id: 'PRESENTATION_PDF',
            kind: 'FILE',
            label: '발표 자료 PDF',
            extension: 'PDF',
            value: 'cineflow-presentation.pdf',
          },
          {
            id: 'SOURCE_CODE_ZIP',
            kind: 'FILE',
            label: '실행 소스 ZIP',
            extension: 'ZIP',
            value: 'cineflow-demo.zip',
          },
        ],
        submission: {
          submittedBy: '서진규',
          submittedAt: '2026-11-04T18:20:00+09:00',
          updatedAt: '2026-11-04T18:30:00+09:00',
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
        materials: [
          {
            id: 'FINAL_REPORT_PDF',
            kind: 'FILE',
            label: '최종보고서 PDF',
            extension: 'PDF',
          },
          {
            id: 'SOURCE_CODE_ZIP',
            kind: 'FILE',
            label: '최종 소스코드 ZIP',
            extension: 'ZIP',
          },
        ],
      };
    case 'peer-evaluation':
      return {
        kind: 'peer-evaluation',
        sections: peerEvaluationPreviewSections,
      };
  }
}

export function createStudentHomeDashboardWithFeedbackSubmissions(
  dashboard: StudentHomeDashboard,
  proposalResponse: ProposalFeedbackResponse | undefined,
  midReportFeedback: MidReportFeedback | undefined,
  proposal: Proposal,
  midReport: MidReport,
): StudentHomeDashboard {
  return {
    ...dashboard,
    milestones: dashboard.milestones.map(milestone => {
      if (milestone.body?.kind === 'proposal-feedback') {
        const isFeedbackComplete = Boolean(proposalResponse);
        return {
          ...milestone,
          currentStepLabel: isFeedbackComplete
            ? '답변 제출 완료'
            : milestone.currentStepLabel,
          status: isFeedbackComplete ? 'completed' : milestone.status,
          statusLabel: isFeedbackComplete ? '반영 완료' : milestone.statusLabel,
          body: {
            ...milestone.body,
            studentResponse: proposalResponse,
            canSubmitResponse:
              !proposalResponse &&
              proposal.status === 'SUBMITTED' &&
              Boolean(proposal.revision?.resubmittedAt),
            responseBlockedReason:
              proposalResponse ||
              (proposal.status === 'SUBMITTED' &&
                proposal.revision?.resubmittedAt)
                ? undefined
                : '제안서를 수정해 다시 제출한 뒤 반영 답변을 남겨 주세요.',
          },
        };
      }
      if (milestone.body?.kind === 'mid-review-feedback') {
        const isFeedbackComplete = Boolean(midReportFeedback);
        return {
          ...milestone,
          currentStepLabel: isFeedbackComplete
            ? '반영 기록 완료'
            : milestone.currentStepLabel,
          status: isFeedbackComplete ? 'completed' : milestone.status,
          statusLabel: isFeedbackComplete ? '반영 완료' : milestone.statusLabel,
          body: {
            ...milestone.body,
            studentFeedback: midReportFeedback,
            canSubmitResponse:
              !midReportFeedback &&
              midReport.status === 'SUBMITTED' &&
              Boolean(midReport.revision?.resubmittedAt),
            responseBlockedReason:
              midReportFeedback ||
              (midReport.status === 'SUBMITTED' &&
                midReport.revision?.resubmittedAt)
                ? undefined
                : '중간보고서를 수정해 다시 제출한 뒤 반영 내용을 남겨 주세요.',
          },
        };
      }
      return milestone;
    }),
  };
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
      ctaLabel: `${target.stepLabel} 확인`,
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
                        '중간보고서의 네 작성 영역을 차례로 작성합니다.',
                      tone: 'primary',
                      value: '작성 가능',
                    }))
                  : isTargetMilestone &&
                      milestone.id === 'presentation' &&
                      scenario === 'presentation-evaluation'
                    ? milestone.rows.map(row => ({
                        ...row,
                        actionDisabled: false,
                        actionLabel: '평가하기',
                        actionTo: ROUTES.STUDENT.PRESENTATION_EVALUATION,
                        actionNotice:
                          '다른 팀의 발표 자료를 확인하고 내 평가를 저장·제출합니다.',
                        tone: 'primary',
                        value: '평가 가능',
                      }))
                    : isTargetMilestone && milestone.id === 'presentation'
                      ? milestone.rows.map(row => ({
                          ...row,
                          actionDisabled: false,
                          actionLabel: '제출하기',
                          actionTo: editorSectionTo(
                            'presentation',
                            'presentation-material',
                          ),
                          actionNotice:
                            '시연 URL, PDF, ZIP을 등록하거나 교체합니다.',
                          tone: 'primary',
                          value: '작성 가능',
                        }))
                      : isTargetMilestone && milestone.id === 'peer-evaluation'
                        ? milestone.rows.map(row => ({
                            ...row,
                            actionDisabled: false,
                            actionLabel: '평가하기',
                            actionTo: ROUTES.STUDENT.PEER_REVIEW,
                            actionNotice:
                              '팀원 기여도와 개인보고서를 저장·제출합니다.',
                            tone: 'primary',
                            value: '평가 가능',
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

function evaluationSectionStatus(started: boolean, completed: boolean) {
  if (completed) {
    return { status: 'completed' as const, statusLabel: '작성 완료' };
  }
  if (started) {
    return { status: 'in-progress' as const, statusLabel: '작성 중' };
  }
  return { status: 'not-started' as const, statusLabel: '작성 전' };
}

function getPeerEvaluationSectionProgress(
  response: MyPeerEvaluationResponse,
  targetCount: number,
) {
  const reflection = response.answers.find(
    answer => answer.kind === 'REFLECTION',
  );
  const projectValues = [
    response.selfContribution,
    response.projectReviewComment,
    reflection?.comment ?? '',
  ];
  const teammateAnswers = response.answers.filter(
    answer => answer.kind === 'TEAMMATE_CONTRIBUTION',
  );
  const hasStartedTeammateEvaluation = teammateAnswers.some(
    answer =>
      answer.contributionPercent > 0 ||
      Boolean(answer.contributionDetail.trim()) ||
      Boolean(answer.teammateAssessment.trim()),
  );
  const isSubmitted = response.status === 'SUBMITTED';

  return {
    project: evaluationSectionStatus(
      projectValues.some(value => value.trim()),
      isSubmitted || projectValues.every(value => value.trim()),
    ),
    teammate: evaluationSectionStatus(
      hasStartedTeammateEvaluation,
      isSubmitted ||
        (targetCount > 0 &&
          teammateAnswers.length === targetCount &&
          teammateAnswers.every(
            answer =>
              answer.contributionDetail.trim() &&
              answer.teammateAssessment.trim(),
          )),
    ),
  };
}

export function createStudentHomeDashboardWithEvaluationProgress(
  dashboard: StudentHomeDashboard,
  presentation: PresentationEvaluationOverview,
  peerResponse: MyPeerEvaluationResponse | undefined,
  peerTargetCount: number,
): StudentHomeDashboard {
  const evaluatableTeamIds = new Set(
    presentation.teams.filter(team => !team.isMyTeam).map(team => team.id),
  );
  const currentEvaluations = presentation.myEvaluations.filter(evaluation =>
    evaluatableTeamIds.has(evaluation.rateeTeamId),
  );
  const submittedCount = currentEvaluations.filter(
    evaluation => evaluation.status === 'SUBMITTED',
  ).length;
  const draftCount = currentEvaluations.filter(
    evaluation => evaluation.status === 'DRAFT',
  ).length;
  const targetCount = evaluatableTeamIds.size;
  const isPresentationEvaluationAvailable =
    presentation.windowState === 'OPEN' ||
    presentation.windowState === 'CLOSED';
  const inactiveEvaluationLabel =
    presentation.windowState === 'NOT_CONFIGURED' ? '일정 미정' : '기간 전';

  return {
    ...dashboard,
    milestones: dashboard.milestones.map(milestone => {
      if (milestone.body?.kind === 'presentation-evaluation') {
        return {
          ...milestone,
          currentStepLabel: '발표 평가',
          status: isPresentationEvaluationAvailable
            ? ('in-progress' as const)
            : ('before-period' as const),
          statusLabel: isPresentationEvaluationAvailable
            ? presentation.windowState === 'CLOSED'
              ? '평가 가능'
              : '기간 중'
            : inactiveEvaluationLabel,
          rows: milestone.rows.map(row => {
            if (row.id !== 'presentation-material' || targetCount === 0)
              return row;

            if (!isPresentationEvaluationAvailable)
              return {
                ...row,
                value: inactiveEvaluationLabel,
                tone: 'muted' as const,
                actionLabel: inactiveEvaluationLabel,
                actionDisabled: true,
                actionNotice: presentation.windowMessage,
              };

            if (submittedCount === targetCount) {
              return {
                ...row,
                value: `평가 완료 ${submittedCount}/${targetCount}팀`,
                tone: 'default' as const,
                actionLabel: '평가 내역 보기',
                actionDisabled: false,
                actionNotice: '제출한 팀별 발표 평가 내역을 확인합니다.',
              };
            }
            if (draftCount > 0) {
              return {
                ...row,
                value:
                  submittedCount > 0
                    ? `제출 완료 ${submittedCount}/${targetCount}팀 · 작성 중 ${draftCount}팀`
                    : `작성 중 ${draftCount}/${targetCount}팀`,
                tone: 'primary' as const,
                actionLabel: '이어 평가',
                actionDisabled: false,
                actionNotice: '저장한 발표 평가를 이어서 작성합니다.',
              };
            }
            if (submittedCount > 0) {
              return {
                ...row,
                value: `제출 완료 ${submittedCount}/${targetCount}팀`,
                tone: 'primary' as const,
                actionLabel: '평가 계속',
                actionDisabled: false,
                actionNotice: '남은 팀의 발표 평가를 작성합니다.',
              };
            }
            return {
              ...row,
              value: '평가 가능',
              tone: 'primary' as const,
              actionLabel: '평가하기',
              actionDisabled: false,
              actionNotice:
                '다른 팀의 발표 자료를 확인하고 내 평가를 저장·제출합니다.',
            };
          }),
          body: {
            ...milestone.body,
            teams: presentation.teams.map(team => ({
              id: team.id,
              label: team.name,
              isMine: team.isMyTeam,
            })),
          },
        };
      }

      if (milestone.body?.kind === 'peer-evaluation' && peerResponse) {
        const sectionProgress = getPeerEvaluationSectionProgress(
          peerResponse,
          peerTargetCount,
        );
        const isSubmitted = peerResponse.status === 'SUBMITTED';

        return {
          ...milestone,
          rows: milestone.rows.map(row =>
            row.id === 'peer-evaluation-submission'
              ? {
                  ...row,
                  value: isSubmitted ? '제출 완료' : '작성 중',
                  tone: isSubmitted
                    ? ('default' as const)
                    : ('primary' as const),
                  actionLabel: isSubmitted ? '제출 내역 보기' : '이어 작성',
                  actionDisabled: false,
                  actionNotice: isSubmitted
                    ? '제출한 상호평가와 개인보고서를 확인합니다.'
                    : '저장한 상호평가와 개인보고서를 이어서 작성합니다.',
                }
              : row,
          ),
          body: {
            ...milestone.body,
            sections: milestone.body.sections.map(section => ({
              ...section,
              ...(section.id === 'project-evaluation'
                ? sectionProgress.project
                : section.id === 'teammate-contribution'
                  ? sectionProgress.teammate
                  : {}),
            })),
          },
        };
      }

      return milestone;
    }),
  };
}

function createSubmissionMaterials(
  submission: Submission,
): StudentHomeSubmissionMaterial[] {
  const artifacts = submission.currentVersion?.artifacts ?? [];
  const fileArtifacts = artifacts.filter(artifact => artifact.kind === 'FILE');
  const usedFileIds = new Set<string>();

  const linkMaterials = (submission.linkRules ?? []).map(rule => {
    const artifact = artifacts.find(
      candidate => candidate.kind === 'LINK' && candidate.label === rule.label,
    );

    return {
      id: rule.key,
      kind: 'LINK' as const,
      label: rule.label,
      extension: 'URL',
      value: artifact?.kind === 'LINK' ? artifact.url : undefined,
      href: artifact?.kind === 'LINK' ? artifact.url : undefined,
    };
  });

  const fileMaterials = submission.artifactRules.map(rule => {
    const artifact = fileArtifacts.find(candidate => {
      if (usedFileIds.has(candidate.id)) return false;
      const extension = candidate.name.split('.').pop()?.toLowerCase();
      return extension ? rule.allowedExtensions.includes(extension) : false;
    });
    if (artifact) usedFileIds.add(artifact.id);

    return {
      id: rule.key,
      kind: 'FILE' as const,
      label: rule.label,
      extension: rule.allowedExtensions[0]?.toUpperCase() ?? 'FILE',
      value: artifact?.name,
    };
  });

  return [...linkMaterials, ...fileMaterials];
}

export function createStudentHomeDashboardWithPresentationSubmission(
  dashboard: StudentHomeDashboard,
  submission: Submission | undefined,
): StudentHomeDashboard {
  if (!submission) return dashboard;

  const version = submission.currentVersion;

  return {
    ...dashboard,
    milestones: dashboard.milestones.map(milestone =>
      milestone.body?.kind === 'presentation-material'
        ? {
            ...milestone,
            body: {
              ...milestone.body,
              materials: createSubmissionMaterials(submission),
              submission: version
                ? {
                    submittedBy: version.submittedBy.name,
                    submittedAt: version.submittedAt,
                    updatedAt: version.updatedAt,
                  }
                : undefined,
            },
          }
        : milestone,
    ),
  };
}

export function createStudentHomeDashboardWithFinalReportSubmission(
  dashboard: StudentHomeDashboard,
  submission: Submission | undefined,
  isTeamLeader = true,
): StudentHomeDashboard {
  const version = submission?.currentVersion;
  if (!submission) return dashboard;

  return {
    ...dashboard,
    milestones: dashboard.milestones.map(milestone => {
      if (milestone.id !== 'final-report') return milestone;

      return {
        ...milestone,
        currentStepLabel: isTeamLeader
          ? milestone.currentStepLabel
          : version
            ? '최종보고서 승인'
            : '최종보고서 제출 대기',
        rows: milestone.rows.map(row =>
          row.id === 'final-report-submission'
            ? isTeamLeader
              ? {
                  ...row,
                  actionDisabled: !submission.canSubmitNow,
                  actionLabel: version ? '파일 교체' : '파일 제출',
                  actionNotice: submission.canSubmitNow
                    ? version
                      ? '최종보고서 PDF와 소스코드 ZIP을 교체합니다.'
                      : '최종보고서 PDF와 소스코드 ZIP을 제출합니다.'
                    : submission.submitDisabledReason,
                  tone: version ? ('primary' as const) : row.tone,
                  value: version ? '제출 완료' : '미제출',
                }
              : {
                  ...row,
                  label: version ? '최종보고서 승인' : '최종보고서 제출 대기',
                  actionDisabled: !version || !submission.memberConsent,
                  actionLabel: version
                    ? submission.memberConsent?.isConfirmedByMe
                      ? '승인 취소'
                      : '승인하기'
                    : '제출 대기',
                  actionNotice: version
                    ? submission.memberConsent?.isConfirmedByMe
                      ? '최종보고서 승인을 취소합니다.'
                      : '팀장이 제출한 최종보고서를 확인하고 승인합니다.'
                    : '팀장이 최종보고서를 제출한 뒤 승인할 수 있어요.',
                  tone: version ? ('primary' as const) : ('muted' as const),
                  value:
                    version && submission.memberConsent
                      ? `팀원 승인 ${submission.memberConsent.confirmedCount}/${submission.memberConsent.totalCount}`
                      : '파일 제출 전',
                }
            : row,
        ),
        body:
          milestone.body?.kind === 'final-report'
            ? {
                ...milestone.body,
                submissionId: version ? submission.id : undefined,
                memberConsent: version ? submission.memberConsent : undefined,
                materials: createSubmissionMaterials(submission),
                submission: version
                  ? {
                      submittedBy: version.submittedBy.name,
                      submittedAt: version.submittedAt,
                      updatedAt: version.updatedAt,
                    }
                  : undefined,
              }
            : milestone.body,
      };
    }),
  };
}
