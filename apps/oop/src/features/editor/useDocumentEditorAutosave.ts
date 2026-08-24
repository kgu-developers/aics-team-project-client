import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';

import {
  isDocumentVersionConflict,
  type DocumentEditorDocument,
  type DocumentEditorField,
  type DocumentEditorSaveBlocker,
} from './documentEditor';

const AUTOSAVE_DELAY_MS = 700;

type Draft = {
  fields: DocumentEditorField[];
  persistedRevision: number;
  revision: number;
};

type PreservedDraft = Pick<Draft, 'fields' | 'revision'>;

type UseDocumentEditorAutosaveInput<D extends DocumentEditorDocument> = {
  block: D['blocks'][number] | null;
  canSave: boolean;
  document: D | null;
  refreshDocument: () => Promise<D | null>;
  saveBlock: DocumentEditorSaveBlocker<D>;
};

/**
 * 문서 에디터의 섹션별 draft와 버전 기반 저장 큐를 소유한다.
 *
 * 저장 요청은 문서 단위로 직렬화하며, 요청 중에 추가 입력이 생기면 최신
 * revision까지 이어서 저장한다. 서버 응답은 clean draft만 갱신하므로 먼저
 * 보낸 저장 응답이 이후 입력을 덮어쓰지 않는다.
 */
export function useDocumentEditorAutosave<D extends DocumentEditorDocument>({
  block,
  canSave,
  document,
  refreshDocument,
  saveBlock,
}: UseDocumentEditorAutosaveInput<D>) {
  const [, rerender] = useReducer(value => value + 1, 0);
  const draftsRef = useRef(new Map<string, Draft>());
  const latestDocumentRef = useRef<D | null>(document);
  const refreshDocumentRef = useRef(refreshDocument);
  const saveBlockRef = useRef(saveBlock);
  const savePermissionsRef = useRef(new Map<string, boolean>());
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const exitFlushesRef = useRef(new Map<string, Promise<unknown>>());
  const queuedFlushesRef = useRef(
    new Map<string, { promise: Promise<D | null>; revision: number }>(),
  );
  const timerRef = useRef<{ blockKey: string; id: number } | null>(null);
  const mountedRef = useRef(true);

  const activeBlockKey = block?.key ?? null;
  const activeBlockIdentity =
    document && activeBlockKey ? `${document.id}:${activeBlockKey}` : null;

  const forceRerender = useCallback(() => {
    if (mountedRef.current) rerender();
  }, []);

  const synchronizeDocument = useCallback(
    (nextDocument: D) => {
      const current = latestDocumentRef.current;
      if (
        current &&
        current.id === nextDocument.id &&
        current.version > nextDocument.version
      )
        return current;

      if (current && current.id !== nextDocument.id) {
        draftsRef.current.clear();
        savePermissionsRef.current.clear();
      }
      latestDocumentRef.current = nextDocument;

      nextDocument.blocks.forEach(nextBlock => {
        const draft = draftsRef.current.get(nextBlock.key);
        if (!draft || draft.revision !== draft.persistedRevision) return;
        draft.fields = nextBlock.fields;
      });
      forceRerender();
      return nextDocument;
    },
    [forceRerender],
  );

  const acceptDocument = useCallback(
    (nextDocument: D) => {
      const current = latestDocumentRef.current;
      if (!current || current.id !== nextDocument.id) return current;
      return synchronizeDocument(nextDocument);
    },
    [synchronizeDocument],
  );

  useLayoutEffect(() => {
    saveBlockRef.current = saveBlock;
  }, [saveBlock]);

  useLayoutEffect(() => {
    refreshDocumentRef.current = refreshDocument;
  }, [refreshDocument]);

  useLayoutEffect(() => {
    if (document) synchronizeDocument(document);
  }, [document, synchronizeDocument]);

  useLayoutEffect(() => {
    if (activeBlockKey) savePermissionsRef.current.set(activeBlockKey, canSave);
  }, [activeBlockIdentity, activeBlockKey, canSave]);

  const persistBlock = useCallback(
    async (
      expectedDocument: D | null,
      blockKey: string,
      preservedDraft?: PreservedDraft,
    ) => {
      if (!expectedDocument) return null;
      let pendingPreservedDraft = preservedDraft;
      let retriedVersionConflict = false;
      while (true) {
        const currentDocument = latestDocumentRef.current;
        const isCurrentDocument = Boolean(
          expectedDocument && currentDocument?.id === expectedDocument.id,
        );
        const latestDocument =
          isCurrentDocument && currentDocument
            ? currentDocument
            : expectedDocument;
        const draft = isCurrentDocument
          ? draftsRef.current.get(blockKey)
          : undefined;
        if (!draft && !pendingPreservedDraft) return latestDocument;
        if (
          draft &&
          pendingPreservedDraft &&
          pendingPreservedDraft.revision <= draft.persistedRevision
        ) {
          pendingPreservedDraft = undefined;
        }
        if (
          draft &&
          !pendingPreservedDraft &&
          draft.revision === draft.persistedRevision
        )
          return latestDocument;
        if (
          !pendingPreservedDraft &&
          savePermissionsRef.current.get(blockKey) !== true
        )
          return latestDocument;

        const latestBlock = latestDocument.blocks.find(
          item => item.key === blockKey,
        );
        if (!latestBlock) return latestDocument;

        const savedRevision =
          pendingPreservedDraft?.revision ?? draft?.revision ?? 0;
        const savedFields =
          pendingPreservedDraft?.fields ?? draft?.fields ?? [];
        pendingPreservedDraft = undefined;
        let savedDocument: D;
        try {
          savedDocument = await saveBlockRef.current({
            documentId: latestDocument.id,
            version: latestDocument.version,
            block: latestBlock,
            fields: savedFields,
          });
        } catch (error) {
          if (
            retriedVersionConflict ||
            !isDocumentVersionConflict(error) ||
            latestDocumentRef.current?.id !== expectedDocument.id
          )
            throw error;
          const refreshedDocument = await refreshDocumentRef.current();
          if (
            !refreshedDocument ||
            refreshedDocument.id !== expectedDocument.id
          )
            throw error;
          synchronizeDocument(refreshedDocument);
          pendingPreservedDraft = {
            fields: savedFields,
            revision: savedRevision,
          };
          retriedVersionConflict = true;
          continue;
        }
        retriedVersionConflict = false;
        if (
          savedDocument.id !== expectedDocument.id ||
          latestDocumentRef.current?.id !== expectedDocument.id
        )
          return null;
        const acceptedDocument = acceptDocument(savedDocument);
        const currentDraft = draftsRef.current.get(blockKey);

        if (currentDraft) {
          currentDraft.persistedRevision = Math.max(
            currentDraft.persistedRevision,
            savedRevision,
          );
          if (currentDraft.revision === savedRevision) {
            const savedBlock = savedDocument.blocks.find(
              item => item.key === blockKey,
            );
            currentDraft.fields = savedBlock?.fields ?? savedFields;
          }
        }
        forceRerender();

        if (!currentDraft || currentDraft.revision === savedRevision)
          return acceptedDocument;
        // 저장 요청 중 입력된 더 최신 revision은 같은 큐에서 다음 version으로
        // 이어 저장한다. 이 사이에 별도의 병렬 요청을 만들지 않는다.
      }
    },
    [acceptDocument, forceRerender, synchronizeDocument],
  );

  const flushBlock = useCallback(
    (blockKey: string, preservePermission = false) => {
      const expectedDocument = latestDocumentRef.current;
      const draft = draftsRef.current.get(blockKey);
      const blockIdentity = expectedDocument
        ? `${expectedDocument.id}:${blockKey}`
        : null;
      const queuedFlush = blockIdentity
        ? queuedFlushesRef.current.get(blockIdentity)
        : null;
      if (queuedFlush && (draft?.revision ?? 0) <= queuedFlush.revision)
        return queuedFlush.promise;
      const preservedDraft =
        preservePermission && draft
          ? { fields: draft.fields, revision: draft.revision }
          : undefined;
      const operation = saveQueueRef.current.then(() =>
        persistBlock(expectedDocument, blockKey, preservedDraft),
      );
      saveQueueRef.current = operation.then(
        () => undefined,
        () => undefined,
      );
      if (blockIdentity) {
        const queueEntry = {
          promise: operation,
          revision: draft?.revision ?? 0,
        };
        queuedFlushesRef.current.set(blockIdentity, queueEntry);
        void operation.then(
          () => {
            if (queuedFlushesRef.current.get(blockIdentity) === queueEntry)
              queuedFlushesRef.current.delete(blockIdentity);
          },
          () => {
            if (queuedFlushesRef.current.get(blockIdentity) === queueEntry)
              queuedFlushesRef.current.delete(blockIdentity);
          },
        );
      }
      return operation;
    },
    [persistBlock],
  );

  const flushAll = useCallback(() => {
    const expectedDocument = latestDocumentRef.current;
    const blockKeys = Array.from(draftsRef.current.keys());
    const operation = saveQueueRef.current.then(async () => {
      let latestDocument =
        latestDocumentRef.current?.id === expectedDocument?.id
          ? latestDocumentRef.current
          : expectedDocument;
      for (const blockKey of blockKeys) {
        latestDocument = await persistBlock(expectedDocument, blockKey);
        if (!latestDocument) break;
      }
      return latestDocument;
    });
    saveQueueRef.current = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }, [persistBlock]);

  const flushBeforeRelease = useCallback(
    (targetId: string) => {
      const exitFlush = exitFlushesRef.current.get(targetId);
      if (exitFlush) return exitFlush;

      const currentDocumentId = latestDocumentRef.current?.id;
      const documentPrefix = currentDocumentId ? `${currentDocumentId}:` : null;
      if (documentPrefix && targetId.startsWith(documentPrefix))
        return flushBlock(targetId.slice(documentPrefix.length), true);
      return saveQueueRef.current;
    },
    [flushBlock],
  );

  const clearTimer = useCallback((blockKey?: string) => {
    const timer = timerRef.current;
    if (!timer || (blockKey && timer.blockKey !== blockKey)) return;
    window.clearTimeout(timer.id);
    timerRef.current = null;
  }, []);

  const scheduleSave = useCallback(
    (blockKey: string) => {
      clearTimer();
      timerRef.current = {
        blockKey,
        id: window.setTimeout(() => {
          timerRef.current = null;
          void flushBlock(blockKey).catch(() => {
            // mutation 상태가 오류 문구를 소유한다. draft는 dirty로 보존한다.
          });
        }, AUTOSAVE_DELAY_MS),
      };
    },
    [clearTimer, flushBlock],
  );

  const onFieldsChange = useCallback(
    (nextFields: DocumentEditorField[]) => {
      if (!block || savePermissionsRef.current.get(block.key) !== true) return;
      const previous = draftsRef.current.get(block.key) ?? {
        fields: block.fields,
        persistedRevision: 0,
        revision: 0,
      };
      draftsRef.current.set(block.key, {
        fields: nextFields,
        persistedRevision: previous.persistedRevision,
        revision: previous.revision + 1,
      });
      forceRerender();
      scheduleSave(block.key);
    },
    [block, forceRerender, scheduleSave],
  );

  useEffect(() => {
    if (!activeBlockKey || canSave) return;
    clearTimer(activeBlockKey);
  }, [activeBlockKey, canSave, clearTimer]);

  useLayoutEffect(() => {
    if (!activeBlockKey || !activeBlockIdentity) return;
    exitFlushesRef.current.delete(activeBlockIdentity);
    return () => {
      clearTimer(activeBlockKey);
      const mayFlushAfterExit =
        savePermissionsRef.current.get(activeBlockKey) === true;
      if (mayFlushAfterExit) {
        const exitFlush = flushBlock(activeBlockKey, true);
        exitFlushesRef.current.set(activeBlockIdentity, exitFlush);
        void exitFlush.catch(() => {
          // 화면을 떠난 뒤에도 mutation이 실패할 수 있다. 저장 큐는 복구되고
          // 현재 화면이 남아 있다면 mutation 오류 상태가 안내를 담당한다.
        });
      } else {
        exitFlushesRef.current.set(activeBlockIdentity, saveQueueRef.current);
      }
      savePermissionsRef.current.set(activeBlockKey, false);
    };
  }, [activeBlockIdentity, activeBlockKey, clearTimer, flushBlock]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isCurrentDocument = Boolean(
    document && latestDocumentRef.current?.id === document.id,
  );
  const draft =
    isCurrentDocument && activeBlockKey
      ? draftsRef.current.get(activeBlockKey)
      : undefined;
  const fields = draft?.fields ?? block?.fields ?? [];
  const isDirty = Boolean(draft && draft.revision !== draft.persistedRevision);
  const hasDirtyDrafts = Array.from(draftsRef.current.values()).some(
    item => item.revision !== item.persistedRevision,
  );

  return {
    acceptDocument,
    fields,
    flushAll,
    flushBeforeRelease,
    flushBlock,
    hasDirtyDrafts,
    isDirty,
    onFieldsChange,
  };
}
