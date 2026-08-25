import type { ProposalBlock, ProposalField } from '@aics/core';
import { useToast } from '@aics/design-system';
import { useCallback } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import DocumentEditorPage, {
  getSaveErrorMessage,
} from '~/features/editor/DocumentEditorPage';

import ProposalStructuredFields from './ProposalStructuredFields';
import {
  useCompleteProposalBlockMutation,
  useCurrentProposalQuery,
  useSubmitProposalMutation,
  useUpdateProposalBlockMutation,
} from './queries';

type ProposalEditorPageProps = { section: string };

const COPY = {
  loginRequired: '로그인 후 제안서를 열 수 있어요.',
  loading: '제안서를 불러오는 중이에요.',
  loadFailed: '제안서를 불러오지 못했어요. 다시 시도해 주세요.',
  saveFailed: '저장하지 못했어요. 다시 시도해 주세요.',
} as const;

export default function ProposalEditorPage({
  section,
}: ProposalEditorPageProps) {
  const toast = useToast();
  const currentUser = useAuthStore(state => state.currentUser);
  const query = useCurrentProposalQuery(Boolean(currentUser));

  const mutation = useUpdateProposalBlockMutation();
  const completionMutation = useCompleteProposalBlockMutation();
  const submitMutation = useSubmitProposalMutation();

  const saveBlock = useCallback(
    (input: {
      documentId: string;
      version: number;
      block: ProposalBlock;
      fields: ProposalField[];
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
          const proposal = await completionMutation.mutateAsync({
            documentId: input.documentId,
            version: input.version,
            blockKey: input.block.key,
          });
          toast({ body: `${input.block.title} 영역을 완료 처리했어요.` });
          return proposal;
        },
        completing: completionMutation.isPending,
        completeError: completionMutation.isError
          ? getSaveErrorMessage(
              completionMutation.error,
              '완료 처리하지 못했어요.',
            )
          : null,
        isDocumentSubmitted: proposal => proposal.status === 'SUBMITTED',
        submitDocument: async (documentId, version) => {
          const proposal = await submitMutation.mutateAsync({
            documentId,
            version,
          });
          toast({
            body: '제안서를 제출했어요. 이제 읽기 전용으로 확인할 수 있어요.',
          });
          return proposal;
        },
        submitting: submitMutation.isPending,
        submitError: submitMutation.isError
          ? getSaveErrorMessage(submitMutation.error, '제출하지 못했어요.')
          : null,
        canSubmitDocument: proposal =>
          proposal.status === 'DRAFT' &&
          proposal.teamLeaderName === currentUser?.name &&
          proposal.blocks.every(block => block.status === 'COMPLETED'),
        submitDisabledReason: proposal => {
          if (proposal.status === 'SUBMITTED') return '이미 제출한 제안서예요.';
          if (proposal.teamLeaderName !== currentUser?.name)
            return '팀장만 제안서를 제출할 수 있어요.';
          return proposal.blocks.every(block => block.status === 'COMPLETED')
            ? '모든 작성 영역이 완료되어 제출할 수 있어요.'
            : '모든 작성 영역을 완료 처리하면 제출할 수 있어요.';
        },
      }}
      docId='proposal'
      documentQuery={query}
      editLockTargetType='PROJECT_BLOCK'
      metadataTag='DOC / PROPOSAL / FORM V1'
      renderFields={({
        documentId,
        block,
        fields,
        isLocked,
        onFieldsChange,
      }) => {
        if (
          block.key !== 'data-composition' &&
          block.key !== 'screen-composition'
        )
          return null;
        return (
          <ProposalStructuredFields
            blockKey={block.key}
            fields={fields}
            isLocked={isLocked}
            key={`${documentId}:${block.key}`}
            onFieldsChange={onFieldsChange}
          />
        );
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
