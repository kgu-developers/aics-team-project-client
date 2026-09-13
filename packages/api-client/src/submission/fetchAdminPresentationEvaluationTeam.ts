import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminPresentationEvaluationTeamDetailCriterionDto = {
  criterionId: number;
  displayOrder: number;
  maxScore: number;
  title: string;
};

export type AdminPresentationEvaluationTeamDetailScoreDto = {
  criterionId: number;
  criterionTitle: string;
  score: number | null;
};

export type AdminPresentationEvaluationTeamDetailEvaluationDto = {
  evaluatorId: string;
  evaluatorName: string;
  isSubmitted: boolean;
  submittedAt: string | null;
  teamName: string;
  scores: AdminPresentationEvaluationTeamDetailScoreDto[];
  totalScore: number | null;
};

export type AdminPresentationEvaluationTeamMeetingRecordDto = {
  id: number;
  meetingAt: string;
  participantCount: number;
  phase: string;
  title: string;
};

export type AdminPresentationEvaluationTeamDetailResponse = {
  closesAt: string | null;
  criteria: AdminPresentationEvaluationTeamDetailCriterionDto[];
  evaluations: AdminPresentationEvaluationTeamDetailEvaluationDto[];
  meetingRecords: AdminPresentationEvaluationTeamMeetingRecordDto[];
  milestoneId: number;
  projectTitle: string | null;
  teamId: number;
  teamName: string;
};

export async function fetchAdminPresentationEvaluationTeam(
  sectionId: string | number,
  teamId: string | number,
  milestoneId?: string | number,
): Promise<AdminPresentationEvaluationTeamDetailResponse> {
  const response =
    await apiClient.get<AdminPresentationEvaluationTeamDetailResponse>(
      ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATION_TEAM(sectionId, teamId),
      { params: milestoneId === undefined ? undefined : { milestoneId } },
    );

  return response.data;
}
