import type { DocumentFeedbackStage, TeamMessage } from '@aics/core';

import { seoulInstant } from '~/shared/lib/seoulInstant';

export type { DocumentFeedbackStage };

/**
 * Copy shared by the home summary rows and the milestone detail so both
 * screens describe the same stage with the same words.
 */
export const documentFeedbackStageCopy = {
  proposal: {
    awaiting:
      '제출 완료 · 교수/조교 피드백을 기다리고 있어요. 피드백이 오면 이곳에서 답변할 수 있어요.',
    checking: '제출 완료 · 피드백 상태를 확인하는 중이에요.',
    checkFailed: '제출 완료 · 피드백 상태를 불러오지 못했어요.',
  },
  midReport: {
    awaiting:
      '제출 완료 · 대면 피드백을 받은 뒤 반영 방향을 보내면 피드백 대화가 시작돼요.',
    checking: '제출 완료 · 피드백 상태를 확인하는 중이에요.',
    checkFailed: '제출 완료 · 피드백 상태를 불러오지 못했어요.',
  },
} as const;

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
  const sent = seoulInstant(message.createdAt);
  const submitted = seoulInstant(submittedAt);
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

/**
 * Stage for the feedback room inside the milestone detail. Unlike the
 * summary rows, an existing conversation is shown even before the server
 * records a submission, and a message query that is not ready reads as
 * 'unknown' so the room shows a checking state instead of vanishing.
 */
function feedbackRoomStage(
  { submittedAt, messages, teamMemberIds, isMessagesReady = true }: Input,
  startedBy: 'staff' | 'student',
): DocumentFeedbackStage {
  if (!teamMemberIds || !isMessagesReady) return 'unknown';
  const started = (messages ?? []).some(message =>
    startedBy === 'staff'
      ? !teamMemberIds.includes(message.senderId)
      : teamMemberIds.includes(message.senderId),
  );
  if (started) return 'feedback-arrived';
  return submittedAt ? 'awaiting-feedback' : 'not-submitted';
}

export function proposalFeedbackRoomStage(input: Input) {
  return feedbackRoomStage(input, 'staff');
}

export function midReportFeedbackRoomStage(input: Input) {
  return feedbackRoomStage(input, 'student');
}
