import type {
  MeetingActionEntry,
  MeetingActionResponseDto,
  MeetingRecordDetail,
  MeetingRecordDetailResponseDto,
  MeetingRecordPersistResponseDto,
  MeetingRecordPersistResult,
  MeetingRecordSummary,
  MeetingRecordSummaryDto,
  TeamMeetingActionEntry,
  TeamMeetingActionResponseDto,
} from '@aics/core';

export function mapMeetingRecordSummary(
  dto: MeetingRecordSummaryDto,
): MeetingRecordSummary {
  return {
    id: String(dto.id),
    title: dto.title ?? null,
    phase: dto.phase,
    meetingAt: dto.meetingAt,
    location: dto.location ?? null,
    authorId: dto.authorId,
    participantCount: dto.participantCount,
  };
}

export function mapMeetingRecordDetail(
  dto: MeetingRecordDetailResponseDto,
): MeetingRecordDetail {
  return {
    id: String(dto.id),
    teamId: String(dto.teamId),
    title: dto.title ?? null,
    phase: dto.phase,
    authorId: dto.authorId,
    meetingAt: dto.meetingAt,
    location: dto.location ?? null,
    content: dto.content,
    participantIds: dto.participantIds,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapMeetingRecordPersistResult(
  dto: MeetingRecordPersistResponseDto,
): MeetingRecordPersistResult {
  return {
    id: String(dto.id),
    title: dto.title ?? null,
    phase: dto.phase,
    meetingAt: dto.meetingAt,
    location: dto.location ?? null,
    authorId: dto.authorId,
  };
}

export function mapMeetingAction(
  dto: MeetingActionResponseDto,
): MeetingActionEntry {
  return {
    id: String(dto.id),
    meetingRecordId: String(dto.meetingRecordId),
    content: dto.content,
    status: dto.status,
    assignee: dto.assignee ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    dueAt: dto.dueAt ?? null,
  };
}

export function mapTeamMeetingAction(
  dto: TeamMeetingActionResponseDto,
): TeamMeetingActionEntry {
  return {
    ...mapMeetingAction(dto),
    meetingRecord: {
      id: String(dto.meetingRecord.id),
      title: dto.meetingRecord.title ?? null,
    },
  };
}
