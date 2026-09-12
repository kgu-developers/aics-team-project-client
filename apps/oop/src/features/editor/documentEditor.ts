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
  /** 제출을 편집기에서 제공하는 문서만 채운다. 학생 홈이 제출을 맡으면 생략한다. */
  submit?: {
    submitDocument: (documentId: string, version: number) => Promise<D>;
    submitting: boolean;
    submitError: string | null;
    canSubmitDocument: (document: D) => boolean;
    submitDisabledReason: (document: D) => string;
  };
};

export type DocumentEditorPageProps<D extends DocumentEditorDocument> = {
  docId: EditorDocId;
  section: string;
  copy: DocumentEditorCopy;
  documentQuery: UseQueryResult<D>;
  saveBlock: DocumentEditorSaveBlocker<D>;
  saveState: DocumentEditorSaveState;
  completion?: DocumentEditorCompletion<D>;
  /** 문서별 서버 잠금/기간 정책. 기존 lease 흐름과 동시에 사용하지 않는다. */
  access?: { canEdit: boolean; notice?: string; controls?: React.ReactNode };
  retryVersionConflict?: boolean;
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

/** 캐시 응답도 렌더링·잠금·저장에 필요한 공통 문서 계약을 만족해야 한다. */
export function isDocumentEditorDocument(
  value: unknown,
): value is DocumentEditorDocument {
  const isRecord = (item: unknown): item is Record<string, unknown> =>
    typeof item === 'object' && item !== null;
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    Number.isSafeInteger(value.version) &&
    Array.isArray(value.blocks) &&
    value.blocks.every(
      block =>
        isRecord(block) &&
        typeof block.key === 'string' &&
        typeof block.title === 'string' &&
        typeof block.description === 'string' &&
        typeof block.lastSavedAt === 'string' &&
        (block.lock === null ||
          (isRecord(block.lock) && typeof block.lock.ownerName === 'string')) &&
        Array.isArray(block.fields) &&
        block.fields.every(
          field =>
            isRecord(field) &&
            typeof field.key === 'string' &&
            typeof field.label === 'string' &&
            typeof field.value === 'string' &&
            (field.multiline === undefined ||
              typeof field.multiline === 'boolean'),
        ),
    )
  );
}
