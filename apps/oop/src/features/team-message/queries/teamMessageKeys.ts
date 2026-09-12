import type { TeamMessageRelatedType } from '@aics/core';

export const teamMessageKeys = {
  all: ['team-messages'] as const,
  team: (teamId?: string) => [...teamMessageKeys.all, teamId] as const,
  messages: (teamId?: string, relatedType?: TeamMessageRelatedType) =>
    [...teamMessageKeys.team(teamId), 'messages', relatedType] as const,
};
