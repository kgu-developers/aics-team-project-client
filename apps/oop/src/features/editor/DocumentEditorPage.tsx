import { Button, EmptyState, TextArea, TextInput } from '@aics/design-system';
import { Navigate } from '@tanstack/react-router';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';

import { EDITOR_DOCS, editorSectionTo } from '~/app/constants/editorSections';

import { useAuthStore } from '~/features/auth/authStore';

import DocumentAccessNotice from './DocumentAccessNotice';
import DocumentActionBar from './DocumentActionBar';
import {
  isDocumentEditorDocument,
  isDocumentVersionConflict,
  type DocumentEditorField,
  type DocumentEditorPageProps,
} from './documentEditor';
import DocumentEditorLayout from './DocumentEditorLayout';
import * as styles from './DocumentEditorPage.css';
import { useDocumentEditorAutosave } from './useDocumentEditorAutosave';
import { useEditLock } from './useEditLock';

export type DocumentEditorSaveState = {
  saving: boolean;
  error: string | null;
};

/** axios 에러 응답의 message를 우선 사용하고, 없으면 문서별 기본 문구를 쓴다. */
export function getSaveErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = error.response as { data?: { message?: string } };
    return response.data?.message ?? fallback;
  }
  return fallback;
}

/**
 * 제안서·중간보고서·발표가 공유하는 반응형 문서 에디터 셸.
 * 사이드바 내비게이션, 문서 메타데이터, 잠금 안내, 필드 그리드와
 * 디바운스 자동 저장(700ms) 흐름을 담당한다.
 * 문서 데이터·API 계약은 각 도메인 페이지가 주입하며 여기서 모른다.
 */
export default function DocumentEditorPage<
  D extends {
    id: string;
    version: number;
    blocks: {
      key: string;
      title: string;
      description: string;
      fields: DocumentEditorField[];
      lock: { ownerName: string } | null;
      lastSavedAt: string;
    }[];
  },
>({
  copy,
  completion,
  access,
  retryVersionConflict = true,
  docId,
  documentQuery,
  editLockTargetType,
  renderBlockAside,
  renderFields,
  saveBlock,
  saveState,
  section,
}: DocumentEditorPageProps<D>) {
  const currentUser = useAuthStore(state => state.currentUser);
  const document = EDITOR_DOCS[docId];
  const validSection = document.sections.find(item => item.slug === section);

  // A stale or incompatible API payload must not enter autosave or lock flows.
  const data = isDocumentEditorDocument(documentQuery.data)
    ? documentQuery.data
    : null;
  const block = useMemo(
    () => data?.blocks.find(item => item.key === section) ?? null,
    [data, section],
  );
  const isSubmitted = data
    ? (completion?.isDocumentSubmitted(data) ?? false)
    : false;
  const editorReleaseRef = useRef<
    ((targetId: string) => Promise<unknown>) | null
  >(null);
  const waitForDraftBeforeRelease = useCallback(
    (target: { targetId: string }) =>
      editorReleaseRef.current?.(target.targetId),
    [],
  );
  const ownedEditLock = useEditLock(
    !access &&
      currentUser &&
      !isSubmitted &&
      editLockTargetType &&
      data &&
      block
      ? {
          targetType: editLockTargetType,
          targetId: `${data.id}:${block.key}`,
        }
      : null,
    waitForDraftBeforeRelease,
  );
  const isLocked = Boolean(
    isSubmitted ||
    (access && !access.canEdit) ||
    ownedEditLock.pending ||
    ownedEditLock.locked ||
    (block?.lock && block.lock.ownerName !== currentUser?.name),
  );
  const refetchDocument = documentQuery.refetch;
  const refreshCurrentDocument = useCallback(async () => {
    const refreshed = await refetchDocument();
    return isDocumentEditorDocument(refreshed.data) ? refreshed.data : null;
  }, [refetchDocument]);
  const editor = useDocumentEditorAutosave({
    block,
    canSave: Boolean(currentUser && block && !isLocked),
    document: data,
    refreshDocument: refreshCurrentDocument,
    saveBlock,
    retryVersionConflict,
  });
  useLayoutEffect(() => {
    editorReleaseRef.current = editor.flushBeforeRelease;
  }, [editor.flushBeforeRelease]);
  const fields = editor.fields;

  if (!validSection) {
    return (
      <Navigate
        replace
        to={editorSectionTo(docId, document.sections[0].slug)}
      />
    );
  }
  if (!currentUser)
    return (
      <EmptyState description={copy.loginRequired} title='로그인이 필요해요.' />
    );
  if (documentQuery.isPending)
    return (
      <EmptyState description={copy.loading} title='잠시만 기다려 주세요.' />
    );
  if (documentQuery.isError || !block)
    return (
      <EmptyState description={copy.loadFailed} title='문서를 열 수 없어요.' />
    );

  const lockOwnerName = ownedEditLock.ownerName ?? block.lock?.ownerName;
  const foreignDocumentLock = data!.blocks.find(
    item => item.lock && item.lock.ownerName !== currentUser.name,
  )?.lock;
  const isSubmitLocked = Boolean(isLocked || foreignDocumentLock);
  const getSectionStatus = (key: string) => {
    const item = data!.blocks.find(blockItem => blockItem.key === key);
    const completed = completion
      ? completion.isBlockCompleted(item!)
      : Boolean(
          item?.fields.length && item.fields.every(field => field.value.trim()),
        );
    return {
      label: completed ? '작성 완료' : '작성 중',
      variant: completed ? 'success' : 'accent',
    } as const;
  };
  const savedAtLabel = new Intl.DateTimeFormat('ko-KR', {
    timeStyle: 'short',
  }).format(new Date(block.lastSavedAt));
  const saveStateLabel = saveState.saving
    ? '자동 저장 중…'
    : saveState.error
      ? saveState.error
      : editor.isDirty
        ? '자동 저장 대기 중…'
        : `자동 저장됨 · ${savedAtLabel}`;
  const onFieldsChange = editor.onFieldsChange;
  const onChange = (key: string, value: string) => {
    const next = fields.map(field =>
      field.key === key ? { ...field, value } : field,
    );
    onFieldsChange(next);
  };
  const completeCurrentBlock = async () => {
    if (!completion || isLocked) return;
    try {
      const latestDocument = await editor.flushBlock(block.key);
      const latestBlock = latestDocument?.blocks.find(
        item => item.key === block.key,
      );
      if (!latestDocument || !latestBlock) return;
      let completedDocument: D;
      try {
        completedDocument = await completion.completeBlock({
          documentId: latestDocument.id,
          version: latestDocument.version,
          block: latestBlock,
          fields: latestBlock.fields,
        });
      } catch (error) {
        if (!retryVersionConflict || !isDocumentVersionConflict(error))
          throw error;
        const refreshedDocument = await refreshCurrentDocument();
        const refreshedBlock = refreshedDocument?.blocks.find(
          item => item.key === block.key,
        );
        if (
          !refreshedDocument ||
          refreshedDocument.id !== latestDocument.id ||
          !refreshedBlock ||
          completion.isDocumentSubmitted(refreshedDocument) ||
          (refreshedBlock.lock &&
            refreshedBlock.lock.ownerName !== currentUser.name)
        )
          return;
        editor.acceptDocument(refreshedDocument);
        completedDocument = await completion.completeBlock({
          documentId: refreshedDocument.id,
          version: refreshedDocument.version,
          block: refreshedBlock,
          fields: refreshedBlock.fields,
        });
      }
      editor.acceptDocument(completedDocument);
    } catch {
      // 저장/완료 mutation 상태가 오류 문구를 소유한다.
    }
  };
  const submitCurrentDocument = async () => {
    if (!completion || isSubmitLocked) return;
    try {
      const latestDocument = await editor.flushAll();
      if (!latestDocument || !completion.canSubmitDocument(latestDocument))
        return;
      let submittedDocument: D;
      try {
        submittedDocument = await completion.submitDocument(
          latestDocument.id,
          latestDocument.version,
        );
      } catch (error) {
        if (!retryVersionConflict || !isDocumentVersionConflict(error))
          throw error;
        const refreshedDocument = await refreshCurrentDocument();
        if (
          !refreshedDocument ||
          refreshedDocument.id !== latestDocument.id ||
          completion.isDocumentSubmitted(refreshedDocument) ||
          refreshedDocument.blocks.some(
            item => item.lock && item.lock.ownerName !== currentUser.name,
          ) ||
          !completion.canSubmitDocument(refreshedDocument)
        )
          return;
        editor.acceptDocument(refreshedDocument);
        submittedDocument = await completion.submitDocument(
          refreshedDocument.id,
          refreshedDocument.version,
        );
      }
      editor.acceptDocument(submittedDocument);
    } catch {
      // 저장/제출 mutation 상태가 오류 문구를 소유한다.
    }
  };

  return (
    <DocumentEditorLayout
      activeSlug={section}
      docId={docId}
      heading={block.title}
      meta={<span className={styles.saveState}>{saveStateLabel}</span>}
      sections={document.sections.map(item => ({
        ...item,
        status: getSectionStatus(item.slug),
      }))}
      title={document.title}
    >
      <DocumentAccessNotice
        action={access?.controls}
        canEdit={Boolean(access ? access.canEdit : !isLocked)}
        isEditing={Boolean(access && !access.canEdit && lockOwnerName == null)}
        isSubmitted={isSubmitted}
        lockedByOther={Boolean(!isSubmitted && lockOwnerName)}
        // The document hook owns the copy while the area is read only.
        message={isLocked && !isSubmitted ? access?.notice : undefined}
        ownerName={lockOwnerName}
      />
      {access && saveState.error ? (
        <Button
          label='저장 다시 시도'
          variant='secondary'
          isDisabled={isLocked || saveState.saving}
          onClick={() => {
            void editor.flushBlock(block.key).catch(() => undefined);
          }}
        />
      ) : null}
      {renderFields?.({
        documentId: data!.id,
        block,
        fields,
        isLocked,
        onFieldsChange,
      }) ??
        (fields.length > 0 ? (
          <form
            className={styles.form}
            onSubmit={event => event.preventDefault()}
          >
            <div className={styles.fieldGrid}>
              {fields.map(field =>
                field.multiline ? (
                  <TextArea
                    isDisabled={isLocked}
                    key={field.key}
                    label={field.label}
                    onChange={value => onChange(field.key, value)}
                    value={field.value}
                  />
                ) : (
                  <TextInput
                    isDisabled={isLocked}
                    key={field.key}
                    label={field.label}
                    onChange={value => onChange(field.key, value)}
                    value={field.value}
                  />
                ),
              )}
            </div>
          </form>
        ) : null)}
      {completion ? (
        <DocumentActionBar
          error={completion.completeError ?? completion.submitError}
        >
          <Button
            isDisabled={
              isLocked ||
              completion.isBlockCompleted(block) ||
              completion.completing
            }
            label={
              completion.isBlockCompleted(block) ? '작성 완료됨' : '작성 완료'
            }
            onClick={() => void completeCurrentBlock()}
            size='md'
            tooltip={
              isLocked
                ? '읽기 전용 상태에서는 완료 처리할 수 없어요.'
                : '내용을 확인한 뒤 이 작성 영역을 완료 처리해요.'
            }
            variant='secondary'
          />
          <Button
            isDisabled={
              isSubmitted ||
              isSubmitLocked ||
              completion.submitting ||
              editor.hasDirtyDrafts ||
              !completion.canSubmitDocument(data!)
            }
            label={isSubmitted ? '제출 완료' : '제출하기'}
            onClick={() => void submitCurrentDocument()}
            size='md'
            tooltip={
              isSubmitted
                ? undefined
                : foreignDocumentLock
                  ? `${foreignDocumentLock.ownerName}님이 다른 작성 영역을 편집 중이라 제출할 수 없어요.`
                  : isLocked
                    ? '읽기 전용 상태에서는 문서를 제출할 수 없어요.'
                    : editor.hasDirtyDrafts
                      ? '변경 내용을 자동 저장한 뒤 제출할 수 있어요.'
                      : completion.submitDisabledReason(data!)
            }
            variant='primary'
          />
        </DocumentActionBar>
      ) : null}
      {renderBlockAside?.(block, isLocked) ?? null}
    </DocumentEditorLayout>
  );
}
