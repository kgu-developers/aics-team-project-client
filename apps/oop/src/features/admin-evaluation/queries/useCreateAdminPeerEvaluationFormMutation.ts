import {
  createAdminPeerEvaluationForm,
  type AdminPeerEvaluationFormCreateInput,
} from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

type CreateAdminPeerEvaluationFormVariables = {
  input: AdminPeerEvaluationFormCreateInput;
  sectionId: number;
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
