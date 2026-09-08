/** Student topic endpoints return candidates, not the demo milestone projection. */
export type TopicCandidateResponse = {
  id: number;
  proposerUserId: string;
  title: string;
  description: string;
  voteCount: number;
  votedByMe: boolean;
};

export type TopicCandidateListResponse = {
  contents: TopicCandidateResponse[];
};

export type TopicCandidatePersistResponse = Omit<
  TopicCandidateResponse,
  'voteCount' | 'votedByMe'
>;

export type TopicVotePersistResponse = {
  id: number;
  candidateId: number;
  voterUserId: string;
};

export type TopicFinalizeInput = { candidateId: number; goal: string };
export type TopicFinalizeResponse = {
  projectId: number;
  candidateId: number;
  title: string;
};
