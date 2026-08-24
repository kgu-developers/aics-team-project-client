import type { EditLockTargetType } from '@aics/core';
import type { UseQueryResult } from '@tanstack/react-query';

import type { EditorDocId } from '~/app/constants/editorSections';

export function isDocumentVersionConflict(error: unknown) {
  return Boolean(
    typeof error === 'object' &&
    error &&
    'response' in error &&
    (error.response as { data?: { code?: string } }).data?.code ===
      'VERSION_CONFLICT',
  );
}

/**
 * 문서 에디터(제안서·중간보고서·발표)가 화면을 공유하기 위한 구조적 계약.
 * 문서별 DTO(@aics/core의 Proposal/MidReport/Presentation)는 서로 분리된
 * API 계약이지만, 필드 기반 블록이라는 화면 구조는 동일하므로 이 타입에
 * 구조적으로 호환된다. 여기서 문서별 DTO를 import 하지 않는다.
 */
export type DocumentEditorField = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
};

export type DocumentEditorBlock = {
  key: string;
  title: string;
  description: string;
  fields: DocumentEditorField[];
  lock: { ownerName: string } | null;
  lastSavedAt: string;
};

export type DocumentEditorDocument = {
  id: string;
  version: number;
  blocks: DocumentEditorBlock[];
};

export type SaveDocumentBlockInput<D extends DocumentEditorDocument> = {
  documentId: string;
  version: number;
  block: D['blocks'][number];
  fields: D['blocks'][number]['fields'];
};

export type DocumentEditorSaveBlocker<D extends DocumentEditorDocument> = (
  input: SaveDocumentBlockInput<D>,
) => Promise<D>;

export type DocumentEditorCopy = {
  loginRequired: string;
  loading: string;
  loadFailed: string;
  saveFailed: string;
};

export type DocumentEditorSaveState = {
  saving: boolean;
  error: string | null;
};

export type DocumentEditorCompletion<D extends DocumentEditorDocument> = {
  isBlockCompleted: (block: D['blocks'][number]) => boolean;
  completeBlock: DocumentEditorSaveBlocker<D>;
  completing: boolean;
  completeError: string | null;
  isDocumentSubmitted: (document: D) => boolean;
  submitDocument: (documentId: string, version: number) => Promise<D>;
  submitting: boolean;
  submitError: string | null;
  canSubmitDocument: (document: D) => boolean;
  submitDisabledReason: (document: D) => string;
};

export type DocumentEditorPageProps<D extends DocumentEditorDocument> = {
  docId: EditorDocId;
  section: string;
  metadataTag: string;
  copy: DocumentEditorCopy;
  documentQuery: UseQueryResult<D>;
  saveBlock: DocumentEditorSaveBlocker<D>;
  saveState: DocumentEditorSaveState;
  completion?: DocumentEditorCompletion<D>;
  /** 공통 셸이 문서 id와 section으로 잠금 대상을 조립할 때 사용한다. */
  editLockTargetType: EditLockTargetType | null;
  renderFields?: (input: {
    documentId: D['id'];
    block: D['blocks'][number];
    fields: DocumentEditorField[];
    isLocked: boolean;
    onFieldsChange: (fields: DocumentEditorField[]) => void;
  }) => React.ReactNode | null;
  renderBlockAside?: (
    block: D['blocks'][number],
    isLocked: boolean,
  ) => React.ReactNode;
};
