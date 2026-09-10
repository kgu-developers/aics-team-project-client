import type { StudentHomeMilestoneBody } from '@aics/core';

import { useAuthStore } from '~/features/auth/authStore';
import { isValidPositiveTeamId } from '~/features/team-assignment/queries/useTeamMemberContactsQuery';
import { useTeamMessagesQuery } from '~/features/team-message/queries';

type MidReportFeedbackBody = Extract<
  StudentHomeMilestoneBody,
  { kind: 'mid-review-feedback' }
>;

export function useMidReportFeedbackQuery(body: MidReportFeedbackBody) {
  const sessionTeamId = useAuthStore(
    state => state.currentUser?.teamId ?? undefined,
  );
  const teamId = body.teamId ?? sessionTeamId;
  const query = useTeamMessagesQuery(teamId, 'MID_REPORT');
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
    studentFeedback: undefined,
    // Students may record in-person feedback before the professor replies.
    canSubmitResponse: query.isSuccess,
    responseBlockedReason: !isValidPositiveTeamId(teamId)
      ? '팀 배정 정보를 확인한 뒤 다시 시도해 주세요.'
      : query.isError
        ? '피드백을 불러오지 못했어요. 최신 화면에서 다시 확인해 주세요.'
        : query.isPending
          ? '피드백을 불러오는 중...'
          : undefined,
  } satisfies MidReportFeedbackBody;
}
