import type {
  DocumentBlockStatus,
  DocumentSession,
  DocumentSessionBlock,
  DocumentSessionStatus,
} from '../documentSession/types';

export const proposalBlockKeys = [
  'team-info',
  'topic',
  'data-composition',
  'screen-composition',
  'team-operations',
] as const;

export type ProposalBlockKey = (typeof proposalBlockKeys)[number];

export type ProposalField = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
};

export type ProposalBlockStatus = DocumentBlockStatus;
export type ProposalStatus = DocumentSessionStatus;

export type ProposalBlock = DocumentSessionBlock<
  ProposalBlockKey,
  ProposalField
>;

export type Proposal = DocumentSession<ProposalBlock>;

export type UpdateProposalBlockInput = {
  version: number;
  fields: ProposalField[];
};

export type CompleteProposalBlockInput = {
  version: number;
};

export type SubmitProposalInput = {
  version: number;
};
