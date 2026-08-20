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
};

const memberIds = [
  'student-a',
  'student-b',
  'student-c',
  'student-d',
  'student-e',
];

function createInitialState(): TopicMockState {
  return {
    candidates: [
      {
        id: 'topic-1',
        teamId: demoTopicTeamId,
        proposerUserId: 'student-b',
        proposerName: 'OOP 데모 학생 B',
        title: '영화관 관리 프로그램',
        description: '상영작·좌석·예매 현황을 한 곳에서 관리',
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
      'student-c': 'topic-2',
      'student-d': 'topic-1',
    },
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

export function resetTopicMockData() {
  state = createInitialState();
}
