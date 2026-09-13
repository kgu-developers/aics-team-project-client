import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminPresentationEvaluationCriterionDto = {
  id: string;
  label: string;
};
export type AdminPresentationEvaluationTeamDto = {
  submissionId: string | null;
  teamId: number;
  teamName: string;
  projectTopic: string | null;
  presentationOrder: number | null;
  submittedEvaluatorCount: number;
  evaluatorCount?: number;
  criteria: Record<string, number | null>;
};
export type AdminPresentationEvaluationsResponse = {
  section: { id: string; label: string };
  evaluationPeriod: { startsAt: string | null; endsAt: string | null };
  criteria: AdminPresentationEvaluationCriterionDto[];
  teams: AdminPresentationEvaluationTeamDto[];
};

type AdminPresentationEvaluationsApiResponse = {
  sectionId: number;
  milestoneId: number;
  milestoneTitle: string;
  closesAt: string | null;
  criteria: Array<{
    criterionId: number;
    title: string;
    maxScore: number;
    displayOrder: number;
  }>;
  teams: Array<{
    teamId: number;
    teamName: string;
    projectTitle?: string | null;
    evaluationCount: number;
    scores: Array<{
      criterionId: number;
      criterionTitle: string;
      score: number | null;
    }>;
    totalScore?: number | null;
  }>;
};

export async function fetchAdminPresentationEvaluations(sectionId: string) {
  const response = await apiClient.get<
    | AdminPresentationEvaluationsApiResponse
    | AdminPresentationEvaluationsResponse
  >(ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS(sectionId));
  const data = response.data;

  // MSW and older deployments may still return the already-normalized client
  // shape. Keep that contract readable while normalizing the current server
  // response below.
  if ('section' in data && 'evaluationPeriod' in data) {
    return data;
  }

  return {
    section: { id: String(data.sectionId), label: '' },
    evaluationPeriod: { startsAt: null, endsAt: data.closesAt },
    criteria: data.criteria
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map(criterion => ({
        id: String(criterion.criterionId),
        label: criterion.title,
      })),
    teams: data.teams.map(team => ({
      submissionId: null,
      teamId: team.teamId,
      teamName: team.teamName,
      projectTopic: team.projectTitle ?? null,
      presentationOrder: null,
      submittedEvaluatorCount: team.evaluationCount,
      criteria: Object.fromEntries(
        team.scores.map(score => [String(score.criterionId), score.score]),
      ),
    })),
  } satisfies AdminPresentationEvaluationsResponse;
}
