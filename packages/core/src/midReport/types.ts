import type {
  DocumentRevision,
  DocumentSession,
  DocumentSessionBlock,
} from '../documentSession/types';

export const midReportBlockKeys = [
  'topic',
  'gui-design',
  'engine-design',
  'project-plan',
] as const;

export type MidReportBlockKey = (typeof midReportBlockKeys)[number];

export type MidReportField = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
};

export type MidReportBlock = DocumentSessionBlock<
  MidReportBlockKey,
  MidReportField
>;

export type MidReport = Omit<DocumentSession<MidReportBlock>, 'revision'> & {
  revision?:
    | (DocumentRevision<MidReportBlockKey> & {
        completedAt?: string | null;
        completedBy?: string | null;
      })
    | null;
};

export type UpdateMidReportBlockInput = {
  version: number;
  fields: MidReportField[];
};
