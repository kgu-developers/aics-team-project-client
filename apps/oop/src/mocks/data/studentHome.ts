import type { StudentHomeDashboard } from '@aics/core';

/**
 * 학생 홈 대시보드 MSW 픽스처.
 * OOP 고정 단계의 분반 운영값과 현재 팀 진행 상태를 함께 표현한다.
 */
export const studentHomeDashboardFixture: StudentHomeDashboard = {
  hero: {
    date: '2026년 10월 2일',
    heading: '아직 제안서를 제출하지 않았어요.',
    description: '제안서 제출 기간이에요.\n아래 진행 단계를 확인해보세요.',
    ctaLabel: '제안서 작성 하러가기',
  },
  announcements: [
    {
      id: 'notice-1',
      title: '전체 점수 공지',
      content: '안녕하세요. 이번 학기 전체 점수 공지입니다.',
      date: '26/12/17',
    },
    {
      id: 'notice-2',
      title: '프로젝트 산출물 제출 안내',
      content: '제출 기한과 파일 형식을 확인해 주세요.',
      date: '26/12/17',
    },
    {
      id: 'notice-3',
      title: '기말 필기 시험 점수 공지',
      content: '점수 확인 및 정정 기간을 안내합니다.',
      date: '26/12/17',
    },
  ],
  milestones: [
    {
      id: 'survey',
      title: '팀 배정 전',
      period: '기간 : 2026/09/28 ~ 2026/10/12',
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '( ~ 10/12 자정 )',
      interaction: 'static',
      isOpen: false,
      rows: [
        {
          id: 'survey-row',
          label: '팀 배정 설문조사',
          value: '설문 완료',
          tone: 'primary',
          actionLabel: '설문하기',
        },
      ],
    },
    {
      id: 'topic',
      title: '제안서',
      period: '기간 : 2026/09/28 ~ 2026/10/12',
      statusLabel: '작성 완료',
      status: 'completed',
      dueDate: '~ 2026/10/12 자정',
      interaction: 'collapsible',
      isOpen: true,
      body: {
        kind: 'proposal',
        guidance:
          '팀원이 등록한 주제 후보를 확인하고, 한 개의 후보에 투표해 주세요.',
        topicCandidates: [
          {
            id: 'topic-1',
            title: '영화관 관리 프로그램',
            proposer: '김민준',
            description: '상영작·좌석·예매 현황을 한 곳에서 관리합니다.',
            voteCount: 3,
            isMine: false,
            isMyVote: true,
          },
          {
            id: 'topic-2',
            title: '도서 대여 관리 프로그램',
            proposer: '이서연',
            description: '도서·회원·대여 및 반납 현황을 관리합니다.',
            voteCount: 1,
            isMine: true,
            isMyVote: false,
          },
          {
            id: 'topic-3',
            title: '카페 주문 관리 프로그램',
            proposer: '박지훈',
            description: '메뉴·주문·결제 및 제조 상태를 관리합니다.',
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
          id: 'topic-row',
          label: '주제 선정',
          value: '내 투표 완료',
          tone: 'primary',
          actionLabel: '등록하기',
        },
      ],
    },
    {
      id: 'mid-report',
      title: '중간 보고서',
      period: '기간 : 2026/10/26 ~ 2026/11/08',
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '( ~ 11/08 자정 )',
      interaction: 'collapsible',
      isOpen: false,
      body: {
        kind: 'submission',
        guidance:
          '중간 보고서는 파일로 제출합니다. 제출 뒤에는 팀원 전원의 확인과 팀장 완료 처리가 필요합니다.',
        artifacts: [
          {
            id: 'mid-report-document',
            label: '중간 보고서',
            detail: '아직 제출된 파일이 없습니다.',
            status: 'missing',
          },
        ],
        reviewSummary:
          '대면 점검 후 받은 피드백은 제출 이력에서 확인할 수 있어요.',
      },
      rows: [
        {
          id: 'mid-report-row',
          label: '중간 보고서 작성',
          value: '완료 4/5',
          tone: 'default',
          actionLabel: '작성하기',
        },
      ],
    },
    {
      id: 'presentation',
      title: '발표',
      period: '기간 : 2026/11/16 ~ 2026/11/29',
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '( ~ 11/29 자정 )',
      interaction: 'collapsible',
      isOpen: false,
      body: {
        kind: 'presentation',
        guidance:
          '발표 자료와 공개용 사전 자료를 준비해 주세요. 공개 자료는 다른 팀도 열람할 수 있습니다.',
        project: {
          title: 'CineFlow — 영화관 통합 관리 시스템',
          description:
            '상영 일정, 좌석, 예매와 결제 흐름을 통합 관리하는 팀 프로젝트입니다.',
        },
        contentItems: [
          {
            id: 'presentation-overview',
            label: '프로젝트 개요',
            statusLabel: '작성 완료',
            status: 'completed',
            updatedAt: '최종 수정: 2026/11/11 19:24',
          },
          {
            id: 'presentation-material',
            label: '프레젠테이션 자료',
            statusLabel: '작성 완료',
            status: 'completed',
            updatedAt: '최종 수정: 2026/11/11 19:24',
          },
          {
            id: 'presentation-features',
            label: '주요 기능',
            statusLabel: '작성 중',
            status: 'in-progress',
          },
          {
            id: 'presentation-screens',
            label: '주요 화면',
            statusLabel: '미작성',
            status: 'not-started',
          },
          {
            id: 'presentation-video',
            label: '시연 영상',
            statusLabel: '작성 완료',
            status: 'completed',
          },
        ],
        evaluationWindow:
          '발표 평가는 2026/11/30 13:00 ~ 16:00에만 가능합니다.',
      },
      rows: [
        {
          id: 'presentation-row',
          label: '발표 자료 작성',
          value: '완료 4/5',
          tone: 'default',
          actionLabel: '작성하기',
        },
      ],
    },
    {
      id: 'final-report',
      title: '최종 보고서',
      period: '기간 : 2026/11/30 ~ 2026/12/13',
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '( ~ 12/13 자정 )',
      interaction: 'collapsible',
      isOpen: false,
      body: {
        kind: 'submission',
        guidance:
          '최종 보고서와 소스코드 압축 파일을 제출한 뒤, 팀원 모두가 확인해야 팀장이 최종 완료할 수 있습니다.',
        artifacts: [
          {
            id: 'final-report-document',
            label: '최종 보고서',
            detail: '아직 제출된 파일이 없습니다.',
            status: 'missing',
          },
          {
            id: 'final-report-source',
            label: '소스코드 압축 파일',
            detail: '필수 제출 항목',
            status: 'missing',
          },
        ],
      },
      rows: [
        {
          id: 'final-report-row',
          label: '작성',
          value: '승인 미완료',
          tone: 'muted',
          actionLabel: '승인 하기',
        },
      ],
    },
    {
      id: 'peer-evaluation',
      title: '상호 평가',
      period: '기간 : 2026/12/14 ~ 2026/12/20',
      statusLabel: '기간 전',
      status: 'before-period',
      dueDate: '( ~ 12/20 자정 )',
      interaction: 'collapsible',
      isOpen: false,
      body: {
        kind: 'peer-evaluation',
        guidance:
          '팀원을 대상으로 기여도와 한 줄 평가를 작성해 주세요. 평가는 제출 뒤에 수정할 수 없습니다.',
        evaluationWindow:
          '평가 가능 기간 : 2026/12/14 00:00 ~ 2026/12/20 23:59',
        completion: {
          label: '평가 대상 4명',
          value: '아직 작성하지 않았어요',
        },
      },
      rows: [
        {
          id: 'peer-evaluation-row',
          label: '평가',
          value: '평가 전',
          tone: 'muted',
          actionLabel: '평가하기',
        },
      ],
    },
  ],
};
