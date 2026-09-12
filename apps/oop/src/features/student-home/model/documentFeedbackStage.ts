import type { TeamMessage } from '@aics/core';

export type DocumentFeedbackStage =
  'not-submitted' | 'awaiting-feedback' | 'feedback-arrived';

type Input = {
  submittedAt?: string | null;
  messages?: TeamMessage[];
  /** Student numbers of the current team, used to tell teammates from staff. */
  teamMemberIds: string[];
};
const after = (message: TeamMessage, submittedAt: string) =>
  !Number.isFinite(Date.parse(submittedAt)) ||
  Date.parse(message.createdAt) >= Date.parse(submittedAt);

/**
 * 제안서: 교수·조교가 팀 메시지를 보내면 피드백 단계가 시작된다.
 * 팀원이 아닌 발신자를 교수·조교로 본다.
 */
export function proposalFeedbackStage({
  submittedAt,
  messages,
  teamMemberIds,
}: Input): DocumentFeedbackStage {
  if (!submittedAt) return 'not-submitted';
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
}: Input): DocumentFeedbackStage {
  if (!submittedAt) return 'not-submitted';
  const studentMessage = (messages ?? []).some(
    message =>
      teamMemberIds.includes(message.senderId) && after(message, submittedAt),
  );
  return studentMessage ? 'feedback-arrived' : 'awaiting-feedback';
}
