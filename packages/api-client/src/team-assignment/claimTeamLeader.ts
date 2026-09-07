import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

/**
 * Declares the current student as the team's leader.
 *
 * The Swagger contract intentionally returns 204, so this operation exposes
 * no projection payload. Projection refresh/invalidation belongs to the app
 * query mutation that consumes this client.
 */
export async function claimTeamLeader(input: {
  teamId: string;
}): Promise<void> {
  await apiClient.post<void>(
    ENDPOINTS.TEAM.LEADER_CLAIM(input.teamId),
    undefined,
  );
}
