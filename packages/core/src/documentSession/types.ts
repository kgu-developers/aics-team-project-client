export type DocumentBlockStatus = 'IN_PROGRESS' | 'COMPLETED';

export type DocumentSessionStatus =
  'DRAFT' | 'SUBMITTED' | 'REVISION_REQUESTED';

export type DocumentRevision<TKey extends string = string> = {
  affectedBlockKeys: TKey[];
  changedBlockKeys: TKey[];
  requestedAt: string;
  resubmittedAt: string | null;
};

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

export type DocumentSession<TBlock extends { key: string }> = {
  id: string;
  teamId: string;
  title: string;
  version: number;
  dueDate: string;
  status: DocumentSessionStatus;
  teamLeaderName: string;
  submittedAt: string | null;
  submittedBy: string | null;
  revision?: DocumentRevision<TBlock['key']> | null;
  blocks: TBlock[];
};

export type CompleteDocumentBlockInput = { version: number };

export type SubmitDocumentSessionInput = { version: number };
