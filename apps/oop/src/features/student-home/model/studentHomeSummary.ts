import type {
  MeetingActionEntry,
  MeetingRecordSummary,
  SectionAnnouncement,
  StudentHomeAnnouncement,
  TeamKickoffResponse,
} from '@aics/core';

import { meetingTitle } from '~/features/meeting/model/studentMeeting';

export type HomeMeetingRecord = {
  id: string;
  title: string;
  heldAt: string;
  authorName: string;
  actionCount: number | null;
};

export type HomeAssignedAction = {
  id: string;
  meetingId: string;
  content: string;
  assignee: { userId: string; name: string } | null;
  dueDate: string | null;
};

const HOME_LIMIT = 3;

export function homeAnnouncements(
  items: SectionAnnouncement[],
): StudentHomeAnnouncement[] {
  return [...items]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, HOME_LIMIT)
    .map(item => ({
      id: String(item.id),
      title: item.title,
      content: item.content,
      date: item.publishedAt.slice(0, 10),
    }));
}

export function homeMeetingRecords(
  records: MeetingRecordSummary[],
  actions: MeetingActionEntry[] | undefined,
  kickoff: TeamKickoffResponse | undefined,
): HomeMeetingRecord[] {
  return [...records]
    .sort((left, right) => right.meetingAt.localeCompare(left.meetingAt))
    .slice(0, HOME_LIMIT)
    .map(record => ({
      id: record.id,
      title: meetingTitle(record.title, record.phase),
      heldAt: record.meetingAt,
      authorName:
        kickoff?.members.find(
          member => member.studentNumber === record.authorId,
        )?.name || record.authorId,
      actionCount:
        actions === undefined
          ? null
          : actions.filter(action => action.meetingRecordId === record.id)
              .length,
    }));
}

export function homeAssignedActions(
  actions: MeetingActionEntry[],
  studentNumber: string | undefined,
): HomeAssignedAction[] {
  if (!studentNumber) return [];

  return [...actions]
    .filter(action => action.assignee?.userId === studentNumber)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, HOME_LIMIT)
    .map(action => ({
      id: action.id,
      meetingId: action.meetingRecordId,
      content: action.content,
      assignee: action.assignee,
      dueDate: action.dueAt?.slice(0, 10) ?? null,
    }));
}
