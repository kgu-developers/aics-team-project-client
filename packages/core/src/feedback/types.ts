export type SubmitProposalFeedbackResponseInput = {
  content: string;
};

export type ProposalFeedbackResponse = {
  reviewId: string;
  content: string;
  submittedBy: string;
  submittedAt: string;
};

export type SubmitMidReportFeedbackInput = {
  content: string;
};

export type MidReportFeedback = {
  submissionId: string;
  content: string;
  submittedBy: string;
  submittedAt: string;
};
