export const adminProposalFeedbackKeys = {
  all: ['admin-proposal-feedback'] as const,
  feedbacks: (sectionId: string, teamId: string, page: number) =>
    [...adminProposalFeedbackKeys.all, sectionId, teamId, page] as const,
};
