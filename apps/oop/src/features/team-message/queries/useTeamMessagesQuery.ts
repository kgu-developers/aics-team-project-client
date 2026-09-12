import { fetchTeamMessages, fetchTeamThread } from '@aics/api-client';
import type { TeamMessage, TeamMessageRelatedType } from '@aics/core';
import { skipToken, useQuery } from '@tanstack/react-query';

import { isValidPositiveTeamId } from '~/features/team-assignment/queries/useTeamMemberContactsQuery';

import { teamMessageKeys } from './teamMessageKeys';

export function useTeamMessagesQuery(
  teamId?: string,
  relatedType?: TeamMessageRelatedType,
) {
  const validTeamId = isValidPositiveTeamId(teamId) ? teamId : undefined;

  return useQuery({
    queryKey: teamMessageKeys.messages(validTeamId, relatedType),
    queryFn: validTeamId
      ? async ({ signal }) => {
          // The server creates the team's room on first access. Both milestone
          // types use this same room; a related type only filters its messages.
          const thread = await fetchTeamThread(validTeamId, { signal });
          const messages = new Map<number, TeamMessage>();
          let page = 0;

          for (;;) {
            const result = await fetchTeamMessages(
              validTeamId,
              { relatedType, page, size: 100 },
              { signal },
            );
            if (result.pageable.page !== page) {
              throw new Error('메시지 페이지 정보를 확인할 수 없어요.');
            }
            for (const message of result.contents) {
              if (message.threadId !== thread.threadId) {
                throw new Error('현재 팀의 메시지 방을 확인할 수 없어요.');
              }
              messages.set(message.id, message);
            }
            if (result.pageable.isEnd) break;
            if (!result.contents.length) {
              throw new Error('메시지 목록을 끝까지 불러오지 못했어요.');
            }
            page += 1;
          }

          return [...messages.values()].sort((a, b) => a.id - b.id);
        }
      : skipToken,
    retry: false,
    gcTime: 0,
  });
}
