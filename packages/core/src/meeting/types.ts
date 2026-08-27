export type RichTextJson = {
  type: string;
  [key: string]: unknown;
};

export type MeetingParticipant = {
  userId: string;
  name: string;
};

export const meetingActionStatuses = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

export type MeetingActionStatus = (typeof meetingActionStatuses)[number];

export type MeetingAction = {
  id: string;
  meetingId: string;
  content: string;
  status: MeetingActionStatus;
  assignee: MeetingParticipant | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MeetingRecord = {
  id: string;
  teamId: string;
  title: string;
  heldAt: string;
  location: string | null;
  content: RichTextJson;
  participants: MeetingParticipant[];
  actions: MeetingAction[];
  createdBy: MeetingParticipant;
  createdAt: string;
  updatedAt: string;
};

export type CreateMeetingRecordInput = {
  title: string;
  heldAt: string;
  location?: string | null;
  content: RichTextJson;
  participantUserIds: string[];
  actions: SaveMeetingActionInput[];
};

export type UpdateMeetingRecordInput = {
  title: string;
  heldAt: string;
  location?: string | null;
  content: RichTextJson;
  participantUserIds: string[];
  actions: SaveMeetingActionInput[];
};

export type CreateMeetingActionInput = {
  content: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
};

export type SaveMeetingActionInput = CreateMeetingActionInput & {
  id?: string;
};

export type UpdateMeetingActionInput = {
  content?: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  status?: MeetingActionStatus;
};
