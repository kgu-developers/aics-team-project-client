import type {
  TeamKickoffResponse,
  TopicCandidate,
  TopicCandidateResponse,
} from '@aics/core';
import { isAxiosError } from 'axios';

export type TopicParticipationEligibility =
  { status: 'open' } | { status: 'unknown' | 'closed'; reason?: string };

export function mapLiveTopicCandidates(
  candidates: TopicCandidateResponse[],
  teamId: string,
  studentNumber: string,
  kickoff?: TeamKickoffResponse,
): TopicCandidate[] {
  return candidates.map(candidate => ({
    id: String(candidate.id),
    teamId,
    proposerUserId: candidate.proposerUserId,
    proposerName:
      kickoff?.members
        .find(member => member.studentNumber === candidate.proposerUserId)
        ?.name?.trim() || candidate.proposerUserId,
    title: candidate.title,
    description: candidate.description,
    voteCount: candidate.voteCount,
    isMine: candidate.proposerUserId === studentNumber,
    isMyVote: candidate.votedByMe,
  }));
}

export function isUncertainTopicWrite(error: unknown) {
  if (!error) return false;
  // A lost response, timeout, server error or invalid success payload does not
  // establish whether the write committed. Require an explicit result check.
  if (!isAxiosError(error)) return true;
  return (
    !error.response ||
    error.response.status >= 500 ||
    error.response.status === 408
  );
}
