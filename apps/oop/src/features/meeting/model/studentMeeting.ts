import type {
  MeetingActionEntry,
  MeetingPhase,
  MeetingRecord,
  MeetingRecordDetail,
  RichTextJson,
  TeamKickoffResponse,
} from '@aics/core';

import { parseRichTextContent } from '~/shared/lib/richTextContent';

export const meetingPhaseLabels: Record<MeetingPhase, string> = {
  PROPOSAL: '기획',
  MID_CHECK: '중간 점검',
  FINAL: '최종',
};

export type StudentMeetingRecord = MeetingRecord & { phase?: MeetingPhase };
export function meetingTitle(title: string | null, phase: MeetingPhase) {
  return title?.trim() || `${meetingPhaseLabels[phase]} 회의록`;
}

export function parseMeetingContent(content: string): RichTextJson {
  return parseRichTextContent(content);
}

export function mapStudentMeeting(
  detail: MeetingRecordDetail,
  actions: MeetingActionEntry[],
  kickoff: TeamKickoffResponse,
): StudentMeetingRecord {
  const participant = (userId: string) => ({
    userId,
    name:
      kickoff.members.find(member => member.studentNumber === userId)?.name ||
      userId,
  });
  return {
    id: detail.id,
    teamId: detail.teamId,
    title: meetingTitle(detail.title, detail.phase),
    phase: detail.phase,
    heldAt: detail.meetingAt,
    location: detail.location,
    content: parseMeetingContent(detail.content),
    participants: detail.participantIds.map(participant),
    actions: actions.map(action => ({
      id: action.id,
      meetingId: action.meetingRecordId,
      content: action.content,
      status: action.status,
      assignee: action.assignee,
      dueDate: action.dueAt,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    })),
    createdBy: participant(detail.authorId),
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}
