export type AdminMilestoneStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export type AdminMilestoneType =
  'PROPOSAL' | 'MID_REPORT' | 'FINAL_REPORT' | 'PRESENTATION' | 'GENERAL';

export type AdminMilestoneScheduleDto = {
  dueAt?: string | null;
  evaluationClosesAt?: string | null;
  evaluationOpensAt?: string | null;
  lateSubmissionUntil?: string | null;
  opensAt?: string | null;
  revisionUntil?: string | null;
};

export type AdminSectionMilestoneDto = {
  description?: string | null;
  id: number;
  schedule: AdminMilestoneScheduleDto;
  sectionId: number;
  status: AdminMilestoneStatus;
  title: string;
  type: AdminMilestoneType;
  weekNumber: number;
};

export type AdminSectionMilestonesResponse = {
  content: AdminSectionMilestoneDto[];
};
