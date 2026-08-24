import type { PresentationBlock, PresentationField } from '@aics/core';
import { useToast } from '@aics/design-system';
import { useCallback } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import DocumentEditorPage, {
  getSaveErrorMessage,
} from '~/features/editor/DocumentEditorPage';
import SubmissionFilePanel from '~/features/submission/SubmissionFilePanel';

import PresentationStructuredFields from './PresentationStructuredFields';
import {
  useCompletePresentationBlockMutation,
  useCurrentPresentationQuery,
  useSubmitPresentationMutation,
  useUpdatePresentationBlockMutation,
} from './queries';

type PresentationEditorPageProps = { section: string };
const COPY = {
  loginRequired: '로그인 후 발표 문서를 열 수 있어요.',
  loading: '발표 문서를 불러오는 중이에요.',
  loadFailed: '발표 문서를 불러오지 못했어요. 다시 시도해 주세요.',
  saveFailed: '저장하지 못했어요. 다시 시도해 주세요.',
} as const;

export default function PresentationEditorPage({
  section,
}: PresentationEditorPageProps) {
  const toast = useToast();
  const currentUser = useAuthStore(state => state.currentUser);
  const query = useCurrentPresentationQuery(Boolean(currentUser));

  const mutation = useUpdatePresentationBlockMutation();
  const completionMutation = useCompletePresentationBlockMutation();
  const submitMutation = useSubmitPresentationMutation();
  const saveBlock = useCallback(
    (input: {
      documentId: string;
      version: number;
      block: PresentationBlock;
      fields: PresentationField[];
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
          const presentation = await completionMutation.mutateAsync({
            documentId: input.documentId,
            version: input.version,
            blockKey: input.block.key,
          });
          toast({ body: `${input.block.title} 영역을 완료 처리했어요.` });
          return presentation;
        },
        completing: completionMutation.isPending,
        completeError: completionMutation.isError
          ? getSaveErrorMessage(
              completionMutation.error,
              '완료 처리하지 못했어요.',
            )
          : null,
        isDocumentSubmitted: presentation =>
          presentation.status === 'SUBMITTED',
        submitDocument: async (documentId, version) => {
          const presentation = await submitMutation.mutateAsync({
            documentId,
            version,
          });
          toast({
            body: '발표 문서를 제출했어요. 이제 읽기 전용으로 확인할 수 있어요.',
          });
          return presentation;
        },
        submitting: submitMutation.isPending,
        submitError: submitMutation.isError
          ? getSaveErrorMessage(submitMutation.error, '제출하지 못했어요.')
          : null,
        canSubmitDocument: presentation =>
          presentation.status === 'DRAFT' &&
          presentation.teamLeaderName === currentUser?.name &&
          presentation.blocks.every(block => block.status === 'COMPLETED'),
        submitDisabledReason: presentation =>
          presentation.status === 'SUBMITTED'
            ? '이미 제출한 발표 문서예요.'
            : presentation.teamLeaderName !== currentUser?.name
              ? '팀장만 발표 문서를 제출할 수 있어요.'
              : presentation.blocks.every(block => block.status === 'COMPLETED')
                ? '모든 작성 영역이 완료되어 제출할 수 있어요.'
                : '모든 작성 영역을 완료 처리하면 제출할 수 있어요.',
      }}
      docId='presentation'
      documentQuery={query}
      editLockTargetType='PRESENTATION_CONTENT_BLOCK'
      metadataTag='DOC / PRESENTATION / FORM V1'
      renderFields={({
        documentId,
        block,
        fields,
        isLocked,
        onFieldsChange,
      }) => {
        if (block.key === 'main-features')
          return (
            <PresentationStructuredFields
              fields={fields}
              isLocked={isLocked}
              key={`${documentId}:${block.key}`}
              kind='features'
              onFieldsChange={onFieldsChange}
            />
          );
        if (block.key === 'main-screens')
          return (
            <PresentationStructuredFields
              fields={fields}
              isLocked={isLocked}
              key={`${documentId}:${block.key}`}
              kind='screens'
              onFieldsChange={onFieldsChange}
            />
          );
        return null;
      }}
      renderBlockAside={(block, isLocked) =>
        block.key === 'presentation-material' ? (
          <SubmissionFilePanel
            isReadOnly={isLocked}
            milestoneId='presentation'
            title='프레젠테이션 자료'
          />
        ) : null
      }
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
