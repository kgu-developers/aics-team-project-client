import type {
  MidReportFeedback,
  ProposalFeedbackResponse,
  SubmitMidReportFeedbackInput,
  SubmitProposalFeedbackResponseInput,
} from '@aics/core';

export const demoProposalReviewId = 'review-proposal-team-07';
export const demoMidReportSubmissionId = 'submission-mid-report-team-07';
export const demoFeedbackTeamId = 'team-07';

const proposalResponses = new Map<string, ProposalFeedbackResponse>();
const midReportFeedback = new Map<string, MidReportFeedback>();

export function getProposalFeedbackResponse(teamId: string) {
  const response = proposalResponses.get(teamId);
  return response ? structuredClone(response) : undefined;
}

export function getMidReportFeedback(teamId: string) {
  const feedback = midReportFeedback.get(teamId);
  return feedback ? structuredClone(feedback) : undefined;
}

export function createProposalFeedbackResponse(
  teamId: string,
  submittedBy: string,
  input: SubmitProposalFeedbackResponseInput,
) {
  if (proposalResponses.has(teamId)) return undefined;

  const response: ProposalFeedbackResponse = {
    reviewId: demoProposalReviewId,
    content: input.content.trim(),
    submittedBy,
    submittedAt: new Date().toISOString(),
  };
  proposalResponses.set(teamId, response);
  return structuredClone(response);
}

export function createMidReportFeedback(
  teamId: string,
  submittedBy: string,
  input: SubmitMidReportFeedbackInput,
) {
  if (midReportFeedback.has(teamId)) return undefined;

  const feedback: MidReportFeedback = {
    submissionId: demoMidReportSubmissionId,
    content: input.content.trim(),
    submittedBy,
    submittedAt: new Date().toISOString(),
  };
  midReportFeedback.set(teamId, feedback);
  return structuredClone(feedback);
}

export function resetStudentFeedbackMockData() {
  proposalResponses.clear();
  midReportFeedback.clear();
}
