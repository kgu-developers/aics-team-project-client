import type { TeamKickoffResponse } from '../team/types';

export const PROPOSAL_SECTIONS = [
  'TOPIC',
  'DATA',
  'SCREEN',
  'TEAM_OPERATION',
] as const;
export type ProposalSectionType = (typeof PROPOSAL_SECTIONS)[number];
export type ProposalDataItem = {
  name?: string;
  description?: string;
  expectedCount?: string;
  [key: string]: unknown;
};
export type ProposalScreenItem = {
  title?: string;
  description?: string;
  imageFileId?: number | null;
  imageUrl?: string | null;
  [key: string]: unknown;
};
export type ProjectProposalResponse = {
  id: number;
  teamId: number;
  title: string;
  description: string;
  goal: string;
  dataConfiguration: ProposalDataItem[];
  screenConfiguration: ProposalScreenItem[];
  projectSchedule?: string | null;
  repositoryUrl?: string | null;
  externalLinks?: unknown;
  topicCandidateId?: number | null;
  proposalCompletedAt?: string | null;
  teamOperation: TeamKickoffResponse;
};
export type UpdateProjectProposalInput = Pick<
  ProjectProposalResponse,
  | 'title'
  | 'description'
  | 'goal'
  | 'dataConfiguration'
  | 'screenConfiguration'
  | 'projectSchedule'
  | 'repositoryUrl'
  | 'externalLinks'
> & {
  kickoffRule?: string | null;
  meetingSchedule?: string | null;
  memberRoles?: { studentNumber: string; projectRole: string | null }[];
};
export type ProposalSectionResponse = {
  section: ProposalSectionType;
  assigneeUserId: string | null;
  assigneeName: string | null;
  completed: boolean;
  completedAt: string | null;
};
export type ProposalSectionsResponse = {
  contents: ProposalSectionResponse[];
  allCompleted: boolean;
};
export type UpdateProposalSectionInput = Pick<
  ProposalSectionResponse,
  'assigneeUserId' | 'completed'
>;
