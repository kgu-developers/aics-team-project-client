import {
  createAdminPeerEvaluationForm,
  type AdminPeerEvaluationFormCreateInput,
} from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

type CreateAdminPeerEvaluationFormVariables = {
  input: AdminPeerEvaluationFormCreateInput;
  sectionId: string | number;
};

export function useCreateAdminPeerEvaluationFormMutation() {
  return useMutation({
    mutationFn: ({
      input,
      sectionId,
    }: CreateAdminPeerEvaluationFormVariables) =>
      createAdminPeerEvaluationForm(sectionId, input),
  });
}
