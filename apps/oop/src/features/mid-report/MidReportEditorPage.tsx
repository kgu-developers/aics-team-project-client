import type { MidReportBlock, MidReportField } from '@aics/core';
import { useToast } from '@aics/design-system';
import { useCallback } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import DocumentEditorPage, {
  getSaveErrorMessage,
} from '~/features/editor/DocumentEditorPage';

import MidReportEngineFields from './MidReportEngineFields';
import MidReportStructuredFields from './MidReportStructuredFields';
import {
  useCompleteMidReportBlockMutation,
  useCurrentMidReportQuery,
  useSubmitMidReportMutation,
  useUpdateMidReportBlockMutation,
} from './queries';

type MidReportEditorPageProps = { section: string };

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
  const currentUser = useAuthStore(state => state.currentUser);
  const query = useCurrentMidReportQuery(Boolean(currentUser));

  const mutation = useUpdateMidReportBlockMutation();
  const completionMutation = useCompleteMidReportBlockMutation();
  const submitMutation = useSubmitMidReportMutation();

  const saveBlock = useCallback(
    (input: {
      documentId: string;
      version: number;
      block: MidReportBlock;
      fields: MidReportField[];
    }) =>
      mutation.mutateAsync({
        documentId: input.documentId,
        version: input.version,
        blockKey: input.block.key,
        fields: input.fields,
      }),
    [mutation],
  );

  return (
    <DocumentEditorPage
      copy={COPY}
      completion={{
        isBlockCompleted: block => block.status === 'COMPLETED',
        completeBlock: async input => {
          const report = await completionMutation.mutateAsync({
            documentId: input.documentId,
            version: input.version,
            blockKey: input.block.key,
          });
          toast({ body: `${input.block.title} 영역을 완료 처리했어요.` });
          return report;
        },
        completing: completionMutation.isPending,
        completeError: completionMutation.isError
          ? getSaveErrorMessage(
              completionMutation.error,
              '완료 처리하지 못했어요.',
            )
          : null,
        isDocumentSubmitted: report => report.status === 'SUBMITTED',
        submitDocument: async (documentId, version) => {
          const report = await submitMutation.mutateAsync({
            documentId,
            version,
          });
          toast({
            body: '중간보고서를 제출했어요. 이제 읽기 전용으로 확인할 수 있어요.',
          });
          return report;
        },
        submitting: submitMutation.isPending,
        submitError: submitMutation.isError
          ? getSaveErrorMessage(submitMutation.error, '제출하지 못했어요.')
          : null,
        canSubmitDocument: report =>
          report.status === 'DRAFT' &&
          report.teamLeaderName === currentUser?.name &&
          report.blocks.every(block => block.status === 'COMPLETED'),
        submitDisabledReason: report =>
          report.status === 'SUBMITTED'
            ? '이미 제출한 중간보고서예요.'
            : report.teamLeaderName !== currentUser?.name
              ? '팀장만 중간보고서를 제출할 수 있어요.'
              : report.blocks.every(block => block.status === 'COMPLETED')
                ? '모든 작성 영역이 완료되어 제출할 수 있어요.'
                : '모든 작성 영역을 완료 처리하면 제출할 수 있어요.',
      }}
      docId='mid-review'
      documentQuery={query}
      editLockTargetType='MID_REPORT_BLOCK'
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
            <MidReportStructuredFields
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
