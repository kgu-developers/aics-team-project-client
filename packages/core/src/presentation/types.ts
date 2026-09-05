import type {
  DocumentSession,
  DocumentSessionBlock,
} from '../documentSession/types';

export const presentationBlockKeys = [
  'project-overview',
  'presentation-material',
  'main-features',
  'main-screens',
] as const;

export type PresentationBlockKey = (typeof presentationBlockKeys)[number];

export type PresentationField = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
};

export type PresentationBlock = DocumentSessionBlock<
  PresentationBlockKey,
  PresentationField
>;

export type Presentation = DocumentSession<PresentationBlock>;

export type UpdatePresentationBlockInput = {
  version: number;
  fields: PresentationField[];
};
