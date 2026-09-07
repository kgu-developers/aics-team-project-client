/** Deployed meeting API contract. Dates are server-local wall-clock strings. */
export const meetingPhases = ['PROPOSAL', 'MID_CHECK', 'FINAL'] as const;

export type MeetingPhase = (typeof meetingPhases)[number];

export const meetingApiActionStatuses = [
  'DONE',
  'IN_PROGRESS',
  'TODO',
] as const;

export type MeetingApiActionStatus = (typeof meetingApiActionStatuses)[number];

export type MeetingRecordSummaryDto = {
  title: string | null;
  id: number;
  phase: MeetingPhase;
  meetingAt: string;
  location?: string | null;
  authorId: string;
  participantCount: number;
};

export type MeetingRecordListResponseDto = {
  contents: MeetingRecordSummaryDto[];
};

export type MeetingRecordDetailResponseDto = {
  title: string | null;
  id: number;
  teamId: number;
  phase: MeetingPhase;
  authorId: string;
  meetingAt: string;
  location?: string | null;
  content: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type MeetingRecordPersistResponseDto = {
  title: string | null;
  id: number;
  phase: MeetingPhase;
  meetingAt: string;
  location?: string | null;
  authorId: string;
};

export type MeetingActionResponseDto = {
  id: number;
  meetingRecordId: number;
  content: string;
  status: MeetingApiActionStatus;
  assignee?: { userId: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  dueAt?: string | null;
};

export type MeetingActionListResponseDto = {
  contents: MeetingActionResponseDto[];
};

export type MeetingRecordSummary = {
  title: string | null;
  id: string;
  phase: MeetingPhase;
  meetingAt: string;
  location: string | null;
  authorId: string;
  participantCount: number;
};

export type MeetingRecordDetail = {
  title: string | null;
  id: string;
  teamId: string;
  phase: MeetingPhase;
  authorId: string;
  meetingAt: string;
  location: string | null;
  content: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type MeetingRecordPersistResult = {
  title: string | null;
  id: string;
  phase: MeetingPhase;
  meetingAt: string;
  location: string | null;
  authorId: string;
};

export type MeetingRecordCreateRequest = {
  title: string;
  meetingAt: string;
  location?: string;
  phase: MeetingPhase;
  content: string;
  participantIds?: string[];
};

export type MeetingRecordUpdateRequest = {
  title?: string;
  meetingAt?: string;
  location?: string;
  phase?: MeetingPhase;
  content?: string;
  participantIds?: string[];
};

export type MeetingActionEntry = {
  id: string;
  meetingRecordId: string;
  content: string;
  status: MeetingApiActionStatus;
  assignee: { userId: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
};

export type MeetingActionCreateRequest = {
  content: string;
  dueAt?: string;
  assigneeId?: string;
};

export type MeetingActionUpdateRequest = {
  content?: string;
  status?: MeetingApiActionStatus;
  dueAt?: string;
  assigneeId?: string;
  clearDueAt?: boolean;
  clearAssignee?: boolean;
};
