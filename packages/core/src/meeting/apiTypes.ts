/** Swagger contract: kept separate until KD3-156/157 can preserve the current UI semantics. */
export const meetingPhases = ['PROPOSAL', 'MID_CHECK', 'FINAL'] as const;

export type MeetingPhase = (typeof meetingPhases)[number];

export const meetingApiActionStatuses = [
  'DONE',
  'IN_PROGRESS',
  'EXCLUDED',
] as const;

export type MeetingApiActionStatus = (typeof meetingApiActionStatuses)[number];

export type MeetingRecordSummaryDto = {
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
  assigneeId?: string | null;
  dueAt?: string | null;
};

export type MeetingActionListResponseDto = {
  contents: MeetingActionResponseDto[];
};

export type MeetingRecordSummary = {
  id: string;
  phase: MeetingPhase;
  meetingAt: string;
  location: string | null;
  authorId: string;
  participantCount: number;
};

export type MeetingRecordDetail = {
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
  id: string;
  phase: MeetingPhase;
  meetingAt: string;
  location: string | null;
  authorId: string;
};

export type MeetingRecordCreateRequest = {
  meetingAt: string;
  location?: string;
  phase: MeetingPhase;
  content: string;
  participantIds?: string[];
};

export type MeetingRecordUpdateRequest = {
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
  assigneeId: string | null;
  dueAt: string | null;
};

export type MeetingActionCreateRequest = {
  content: string;
  status: MeetingApiActionStatus;
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
