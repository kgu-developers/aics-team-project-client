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
