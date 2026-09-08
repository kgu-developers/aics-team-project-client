import { fetchTopicCandidates } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { isValidPositiveTeamId } from '~/features/team-assignment/queries';

import { topicKeys } from './topicKeys';

export function useLiveTopicCandidatesQuery(
  sectionId?: string,
  teamId?: string,
  studentNumber?: string,
) {
  const enabled =
    Boolean(sectionId && studentNumber) && isValidPositiveTeamId(teamId);
  return useQuery({
    queryKey: topicKeys.candidates(teamId, studentNumber, sectionId),
    queryFn: enabled && teamId ? () => fetchTopicCandidates(teamId) : skipToken,
    retry: false,
  });
}
