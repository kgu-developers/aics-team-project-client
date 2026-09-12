import type { StudentHomeMilestoneBody } from '@aics/core';

import { useAuthStore } from '~/features/auth/authStore';
import { isValidPositiveTeamId } from '~/features/team-assignment/queries/useTeamMemberContactsQuery';
import { useTeamMessagesQuery } from '~/features/team-message/queries';

type ProposalFeedbackBody = Extract<
  StudentHomeMilestoneBody,
  { kind: 'proposal-feedback' }
>;

/** Adapt the shared conversation to the existing feedback list and reply form. */
export function useProposalFeedbackQuery(body: ProposalFeedbackBody) {
  const sessionTeamId = useAuthStore(
    state => state.currentUser?.teamId ?? undefined,
  );
  const teamId = body.teamId ?? sessionTeamId;
  const query = useTeamMessagesQuery(teamId, 'PROPOSAL');

  return {
    ...body,
    teamId,
    feedback: query.isSuccess
      ? query.data.map(message => ({
          id: String(message.id),
          title: `${message.senderName?.trim() || message.senderId} (${message.createdAt})`,
          content: message.message,
        }))
      : [],
    // A message is not a one-time review response. Keep the same reply form
    // available for follow-up messages, and show every reply in the list.
    studentResponse: undefined,
    canSubmitResponse: query.isSuccess && query.data.length > 0,
    responseBlockedReason: !isValidPositiveTeamId(teamId)
      ? '팀 배정 정보를 확인한 뒤 다시 시도해 주세요.'
      : query.isError
        ? '피드백을 불러오지 못했어요. 최신 화면에서 다시 확인해 주세요.'
        : query.isPending
          ? '피드백을 불러오는 중...'
          : query.data?.length === 0
            ? '교수 피드백이 도착하면 답변을 남길 수 있어요.'
            : undefined,
  } satisfies ProposalFeedbackBody;
}
