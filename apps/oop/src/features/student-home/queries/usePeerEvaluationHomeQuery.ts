import { useEvaluationContextQuery } from '~/features/evaluation/queries/useEvaluationContextQuery';
import { usePeerEvaluationTargetsQuery } from '~/features/evaluation/queries/usePeerEvaluationTargetsQuery';

/** The section context selects the current form; its response belongs to the student. */
export function usePeerEvaluationHomeQuery(
  sectionId?: string,
  studentNumber?: string,
) {
  const context = useEvaluationContextQuery(
    sectionId ?? '',
    studentNumber ?? '',
  );
  const formId = context.data?.peerEvaluationFormId;
  const targets = usePeerEvaluationTargetsQuery(
    sectionId ?? '',
    studentNumber ?? '',
    formId ?? '',
  );
  return {
    data: targets.data,
    formId,
    isPending: context.isPending || Boolean(formId && targets.isPending),
    error: context.error ?? targets.error,
    refetch: async () => {
      await context.refetch();
      if (formId) await targets.refetch();
    },
  };
}
