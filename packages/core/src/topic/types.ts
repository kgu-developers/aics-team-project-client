export type TopicCandidate = {
  id: string;
  teamId: string;
  proposerUserId: string;
  proposerName: string;
  title: string;
  description: string;
  voteCount: number;
  isMine: boolean;
  isMyVote: boolean;
};

export type TopicBoard = {
  teamId: string;
  candidates: TopicCandidate[];
  /** 팀 주제 선정 단계의 서버 확정 상태. 투표 수만으로 클라이언트가 추론하지 않는다. */
  selection: {
    status: 'VOTING' | 'SELECTED';
    selectedCandidateId?: string;
  };
  participation: {
    votedMemberCount: number;
    totalMemberCount: number;
  };
};

export type SubmitTopicCandidateInput = {
  title: string;
  description: string;
};

export type SubmitTopicVoteInput = {
  candidateId: string;
};
