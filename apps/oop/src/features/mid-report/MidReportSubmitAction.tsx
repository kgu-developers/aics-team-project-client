import { Button, useToast } from '@aics/design-system';

import { useAuthStore } from '~/features/auth/authStore';
import { documentRequestErrorMessage } from '~/features/editor/documentRequestErrorMessage';

import {
  canSubmitMidReportDocument,
  getMidReportSubmitDisabledReason,
} from './MidReportEditorPage';
import {
  useCurrentMidReportQuery,
  useSubmitMidReportMutation,
} from './queries';

type Props = {
  className?: string;
  isDisabled?: boolean;
  label: string;
};
/** Rendered only for the leader's submit row so the card stays document free. */
export default function MidReportSubmitAction({
  className,
  isDisabled,
  label,
}: Props) {
  const toast = useToast();
  const userName = useAuthStore(state => state.currentUser?.name);
  const report = useCurrentMidReportQuery(true);
  const submit = useSubmitMidReportMutation();
  return (
    <Button
      className={className}
      isDisabled={isDisabled || submit.isPending}
      isLoading={submit.isPending}
      label={label}
      onClick={() => {
        const document = report.data;
        if (!document) {
          toast({
            body: '중간보고서 상태를 아직 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
            type: 'error',
          });
          return;
        }
        if (!canSubmitMidReportDocument(document, userName)) {
          toast({
            body: getMidReportSubmitDisabledReason(document, userName),
            type: 'error',
          });
          return;
        }
        submit.mutate(
          { documentId: document.id, version: document.version },
          {
            onError: error =>
              toast({
                body: documentRequestErrorMessage(error),
                type: 'error',
              }),
            onSuccess: () => toast({ body: '중간보고서를 제출했어요.' }),
          },
        );
      }}
      size='md'
      variant='primary'
    />
  );
}
