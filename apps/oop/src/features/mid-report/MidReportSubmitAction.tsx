import { Button, useToast } from '@aics/design-system';
import { useRef, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import { documentRequestErrorMessage } from '~/features/editor/documentRequestErrorMessage';

import {
  canSubmitMidReportDocument,
  getMidReportSubmitDisabledReason,
} from './MidReportEditorPage';
import {
  useCurrentMidReportQuery,
  useMidReportSubmitGuard,
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
  const ensureAllBlocksFree = useMidReportSubmitGuard();
  const pending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <Button
      className={className}
      isDisabled={isDisabled || report.isFetching || isSubmitting}
      isLoading={isSubmitting}
      label={label}
      onClick={async () => {
        if (pending.current) return;
        pending.current = true;
        setIsSubmitting(true);
        try {
          // Refetch before submitting: another actor may have reopened the
          // document, or the last block completion may have changed its version.
          const latest = await report.refetch();
          if (latest.isError) throw latest.error;
          const document = latest.data;
          if (!document) throw new Error('중간보고서 상태를 확인할 수 없어요.');
          if (!canSubmitMidReportDocument(document, userName))
            throw new Error(
              getMidReportSubmitDisabledReason(document, userName),
            );
          await ensureAllBlocksFree(document);
          await submit.mutateAsync({
            documentId: document.id,
            version: document.version,
          });
          toast({ body: '중간보고서를 제출했어요.' });
        } catch (error) {
          toast({ body: documentRequestErrorMessage(error), type: 'error' });
        } finally {
          pending.current = false;
          setIsSubmitting(false);
        }
      }}
      size='md'
      variant='primary'
    />
  );
}
