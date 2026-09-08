import { apiClient } from '../client';
import { validateTopicId } from './topicApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeTopicCandidateVote(
  candidateId: string,
): Promise<void> {
  validateTopicId(candidateId);
  await apiClient.delete(ENDPOINTS.TOPIC.CANDIDATE_VOTE(candidateId));
}
