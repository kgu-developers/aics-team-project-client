import type { UseQueryResult } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import type {
  DocumentEditorDocument,
  DocumentEditorSaveBlocker,
} from './documentEditor';
import DocumentEditorPage from './DocumentEditorPage';

import { demoStudent } from '~/mocks/data/users';
import { renderWithRouter } from '~/test/renderWithRouter';

const lockApi = vi.hoisted(() => ({
  acquireEditLock: vi.fn(),
  removeEditLock: vi.fn(),
}));

vi.mock('@aics/api-client', async importOriginal => ({
  ...(await importOriginal<typeof import('@aics/api-client')>()),
  acquireEditLock: lockApi.acquireEditLock,
  removeEditLock: lockApi.removeEditLock,
}));

type TestDocument = DocumentEditorDocument;

function createDocument(
  version = 1,
  teamName = '기존 팀명',
  id = 'proposal-test',
): TestDocument {
  return {
    id,
    version,
    blocks: [
      {
        key: 'team-info',
        title: '팀 정보',
        description: '팀 정보를 작성해요.',
        fields: [{ key: 'teamName', label: '팀 이름', value: teamName }],
        lock: null,
        lastSavedAt: '2026-08-24T10:00:00+09:00',
      },
      {
        key: 'topic',
        title: '주제',
        description: '주제를 작성해요.',
        fields: [{ key: 'topicName', label: '주제 이름', value: '기존 주제' }],
        lock: null,
        lastSavedAt: '2026-08-24T10:00:00+09:00',
      },
    ],
  };
}

function query(
  data: TestDocument,
  refetch: () => Promise<{ data: TestDocument }> = async () => ({ data }),
): UseQueryResult<TestDocument> {
  return {
    data,
    isError: false,
    isPending: false,
    refetch,
  } as UseQueryResult<TestDocument>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

const copy = {
  loginRequired: '로그인이 필요해요.',
  loading: '불러오는 중이에요.',
  loadFailed: '불러오지 못했어요.',
  saveFailed: '저장하지 못했어요.',
};

function editor(
  section: string,
  data: TestDocument,
  saveBlock: DocumentEditorSaveBlocker<TestDocument>,
) {
  return (
    <DocumentEditorPage
      copy={copy}
      docId='proposal'
      documentQuery={query(data)}
      editLockTargetType={null}
      metadataTag='TEST'
      saveBlock={saveBlock}
      saveState={{ error: null, saving: false }}
      section={section}
    />
  );
}

describe('DocumentEditorPage 자동 저장', () => {
  beforeEach(() => {
    useAuthStore.getState().setCurrentUser(demoStudent);
    lockApi.acquireEditLock.mockImplementation(
      async (target: { targetId: string; targetType: string }) => ({
        ...target,
        leaseId: `lease-${target.targetId}`,
        locked: true,
        lockedAt: '2026-08-24T10:00:00+09:00',
        lockedBy: demoStudent.name,
      }),
    );
    lockApi.removeEditLock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it('StrictMode effect 재실행 뒤에도 입력과 자동 저장이 동작한다', async () => {
    vi.useFakeTimers();
    const saveBlock = vi.fn(async () => createDocument(2, 'StrictMode 입력'));

    renderWithRouter(
      <StrictMode>
        {editor('team-info', createDocument(), saveBlock)}
      </StrictMode>,
    );
    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: 'StrictMode 입력' },
    });

    expect(screen.getByLabelText('팀 이름')).toHaveValue('StrictMode 입력');
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(saveBlock).toHaveBeenCalledTimes(1);
  });

  it('디바운스 전에 섹션을 이동해도 draft를 즉시 저장하고 돌아왔을 때 유지한다', async () => {
    const pendingSave = deferred<TestDocument>();
    const saveBlock = vi.fn(() => pendingSave.promise);
    const initialDocument = createDocument();
    const view = renderWithRouter(
      editor('team-info', initialDocument, saveBlock),
    );

    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '수정한 팀명' },
    });
    expect(screen.getByText(/자동 저장 대기 중/)).toBeInTheDocument();

    view.rerender(editor('topic', initialDocument, saveBlock));
    await act(async () => undefined);

    expect(saveBlock).toHaveBeenCalledTimes(1);
    expect(saveBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 1,
        fields: [
          expect.objectContaining({ key: 'teamName', value: '수정한 팀명' }),
        ],
      }),
    );

    view.rerender(editor('team-info', initialDocument, saveBlock));
    expect(screen.getByLabelText('팀 이름')).toHaveValue('수정한 팀명');

    await act(async () => {
      pendingSave.resolve(createDocument(2, '수정한 팀명'));
    });
  });

  it('저장 중 추가 입력은 병렬 요청 없이 응답 version 다음에 이어서 저장한다', async () => {
    vi.useFakeTimers();
    const firstSave = deferred<TestDocument>();
    const secondSave = deferred<TestDocument>();
    const saveBlock = vi
      .fn<DocumentEditorSaveBlocker<TestDocument>>()
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => secondSave.promise);
    const initialDocument = createDocument();
    const view = renderWithRouter(
      editor('team-info', initialDocument, saveBlock),
    );

    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '첫 입력' },
    });
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(saveBlock).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '가장 최신 입력' },
    });
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(saveBlock).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstSave.resolve(createDocument(2, '첫 입력'));
    });
    expect(saveBlock).toHaveBeenCalledTimes(2);
    expect(saveBlock.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        version: 2,
        fields: [
          expect.objectContaining({
            key: 'teamName',
            value: '가장 최신 입력',
          }),
        ],
      }),
    );

    view.rerender(editor('team-info', createDocument(2, '첫 입력'), saveBlock));
    expect(screen.getByLabelText('팀 이름')).toHaveValue('가장 최신 입력');

    await act(async () => {
      secondSave.resolve(createDocument(3, '가장 최신 입력'));
    });
  });

  it('다른 블록 저장으로 version이 충돌하면 최신 문서를 조회하고 dirty draft를 재시도한다', async () => {
    vi.useFakeTimers();
    const initialDocument = createDocument();
    const refreshedDocument = createDocument(2, '서버의 기존 팀명');
    const savedDocument = createDocument(3, '충돌 뒤 보존한 draft');
    const refetch = vi.fn(async () => ({ data: refreshedDocument }));
    const saveBlock = vi
      .fn<DocumentEditorSaveBlocker<TestDocument>>()
      .mockRejectedValueOnce({
        response: { data: { code: 'VERSION_CONFLICT' } },
      })
      .mockResolvedValueOnce(savedDocument);

    renderWithRouter(
      <DocumentEditorPage
        copy={copy}
        docId='proposal'
        documentQuery={query(initialDocument, refetch)}
        editLockTargetType={null}
        metadataTag='TEST'
        saveBlock={saveBlock}
        saveState={{ error: null, saving: false }}
        section='team-info'
      />,
    );
    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '충돌 뒤 보존한 draft' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(saveBlock).toHaveBeenCalledTimes(2);
    expect(saveBlock.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        version: 2,
        fields: [expect.objectContaining({ value: '충돌 뒤 보존한 draft' })],
      }),
    );
    expect(screen.getByLabelText('팀 이름')).toHaveValue(
      '충돌 뒤 보존한 draft',
    );
  });

  it('읽기 전용 잠금으로 전환되면 예약된 저장을 취소한다', async () => {
    vi.useFakeTimers();
    const saveBlock = vi.fn(async () => createDocument(2, '수정한 팀명'));
    const initialDocument = createDocument();
    const lockedDocument: TestDocument = {
      ...initialDocument,
      blocks: initialDocument.blocks.map(block =>
        block.key === 'team-info'
          ? { ...block, lock: { ownerName: '다른 팀원' } }
          : block,
      ),
    };
    const view = renderWithRouter(
      editor('team-info', initialDocument, saveBlock),
    );

    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '수정한 팀명' },
    });
    view.rerender(editor('team-info', lockedDocument, saveBlock));
    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(saveBlock).not.toHaveBeenCalled();
    expect(screen.getByLabelText('팀 이름')).toBeDisabled();
  });

  it('같은 에디터 인스턴스에서 문서가 바뀌면 이전 문서 draft를 노출하지 않는다', () => {
    const saveBlock = vi.fn(async () => createDocument(2, '수정한 팀명'));
    const firstDocument = createDocument();
    const secondDocument = createDocument(1, '새 문서 팀명', 'proposal-next');
    const view = renderWithRouter(
      editor('team-info', firstDocument, saveBlock),
    );

    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '첫 문서의 미저장 초안' },
    });
    expect(screen.getByLabelText('팀 이름')).toHaveValue(
      '첫 문서의 미저장 초안',
    );

    view.rerender(editor('team-info', secondDocument, saveBlock));

    expect(screen.getByLabelText('팀 이름')).toHaveValue('새 문서 팀명');
  });

  it('이전 문서 저장 응답이 늦게 도착해도 새 문서 draft와 version을 건드리지 않는다', async () => {
    vi.useFakeTimers();
    const firstSave = deferred<TestDocument>();
    const saveBlock = vi
      .fn<DocumentEditorSaveBlocker<TestDocument>>()
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(async input =>
        createDocument(2, input.fields[0]?.value, 'proposal-next'),
      );
    const firstDocument = createDocument();
    const secondDocument = createDocument(1, '새 문서 팀명', 'proposal-next');
    const view = renderWithRouter(
      editor('team-info', firstDocument, saveBlock),
    );

    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '첫 문서 저장값' },
    });
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(saveBlock).toHaveBeenCalledTimes(1);
    expect(saveBlock.mock.calls[0]?.[0].documentId).toBe('proposal-test');

    view.rerender(editor('team-info', secondDocument, saveBlock));
    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '새 문서 미저장 초안' },
    });

    await act(async () => {
      firstSave.resolve(createDocument(2, '첫 문서 저장값'));
    });
    expect(screen.getByLabelText('팀 이름')).toHaveValue('새 문서 미저장 초안');

    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(saveBlock).toHaveBeenCalledTimes(2);
    expect(saveBlock.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        documentId: 'proposal-next',
        version: 1,
        fields: [expect.objectContaining({ value: '새 문서 미저장 초안' })],
      }),
    );
  });

  it('이전 문서 완료 응답이 늦게 도착해도 새 문서 draft를 지우지 않는다', async () => {
    const pendingCompletion = deferred<TestDocument>();
    const firstDocument = createDocument();
    const secondDocument = createDocument(1, '새 문서 팀명', 'proposal-next');
    const completion = {
      isBlockCompleted: () => false,
      completeBlock: vi.fn(() => pendingCompletion.promise),
      completing: false,
      completeError: null,
      isDocumentSubmitted: () => false,
      submitDocument: vi.fn(async () => firstDocument),
      submitting: false,
      submitError: null,
      canSubmitDocument: () => false,
      submitDisabledReason: () => '제출할 수 없어요.',
    };
    const saveBlock = vi.fn(async () => firstDocument);
    const view = renderWithRouter(
      <DocumentEditorPage
        copy={copy}
        completion={completion}
        docId='proposal'
        documentQuery={query(firstDocument)}
        editLockTargetType={null}
        metadataTag='TEST'
        saveBlock={saveBlock}
        saveState={{ error: null, saving: false }}
        section='team-info'
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '작성 완료' }));
    await act(async () => undefined);
    expect(completion.completeBlock).toHaveBeenCalledTimes(1);

    view.rerender(
      <DocumentEditorPage
        copy={copy}
        completion={completion}
        docId='proposal'
        documentQuery={query(secondDocument)}
        editLockTargetType={null}
        metadataTag='TEST'
        saveBlock={saveBlock}
        saveState={{ error: null, saving: false }}
        section='team-info'
      />,
    );
    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '새 문서 미저장 초안' },
    });

    await act(async () => {
      pendingCompletion.resolve(createDocument(2, '첫 문서 완료값'));
    });

    expect(screen.getByLabelText('팀 이름')).toHaveValue('새 문서 미저장 초안');
  });

  it('완료 처리 version 충돌은 최신 문서를 조회해 한 번 재시도한다', async () => {
    const initialDocument = createDocument();
    const refreshedDocument = createDocument(2);
    const completedDocument = createDocument(3);
    const refetch = vi.fn(async () => ({ data: refreshedDocument }));
    const completeBlock = vi
      .fn()
      .mockRejectedValueOnce({
        response: { data: { code: 'VERSION_CONFLICT' } },
      })
      .mockResolvedValueOnce(completedDocument);
    const completion = {
      isBlockCompleted: () => false,
      completeBlock,
      completing: false,
      completeError: null,
      isDocumentSubmitted: () => false,
      submitDocument: vi.fn(async () => completedDocument),
      submitting: false,
      submitError: null,
      canSubmitDocument: () => false,
      submitDisabledReason: () => '제출할 수 없어요.',
    };

    renderWithRouter(
      <DocumentEditorPage
        copy={copy}
        completion={completion}
        docId='proposal'
        documentQuery={query(initialDocument, refetch)}
        editLockTargetType={null}
        metadataTag='TEST'
        saveBlock={vi.fn(async () => initialDocument)}
        saveState={{ error: null, saving: false }}
        section='team-info'
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '작성 완료' }));

    await waitFor(() => expect(completeBlock).toHaveBeenCalledTimes(2));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(completeBlock.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ version: 2 }),
    );
  });

  it('문서 제출 version 충돌은 최신 제출 조건을 확인해 한 번 재시도한다', async () => {
    const initialDocument = createDocument();
    const refreshedDocument = createDocument(2);
    const submittedDocument = createDocument(3);
    const refetch = vi.fn(async () => ({ data: refreshedDocument }));
    const submitDocument = vi
      .fn()
      .mockRejectedValueOnce({
        response: { data: { code: 'VERSION_CONFLICT' } },
      })
      .mockResolvedValueOnce(submittedDocument);
    const completion = {
      isBlockCompleted: () => true,
      completeBlock: vi.fn(async () => submittedDocument),
      completing: false,
      completeError: null,
      isDocumentSubmitted: () => false,
      submitDocument,
      submitting: false,
      submitError: null,
      canSubmitDocument: () => true,
      submitDisabledReason: () => '제출할 수 있어요.',
    };

    renderWithRouter(
      <DocumentEditorPage
        copy={copy}
        completion={completion}
        docId='proposal'
        documentQuery={query(initialDocument, refetch)}
        editLockTargetType={null}
        metadataTag='TEST'
        saveBlock={vi.fn(async () => initialDocument)}
        saveState={{ error: null, saving: false }}
        section='team-info'
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '제출하기' }));

    await waitFor(() => expect(submitDocument).toHaveBeenCalledTimes(2));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(submitDocument).toHaveBeenLastCalledWith('proposal-test', 2);
  });

  it('문서 제출 version 충돌 뒤 최신 문서가 제출 불가면 재시도하지 않는다', async () => {
    const initialDocument = createDocument();
    const refreshedDocument = createDocument(2);
    const refetch = vi.fn(async () => ({ data: refreshedDocument }));
    const submitDocument = vi.fn().mockRejectedValueOnce({
      response: { data: { code: 'VERSION_CONFLICT' } },
    });
    const completion = {
      isBlockCompleted: () => true,
      completeBlock: vi.fn(async () => refreshedDocument),
      completing: false,
      completeError: null,
      isDocumentSubmitted: () => false,
      submitDocument,
      submitting: false,
      submitError: null,
      canSubmitDocument: (document: TestDocument) => document.version === 1,
      submitDisabledReason: () => '제출할 수 있어요.',
    };

    renderWithRouter(
      <DocumentEditorPage
        copy={copy}
        completion={completion}
        docId='proposal'
        documentQuery={query(initialDocument, refetch)}
        editLockTargetType={null}
        metadataTag='TEST'
        saveBlock={vi.fn(async () => initialDocument)}
        saveState={{ error: null, saving: false }}
        section='team-info'
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '제출하기' }));

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(submitDocument).toHaveBeenCalledTimes(1);
  });

  it('현재 영역이 읽기 전용이면 제출 조건을 충족해도 제출하지 않는다', () => {
    const document = createDocument();
    const lockedDocument: TestDocument = {
      ...document,
      blocks: document.blocks.map(block =>
        block.key === 'team-info'
          ? { ...block, lock: { ownerName: '다른 팀원' } }
          : block,
      ),
    };
    const submitDocument = vi.fn(async () => lockedDocument);
    const completion = {
      isBlockCompleted: () => true,
      completeBlock: vi.fn(async () => lockedDocument),
      completing: false,
      completeError: null,
      isDocumentSubmitted: () => false,
      submitDocument,
      submitting: false,
      submitError: null,
      canSubmitDocument: () => true,
      submitDisabledReason: () => '제출할 수 있어요.',
    };

    renderWithRouter(
      <DocumentEditorPage
        copy={copy}
        completion={completion}
        docId='proposal'
        documentQuery={query(lockedDocument)}
        editLockTargetType={null}
        metadataTag='TEST'
        saveBlock={vi.fn(async () => lockedDocument)}
        saveState={{ error: null, saving: false }}
        section='team-info'
      />,
    );

    const submitButton = screen.getByRole('button', { name: '제출하기' });
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(submitButton);
    expect(submitDocument).not.toHaveBeenCalled();
  });

  it('다른 작성 영역을 팀원이 잠그면 현재 영역이 열려 있어도 제출하지 않는다', () => {
    const document = createDocument();
    const otherBlockLockedDocument: TestDocument = {
      ...document,
      blocks: document.blocks.map(block =>
        block.key === 'topic'
          ? { ...block, lock: { ownerName: '다른 팀원' } }
          : block,
      ),
    };
    const submitDocument = vi.fn(async () => otherBlockLockedDocument);
    const completion = {
      isBlockCompleted: () => true,
      completeBlock: vi.fn(async () => otherBlockLockedDocument),
      completing: false,
      completeError: null,
      isDocumentSubmitted: () => false,
      submitDocument,
      submitting: false,
      submitError: null,
      canSubmitDocument: () => true,
      submitDisabledReason: () => '제출할 수 있어요.',
    };

    renderWithRouter(
      <DocumentEditorPage
        copy={copy}
        completion={completion}
        docId='proposal'
        documentQuery={query(otherBlockLockedDocument)}
        editLockTargetType={null}
        metadataTag='TEST'
        saveBlock={vi.fn(async () => otherBlockLockedDocument)}
        saveState={{ error: null, saving: false }}
        section='team-info'
      />,
    );

    expect(screen.getByLabelText('팀 이름')).not.toBeDisabled();
    const submitButton = screen.getByRole('button', { name: '제출하기' });
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(submitButton);
    expect(submitDocument).not.toHaveBeenCalled();
  });

  it('섹션 이탈 시 마지막 draft 저장이 끝난 뒤 lease를 해제한다', async () => {
    const pendingSave = deferred<TestDocument>();
    const saveBlock = vi.fn(() => pendingSave.promise);
    const initialDocument = createDocument();
    const renderLockedEditor = (section: string) => (
      <DocumentEditorPage
        copy={copy}
        docId='proposal'
        documentQuery={query(initialDocument)}
        editLockTargetType='PROJECT_BLOCK'
        metadataTag='TEST'
        saveBlock={saveBlock}
        saveState={{ error: null, saving: false }}
        section={section}
      />
    );
    const view = renderWithRouter(renderLockedEditor('team-info'));
    await act(async () => undefined);

    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '이탈 직전 draft' },
    });
    view.rerender(renderLockedEditor('topic'));
    await act(async () => undefined);

    expect(saveBlock).toHaveBeenCalledTimes(1);
    expect(lockApi.removeEditLock).not.toHaveBeenCalledWith({
      targetType: 'PROJECT_BLOCK',
      targetId: 'proposal-test:team-info',
      leaseId: 'lease-proposal-test:team-info',
    });

    await act(async () => {
      pendingSave.resolve(createDocument(2, '이탈 직전 draft'));
    });
    expect(lockApi.removeEditLock).toHaveBeenCalledWith({
      targetType: 'PROJECT_BLOCK',
      targetId: 'proposal-test:team-info',
      leaseId: 'lease-proposal-test:team-info',
    });
  });
});
