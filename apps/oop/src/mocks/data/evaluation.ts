import type {
  EvaluationWindowState,
  MyPeerEvaluationResponse,
  MyPresentationEvaluation,
  PeerEvaluationTarget,
  PresentationEvaluationCriterion,
  PresentationEvaluationOverview,
  PresentationEvaluationTeam,
} from '@aics/core';

export const evaluationSectionId = 'oop-2026-2-01';
export const presentationEvaluationMilestoneId = 'presentation';
export const presentationEvaluationOpensAt = '2026-11-10T14:00:00+09:00';
export const presentationEvaluationClosesAt = '2026-11-10T16:00:00+09:00';
export const peerEvaluationFormId = 'peer-evaluation-2026';
export const evaluationTeamId = 'team-07';

type EvaluationMembership = {
  sectionId: string;
  teamId: string;
  memberUserIds: readonly string[];
};

const evaluationTeamMemberIds = [
  '20260001',
  '20260003',
  '20260004',
  '20260005',
] as const;

// 개발 계약 검증용 projection이며 실제 백엔드 분반/팀 권한 검증을 대신하지 않는다.
const evaluationMembersByUserId: Record<string, PeerEvaluationTarget> = {
  '20260001': {
    userId: '20260001',
    name: 'OOP 데모 학생 A',
    role: '팀장 · 개발',
  },
  '20260003': {
    userId: '20260003',
    name: 'OOP 데모 학생 B',
    role: '기획 · 개발',
  },
  '20260004': {
    userId: '20260004',
    name: 'OOP 데모 학생 C',
    role: '디자인 · 테스트',
  },
  '20260005': {
    userId: '20260005',
    name: 'OOP 데모 학생 D',
    role: '개발 · 문서화',
  },
  '20260021': {
    userId: '20260021',
    name: 'OOP 타 분반 학생',
    role: '개발',
  },
};

const evaluationMembershipByUserId: Record<string, EvaluationMembership> = {
  '20260001': {
    sectionId: evaluationSectionId,
    teamId: evaluationTeamId,
    memberUserIds: evaluationTeamMemberIds,
  },
  '20260003': {
    sectionId: evaluationSectionId,
    teamId: evaluationTeamId,
    memberUserIds: evaluationTeamMemberIds,
  },
  '20260004': {
    sectionId: evaluationSectionId,
    teamId: evaluationTeamId,
    memberUserIds: evaluationTeamMemberIds,
  },
  '20260005': {
    sectionId: evaluationSectionId,
    teamId: evaluationTeamId,
    memberUserIds: evaluationTeamMemberIds,
  },
  '20260021': {
    sectionId: 'oop-2026-2-02',
    teamId: 'team-21',
    memberUserIds: ['20260021'],
  },
};

export const presentationEvaluationCriteria: PresentationEvaluationCriterion[] =
  [
    {
      id: 'project-completeness',
      title: '프로젝트 완성도',
      description: '문제 정의와 결과물 완성도',
      minScore: 1,
      maxScore: 5,
    },
    {
      id: 'feature-implementation',
      title: '기능 구성과 구현',
      description: '핵심 기능 구성/구현 설득력',
      minScore: 1,
      maxScore: 5,
    },
    {
      id: 'presentation-delivery',
      title: '발표 전달력',
      description: '자료 구성/발표 전달력',
      minScore: 1,
      maxScore: 5,
    },
  ];

function submittedMaterial(slug: string, fileName: string) {
  return {
    artifactId: `${slug}-presentation-file`,
    fileName,
    fileUrl: `/evaluation/${slug}-presentation.pdf`,
    mimeType: 'application/pdf' as const,
    submittedAt: '2026-11-09T22:10:00+09:00',
    previewPages: [1, 2, 3].map(pageNumber => ({
      id: `${slug}-slide-${pageNumber}`,
      pageNumber,
      imageUrl: `/evaluation/${slug}-slide-${pageNumber}.png`,
      alt: `${fileName} ${pageNumber}페이지 미리보기`,
    })),
  };
}

function screen(
  slug: string,
  index: number,
  name: string,
  description: string,
) {
  return {
    id: `${slug}-screen-${index}`,
    name,
    description,
    imageUrl: `/evaluation/${slug}-screen-${index}.svg`,
  };
}

function feature(id: string, name: string, description: string) {
  return { id, name, description };
}

type PresentationEvaluationTeamFixture = Omit<
  PresentationEvaluationTeam,
  'isMyTeam'
>;

const teams: PresentationEvaluationTeamFixture[] = [
  {
    id: evaluationTeamId,
    name: 'CineFlow (7팀)',
    order: 1,
    scheduledAt: '2026-11-10 14:00',
    progress: 'COMPLETED',
    presentation: {
      projectTitle: 'CineFlow · 영화관 통합 관리 시스템',
      projectIntroduction:
        '상영 일정, 좌석, 예매와 결제 흐름을 한 곳에서 관리합니다.',
      submittedMaterial: submittedMaterial(
        'cineflow',
        'cineflow-presentation.pdf',
      ),
      mainScreens: [
        screen(
          'cineflow',
          1,
          '상영 일정 대시보드',
          '상영관별 일정을 확인합니다.',
        ),
        screen(
          'cineflow',
          2,
          '좌석 선택 및 예매 화면',
          '좌석과 결제 상태를 확인합니다.',
        ),
      ],
      mainFeatures: [
        feature(
          'schedule',
          '상영관별 일정 관리',
          '상영 시간과 상영관을 관리합니다.',
        ),
        feature(
          'booking',
          '실시간 좌석 상태와 예매 처리',
          '좌석 선택부터 결제까지 연결합니다.',
        ),
      ],
      demoFlow: [
        '관리자가 상영 일정을 등록합니다.',
        '사용자가 좌석을 선택하고 예매합니다.',
      ],
    },
  },
  {
    id: 'team-01',
    name: 'BookLoop (1팀)',
    order: 2,
    scheduledAt: '2026-11-10 14:15',
    progress: 'CURRENT',
    presentation: {
      projectTitle: 'BookLoop · 도서 대여 관리 프로그램',
      projectIntroduction:
        '교내 도서의 대여, 반납, 연체 현황을 명확하게 관리합니다.',
      submittedMaterial: submittedMaterial(
        'bookloop',
        'bookloop-final-presentation.pdf',
      ),
      mainScreens: [
        screen(
          'bookloop',
          1,
          '도서 검색 화면',
          '도서명과 회원 정보로 검색합니다.',
        ),
        screen(
          'bookloop',
          2,
          '대여 현황 화면',
          '대여·반납·연체 상태를 확인합니다.',
        ),
      ],
      mainFeatures: [
        feature(
          'book-search',
          '도서·회원 검색',
          '대여할 도서와 회원을 빠르게 찾습니다.',
        ),
        feature(
          'rental-state',
          '대여/반납 및 연체 상태 관리',
          '도서의 현재 상태와 연체 여부를 관리합니다.',
        ),
      ],
      demoVideoUrl: 'https://example.com/bookloop-demo',
      demoFlow: [
        '회원과 도서를 검색합니다.',
        '대여 후 반납 상태를 확인합니다.',
      ],
    },
  },
  {
    id: 'team-03',
    name: 'CafeQueue (3팀)',
    order: 3,
    scheduledAt: '2026-11-10 14:30',
    progress: 'UPCOMING',
    presentation: {
      projectTitle: 'CafeQueue · 카페 주문 관리 프로그램',
      projectIntroduction:
        '주문부터 제조 완료까지의 대기 흐름을 직관적으로 보여줍니다.',
      submittedMaterial: submittedMaterial(
        'cafequeue',
        'cafequeue-presentation.pdf',
      ),
      mainScreens: [
        screen(
          'cafequeue',
          1,
          '메뉴 주문 화면',
          '메뉴와 옵션을 선택해 주문합니다.',
        ),
        screen(
          'cafequeue',
          2,
          '제조 상태 보드',
          '주문별 제조 진행 상태를 확인합니다.',
        ),
      ],
      mainFeatures: [
        feature(
          'order',
          '메뉴 옵션과 결제',
          '옵션 선택과 결제를 한 흐름에서 처리합니다.',
        ),
        feature(
          'queue',
          '주문별 제조 상태 변경',
          '대기·제조·완료 상태를 관리합니다.',
        ),
      ],
      demoFlow: [
        '고객이 메뉴와 옵션을 선택합니다.',
        '직원이 제조 상태를 갱신합니다.',
      ],
    },
  },
];

const teamEvaluationsByUser = new Map<string, MyPresentationEvaluation[]>();
const peerResponsesByUser = new Map<string, MyPeerEvaluationResponse>();
let presentationWindowState: EvaluationWindowState = 'OPEN';
let peerWindowState: EvaluationWindowState = 'OPEN';

export function getEvaluationMembership(userId: string) {
  return evaluationMembershipByUserId[userId];
}

export function getPresentationEvaluationOverview(
  userId: string,
): PresentationEvaluationOverview {
  const membership = getEvaluationMembership(userId);

  return {
    milestoneId: presentationEvaluationMilestoneId,
    evaluationOpensAt: presentationEvaluationOpensAt,
    evaluationClosesAt: presentationEvaluationClosesAt,
    windowState: presentationWindowState,
    windowMessage: {
      UPCOMING:
        '발표 평가 수업 시간이 아직 시작되지 않았어요. 발표 자료는 미리 확인할 수 있어요.',
      OPEN: '발표 평가 수업 시간입니다. 모든 팀 평가를 작성해 주세요.',
      CLOSED:
        '발표 수업은 종료됐지만 아직 제출하지 않은 평가는 계속 작성할 수 있어요.',
      NOT_CONFIGURED: '발표 평가 시간이 아직 설정되지 않았어요.',
    }[presentationWindowState],
    teams: teams.map(team => ({
      ...team,
      isMyTeam: team.id === membership?.teamId,
    })),
    myEvaluations: teamEvaluationsByUser.get(userId) ?? [],
  };
}

export function getPresentationTeam(teamId: string) {
  return teams.find(team => team.id === teamId);
}

export function upsertPresentationEvaluation(
  userId: string,
  evaluation: MyPresentationEvaluation,
) {
  const current = teamEvaluationsByUser.get(userId) ?? [];
  teamEvaluationsByUser.set(userId, [
    ...current.filter(item => item.rateeTeamId !== evaluation.rateeTeamId),
    evaluation,
  ]);
}

export function getPresentationEvaluation(userId: string, teamId: string) {
  return teamEvaluationsByUser
    .get(userId)
    ?.find(item => item.rateeTeamId === teamId);
}

export function getPeerTargets(userId: string) {
  const membership = getEvaluationMembership(userId);
  if (!membership) return [];

  return membership.memberUserIds.flatMap(memberUserId => {
    if (memberUserId === userId) return [];

    const member = evaluationMembersByUserId[memberUserId];
    const memberMembership = getEvaluationMembership(memberUserId);
    return member &&
      memberMembership?.sectionId === membership.sectionId &&
      memberMembership.teamId === membership.teamId
      ? [member]
      : [];
  });
}

export function getPeerResponse(userId: string) {
  return peerResponsesByUser.get(userId);
}

export function getPresentationWindowState() {
  return presentationWindowState;
}

export function getPeerWindowState() {
  return peerWindowState;
}

export function setEvaluationWindowStates(
  presentation: EvaluationWindowState,
  peer: EvaluationWindowState,
) {
  presentationWindowState = presentation;
  peerWindowState = peer;
}

export function setPeerResponse(
  userId: string,
  response: MyPeerEvaluationResponse,
) {
  peerResponsesByUser.set(userId, response);
}

export function resetEvaluationMockData() {
  teamEvaluationsByUser.clear();
  peerResponsesByUser.clear();
  presentationWindowState = 'OPEN';
  peerWindowState = 'OPEN';
}
