import type { TeamMessage } from '@aics/core';

export type DocumentFeedbackStage =
  'not-submitted' | 'unknown' | 'awaiting-feedback' | 'feedback-arrived';

type Input = {
  submittedAt?: string | null;
  messages?: TeamMessage[];
  /** Student numbers of the current team, undefined until the team is known. */
  teamMemberIds?: string[];
  /** False while the message query is pending or failed. */
  isMessagesReady?: boolean;
};
// Both timestamps must parse; an unreadable value must not open the stage.
const after = (message: TeamMessage, submittedAt: string) => {
  const sent = Date.parse(message.createdAt);
  const submitted = Date.parse(submittedAt);
  return (
    Number.isFinite(sent) && Number.isFinite(submitted) && sent >= submitted
  );
};

/**
 * 제안서: 교수·조교가 팀 메시지를 보내면 피드백 단계가 시작된다.
 * 팀원이 아닌 발신자를 교수·조교로 본다.
 */
export function proposalFeedbackStage({
  submittedAt,
  messages,
  teamMemberIds,
  isMessagesReady = true,
}: Input): DocumentFeedbackStage {
  if (!submittedAt) return 'not-submitted';
  // Unknown membership or messages must not be read as "no feedback yet".
  if (!teamMemberIds || !isMessagesReady) return 'unknown';
  const staffMessage = (messages ?? []).some(
    message =>
      !teamMemberIds.includes(message.senderId) && after(message, submittedAt),
  );
  return staffMessage ? 'feedback-arrived' : 'awaiting-feedback';
}

/** 중간보고서: 학생이 먼저 팀 메시지를 보내면 피드백 단계가 시작된다. */
export function midReportFeedbackStage({
  submittedAt,
  messages,
  teamMemberIds,
  isMessagesReady = true,
}: Input): DocumentFeedbackStage {
  if (!submittedAt) return 'not-submitted';
  if (!teamMemberIds || !isMessagesReady) return 'unknown';
  const studentMessage = (messages ?? []).some(
    message =>
      teamMemberIds.includes(message.senderId) && after(message, submittedAt),
  );
  return studentMessage ? 'feedback-arrived' : 'awaiting-feedback';
}
