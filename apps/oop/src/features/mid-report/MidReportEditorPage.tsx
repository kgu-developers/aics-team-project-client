import type { MidReport, MidReportBlock, MidReportField } from '@aics/core';
import { Button, useToast } from '@aics/design-system';
import { useCallback, useRef, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import DocumentEditorPage, {
  getSaveErrorMessage,
} from '~/features/editor/DocumentEditorPage';

import MidReportEngineFields from './MidReportEngineFields';
import MidReportGuiScreens from './MidReportGuiScreens';
import {
  midReportKeys,
  useMidReportEditLock,
  useCompleteMidReportBlockMutation,
  useCurrentMidReportQuery,
  useSubmitMidReportMutation,
  useUpdateMidReportBlockMutation,
} from './queries';

type MidReportEditorPageProps = { section: string };

export function canSubmitMidReportDocument(
  report: MidReport,
  currentUserName: string | undefined,
) {
  if (
    (report.status !== 'DRAFT' && report.status !== 'REVISION_REQUESTED') ||
    report.teamLeaderName !== currentUserName ||
    report.blocks.some(block => block.status !== 'COMPLETED')
  )
    return false;

  return (
    report.status !== 'REVISION_REQUESTED' ||
    Boolean(
      report.revision &&
      report.revision.affectedBlockKeys.every(key =>
        report.revision?.changedBlockKeys.includes(key),
      ),
    )
  );
}

export function getMidReportSubmitDisabledReason(
  report: MidReport,
  currentUserName: string | undefined,
) {
  if (report.status === 'SUBMITTED') return '이미 제출한 중간보고서예요.';
  if (report.teamLeaderName !== currentUserName)
    return '팀장만 중간보고서를 제출할 수 있어요.';
  if (report.blocks.some(block => block.status !== 'COMPLETED'))
    return '모든 작성 영역을 완료 처리하면 제출할 수 있어요.';
  if (!canSubmitMidReportDocument(report, currentUserName))
    return '피드백 대상 영역을 실제로 수정한 뒤 다시 완료해 주세요.';
  return report.status === 'REVISION_REQUESTED'
    ? '피드백을 반영한 수정본을 다시 제출할 수 있어요.'
    : '모든 작성 영역이 완료되어 제출할 수 있어요.';
}

const COPY = {
  loginRequired: '로그인 후 중간보고서를 열 수 있어요.',
  loading: '중간보고서를 불러오는 중이에요.',
  loadFailed: '중간보고서를 불러오지 못했어요. 다시 시도해 주세요.',
  saveFailed: '저장하지 못했어요. 다시 시도해 주세요.',
} as const;

export default function MidReportEditorPage({
  section,
}: MidReportEditorPageProps) {
  const toast = useToast();
  const [documentAction, setDocumentAction] = useState<
    'complete' | 'submit' | null
  >(null);
  const actionPending = useRef(false);
  const runDocumentAction = async (
    kind: 'complete' | 'submit',
    action: () => Promise<MidReport>,
  ) => {
    if (actionPending.current) throw new Error('문서 작업을 처리 중이에요.');
    actionPending.current = true;
    setDocumentAction(kind);
    try {
      return await action();
    } finally {
      actionPending.current = false;
      setDocumentAction(null);
    }
  };
  const currentUser = useAuthStore(state => state.currentUser);
  const query = useCurrentMidReportQuery(Boolean(currentUser));

  const lock = useMidReportEditLock(query.data, section);

  const mutation = useUpdateMidReportBlockMutation();
  const completionMutation = useCompleteMidReportBlockMutation();
  const submitMutation = useSubmitMidReportMutation();

  const saveBlock = useCallback(
    (input: {
      documentId: string;
      version: number;
      block: MidReportBlock;
      fields: MidReportField[];
    }) => {
      return lock.ensureWrite(input.documentId, input.block.key).then(() =>
        mutation.mutateAsync({
          documentId: input.documentId,
          version: input.version,
          blockKey: input.block.key,
          fields: input.fields,
        }),
      );
    },
    [mutation, lock],
  );

  return (
    <DocumentEditorPage
      key={JSON.stringify(midReportKeys.current())}
      copy={COPY}
      access={{
        canEdit: lock.canEdit,
        notice: lock.notice,
        // The lock is taken when the area opens; the control only retries.
        controls:
          query.data?.status !== 'SUBMITTED' && !lock.canEdit ? (
            <Button
              label='편집 권한 다시 확인'
              isDisabled={
                lock.pending ||
                Date.parse(query.data?.dueDate ?? '') <= Date.now()
              }
              onClick={() => void lock.startEditing()}
              size='sm'
              variant='secondary'
            />
          ) : null,
      }}
      retryVersionConflict={false}
      completion={{
        isBlockCompleted: block => block.status === 'COMPLETED',
        completeBlock: input =>
          runDocumentAction('complete', async () => {
            await lock.ensureWrite(input.documentId, input.block.key);
            const report = await completionMutation.mutateAsync({
              documentId: input.documentId,
              version: input.version,
              blockKey: input.block.key,
            });
            toast({ body: `${input.block.title} 영역을 완료 처리했어요.` });
            return report;
          }),
        completing:
          documentAction === 'complete' || completionMutation.isPending,
        completeError: completionMutation.isError
          ? getSaveErrorMessage(
              completionMutation.error,
              '완료 처리하지 못했어요.',
            )
          : null,
        isDocumentSubmitted: report => report.status === 'SUBMITTED',
        submitDocument: (documentId, version) =>
          runDocumentAction('submit', async () => {
            await lock.ensureWrite(documentId, section);
            await lock.ensureCanSubmit();
            const report = await submitMutation.mutateAsync({
              documentId,
              version,
            });
            toast({
              body: report.revision?.resubmittedAt
                ? '피드백을 반영한 중간보고서를 다시 제출했어요.'
                : '중간보고서를 제출했어요. 이제 읽기 전용으로 확인할 수 있어요.',
            });
            return report;
          }),
        submitting: documentAction === 'submit' || submitMutation.isPending,
        submitError: submitMutation.isError
          ? getSaveErrorMessage(submitMutation.error, '제출하지 못했어요.')
          : lock.error,
        canSubmitDocument: report =>
          canSubmitMidReportDocument(report, currentUser?.name),
        submitDisabledReason: report =>
          getMidReportSubmitDisabledReason(report, currentUser?.name),
      }}
      docId='mid-review'
      documentQuery={query}
      editLockTargetType={null}
      metadataTag='DOC / MID-REVIEW / FORM V1'
      renderFields={({
        documentId,
        block,
        fields,
        isLocked,
        onFieldsChange,
      }) => {
        if (block.key === 'gui-design')
          return (
            <MidReportGuiScreens
              fields={fields}
              isLocked={isLocked}
              key={`${documentId}:${block.key}`}
              onFieldsChange={onFieldsChange}
            />
          );
        if (block.key === 'engine-design')
          return (
            <MidReportEngineFields
              fields={fields}
              isLocked={isLocked}
              key={`${documentId}:${block.key}`}
              onFieldsChange={onFieldsChange}
            />
          );
        return null;
      }}
      saveBlock={saveBlock}
      saveState={{
        saving: mutation.isPending,
        error: mutation.isError
          ? getSaveErrorMessage(mutation.error, COPY.saveFailed)
          : null,
      }}
      section={section}
    />
  );
}
