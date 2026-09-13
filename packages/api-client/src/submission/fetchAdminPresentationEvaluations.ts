import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type LegacyAdminPresentationEvaluationCriterionDto = {
  id: string;
  label: string;
};
export type LegacyAdminPresentationEvaluationTeamDto = {
  submissionId: string | null;
  teamId: number;
  teamName: string;
  projectTopic: string | null;
  presentationOrder: number | null;
  submittedEvaluatorCount: number;
  evaluatorCount: number;
  criteria: Record<string, number | null>;
};
export type LegacyAdminPresentationEvaluationsResponse = {
  section: { id: string; label: string };
  evaluationPeriod: { startsAt: string | null; endsAt: string | null };
  criteria: LegacyAdminPresentationEvaluationCriterionDto[];
  teams: LegacyAdminPresentationEvaluationTeamDto[];
};

// 기존 발표 순서 설정 화면의 공개 계약을 유지한다.
export type AdminPresentationEvaluationsResponse =
  LegacyAdminPresentationEvaluationsResponse;

export async function fetchLegacyAdminPresentationEvaluations(
  sectionId: string,
) {
  const response =
    await apiClient.get<LegacyAdminPresentationEvaluationsResponse>(
      ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS(sectionId),
    );
  return response.data;
}
