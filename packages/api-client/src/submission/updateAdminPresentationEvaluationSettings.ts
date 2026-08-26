import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

/** Temporary client contract until the backend settings API is finalized. */
export type UpdateAdminPresentationEvaluationSettingsInput = {
  sectionId: string;
  teams: Array<{ teamId: string; presentationOrder: number }>;
  startsAt: string;
  endsAt: string;
};

export async function updateAdminPresentationEvaluationSettings(
  input: UpdateAdminPresentationEvaluationSettingsInput,
) {
  const response = await apiClient.patch(
    ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATION_SETTINGS(input.sectionId),
    { teams: input.teams, startsAt: input.startsAt, endsAt: input.endsAt },
  );
  return response.data;
}
