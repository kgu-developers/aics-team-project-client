export type Review = {
  id: string;
  submissionId: string;
  reviewerId: string;
  comment: string;
  score?: number;
};
