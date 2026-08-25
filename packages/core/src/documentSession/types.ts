export type DocumentBlockStatus = 'IN_PROGRESS' | 'COMPLETED';

export type DocumentSessionStatus = 'DRAFT' | 'SUBMITTED';

export type DocumentSessionBlock<
  TKey extends string,
  TField extends { key: string; value: string },
> = {
  key: TKey;
  title: string;
  description: string;
  fields: TField[];
  status: DocumentBlockStatus;
  lock: { ownerName: string } | null;
  lastEditedBy: string;
  lastSavedAt: string;
};

export type DocumentSession<TBlock> = {
  id: string;
  teamId: string;
  title: string;
  version: number;
  dueDate: string;
  status: DocumentSessionStatus;
  teamLeaderName: string;
  submittedAt: string | null;
  submittedBy: string | null;
  blocks: TBlock[];
};

export type CompleteDocumentBlockInput = { version: number };

export type SubmitDocumentSessionInput = { version: number };
