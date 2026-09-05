import type {
  AdminMilestoneSubmissionDetailResponse,
  AdminMidtermSubmissionBlockDto,
  AdminProposalDataRowDto,
  AdminProposalScreenDto,
  AdminPresentationSubmissionDetailDto,
  AdminPeerEvaluationDetailDto,
  AdminPresentationEvaluationDetailDto,
  AdminMidtermFeedbackDto,
  AdminProposalFeedbackDto,
} from '@aics/api-client';

export type AdminProposalSubmissionDetailView = {
  collaboration: string;
  dataRows: AdminProposalDataRowDto[];
  introduction: string;
  members: string[];
  projectDescription: string;
  projectTitle: string;
  roles: string;
  schedule: string;
  screenDescription: string;
  screens: AdminProposalScreenDto[];
  teamLeaderName: string;
  teamName: string;
  wireframeFileNames: string[];
};

export type AdminMidtermSubmissionDetailView = {
  blocks: AdminMidtermSubmissionBlockDto[];
  teamLeaderName: string;
  teamName: string;
};

export type AdminPresentationSubmissionDetailView =
  AdminPresentationSubmissionDetailDto;
export type AdminPeerEvaluationDetailView = AdminPeerEvaluationDetailDto;
export type AdminPeerEvaluationRowView = {
  average: number | undefined;
  evaluator: AdminPeerEvaluationDetailDto['members'][number];
  isSubmitted: boolean;
  score: number | undefined;
  target: AdminPeerEvaluationDetailDto['members'][number];
};
export type AdminPeerEvaluatorRowView = {
  average: number | undefined;
  evaluator: AdminPeerEvaluationDetailDto['members'][number];
  rows: AdminPeerEvaluationRowView[];
};
export type AdminPresentationEvaluationDetailView =
  AdminPresentationEvaluationDetailDto;

export type AdminMilestoneSubmissionDetailView = {
  milestoneId: string;
  milestoneTitle: string;
  midterm: AdminMidtermSubmissionDetailView | null;
  midtermFeedback: AdminMidtermFeedbackDto | null;
  peerEvaluation: AdminPeerEvaluationDetailView | null;
  presentationEvaluation: AdminPresentationEvaluationDetailView | null;
  presentation: AdminPresentationSubmissionDetailView | null;
  proposal: AdminProposalSubmissionDetailView | null;
  proposalFeedback: AdminProposalFeedbackDto | null;
  sectionId: string;
  sectionLabel: string;
  resubmittedAt: string | null;
  submittedAt: string;
  submissionId: string;
  teamId: string;
  teamName: string;
};

export function toAdminMilestoneSubmissionDetailView(
  response: AdminMilestoneSubmissionDetailResponse,
): AdminMilestoneSubmissionDetailView {
  return {
    milestoneId: response.milestone.id,
    milestoneTitle: response.milestone.title,
    midterm: response.midterm,
    midtermFeedback: response.midtermFeedback ?? null,
    presentation: response.presentation,
    proposal: response.proposal,
    proposalFeedback: response.proposalFeedback ?? null,
    peerEvaluation: response.peerEvaluation ?? null,
    presentationEvaluation: response.presentationEvaluation ?? null,
    sectionId: response.section.id,
    sectionLabel: response.section.label,
    resubmittedAt: response.submission.revision.resubmittedAt,
    submittedAt: response.submittedAt,
    submissionId: response.submission.id,
    teamId: response.submission.teamId,
    teamName: response.submission.teamName,
  };
}

export function toAdminPeerEvaluationRows(
  peer: AdminPeerEvaluationDetailView,
): AdminPeerEvaluationRowView[] {
  const responseByEvaluator = new Map(
    peer.responses.map(response => [response.evaluatorStudentNumber, response]),
  );

  return peer.members.flatMap(target => {
    const receivedScores = peer.members
      .filter(member => member.studentNumber !== target.studentNumber)
      .map(
        member =>
          responseByEvaluator.get(member.studentNumber)?.scores[
            target.studentNumber
          ],
      )
      .filter((score): score is number => score !== undefined);
    const average = receivedScores.length
      ? receivedScores.reduce((sum, score) => sum + score, 0) /
        receivedScores.length
      : undefined;

    return peer.members
      .filter(member => member.studentNumber !== target.studentNumber)
      .map(evaluator => {
        const response = responseByEvaluator.get(evaluator.studentNumber);
        return {
          average,
          evaluator,
          isSubmitted: response !== undefined,
          score: response?.scores[target.studentNumber],
          target,
        };
      });
  });
}

export function toAdminPeerEvaluatorRows(
  peer: AdminPeerEvaluationDetailView,
): AdminPeerEvaluatorRowView[] {
  const peerRows = toAdminPeerEvaluationRows(peer);

  return peer.members.map(evaluator => {
    const rows = peerRows.filter(
      row => row.evaluator.studentNumber === evaluator.studentNumber,
    );
    const submittedScores = rows
      .map(row => row.score)
      .filter((score): score is number => score !== undefined);
    const average = submittedScores.length
      ? submittedScores.reduce((sum, score) => sum + score, 0) /
        submittedScores.length
      : undefined;

    return { average, evaluator, rows };
  });
}
