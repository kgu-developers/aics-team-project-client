export const teamMessageRelatedTypes = [
  'PROPOSAL',
  'MEETING',
  'MID_REPORT',
  'FINAL_SUBMISSION',
  'REVIEW',
  'QUESTION',
  'GENERAL',
] as const;

export type TeamMessageRelatedType = (typeof teamMessageRelatedTypes)[number];

export type SubmitTeamMessageInput = {
  message: string;
  relatedType?: TeamMessageRelatedType;
  /** A real resource ID only; the server does not identify its resource type. */
  relatedId?: number | null;
};

export type TeamMessagesParams = {
  relatedType?: TeamMessageRelatedType;
  page?: number;
  size?: number;
};

export type TeamMessagePersistResponse = {
  id: number;
  threadId: number;
  /** Student number, including when the sender is a professor. */
  senderId: string;
  senderName?: string | null;
  relatedType: TeamMessageRelatedType;
  relatedId?: number | null;
  message: string;
  createdAt: string;
};

export type TeamMessage = TeamMessagePersistResponse & {
  important: boolean;
  /** Read receipt for the requesting user, not the entire team. */
  read: boolean;
};

export type TeamMessagePage = {
  contents: TeamMessage[];
  pageable: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    isEnd: boolean;
  };
};

export type TeamThread = {
  threadId: number;
  teamId: number;
  createdAt: string;
};
