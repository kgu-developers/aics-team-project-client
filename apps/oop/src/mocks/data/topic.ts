import type { TopicBoard, TopicCandidate } from '@aics/core';

export const demoTopicSectionId = 'oop-2026-2-01';
export const demoTopicTeamId = 'team-07';

type TopicCandidateRecord = Omit<
  TopicCandidate,
  'voteCount' | 'isMine' | 'isMyVote'
>;

type TopicMockState = {
  candidates: TopicCandidateRecord[];
  votesByUserId: Record<string, string | undefined>;
  selectedCandidateId?: string;
};

const memberIds = [
  'student-a',
  'student-b',
  'student-c',
  'student-d',
  'student-e',
];

type TopicSelectionFixture = 'SELECTED' | 'VOTING';

function createInitialState(
  selection: TopicSelectionFixture = 'SELECTED',
): TopicMockState {
  return {
    candidates: [
      {
        id: 'topic-1',
        teamId: demoTopicTeamId,
        proposerUserId: 'student-b',
        proposerName: 'OOP 데모 학생 B',
        title: 'CineFlow · 영화관 통합 관리 시스템',
        description: '상영 일정, 좌석, 예매와 결제 흐름을 통합 관리합니다.',
      },
      {
        id: 'topic-2',
        teamId: demoTopicTeamId,
        proposerUserId: 'student-a',
        proposerName: 'OOP 데모 학생 A',
        title: '도서 대여 관리 프로그램',
        description: '도서·회원·대여 및 반납 현황 관리',
      },
      {
        id: 'topic-3',
        teamId: demoTopicTeamId,
        proposerUserId: 'student-c',
        proposerName: 'OOP 데모 학생 C',
        title: '카페 주문 관리 프로그램',
        description: '메뉴·주문·결제 및 제조 상태 관리',
      },
    ],
    votesByUserId: {
      'student-b': 'topic-2',
      'student-c': 'topic-1',
      'student-d': 'topic-1',
    },
    // 현재 개발 기본 fixture는 주제 선정이 끝난 뒤 제안서 작성으로 넘어간 상태다.
    selectedCandidateId: selection === 'SELECTED' ? 'topic-1' : undefined,
  };
}

let state = createInitialState();

export function getTopicBoard(currentUserId: string): TopicBoard {
  return {
    teamId: demoTopicTeamId,
    candidates: state.candidates.map(candidate => ({
      ...candidate,
      voteCount: Object.values(state.votesByUserId).filter(
        candidateId => candidateId === candidate.id,
      ).length,
      isMine: candidate.proposerUserId === currentUserId,
      isMyVote: state.votesByUserId[currentUserId] === candidate.id,
    })),
    selection: state.selectedCandidateId
      ? { status: 'SELECTED', selectedCandidateId: state.selectedCandidateId }
      : { status: 'VOTING' },
    participation: {
      votedMemberCount: Object.values(state.votesByUserId).filter(Boolean)
        .length,
      totalMemberCount: memberIds.length,
    },
  };
}

export function addTopicCandidate(
  currentUserId: string,
  proposerName: string,
  input: { title: string; description: string },
) {
  const candidate: TopicCandidateRecord = {
    id: `topic-${state.candidates.length + 1}`,
    teamId: demoTopicTeamId,
    proposerUserId: currentUserId,
    proposerName,
    title: input.title.trim(),
    description: input.description.trim(),
  };
  state = { ...state, candidates: [...state.candidates, candidate] };
  return getTopicBoard(currentUserId);
}

export function changeTopicVote(currentUserId: string, candidateId: string) {
  state = {
    ...state,
    votesByUserId: { ...state.votesByUserId, [currentUserId]: candidateId },
  };
  return getTopicBoard(currentUserId);
}

export function cancelTopicVote(currentUserId: string) {
  state = {
    ...state,
    votesByUserId: { ...state.votesByUserId, [currentUserId]: undefined },
  };
  return getTopicBoard(currentUserId);
}

export function hasTopicCandidate(candidateId: string) {
  return state.candidates.some(candidate => candidate.id === candidateId);
}

export function resetTopicMockData(
  options: { selection?: TopicSelectionFixture } = {},
) {
  state = createInitialState(options.selection);
}
