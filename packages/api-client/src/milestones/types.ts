export type AdminMilestoneStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export type AdminMilestoneType =
  | 'PROPOSAL'
  | 'MID_REPORT'
  | 'FINAL_REPORT'
  | 'PRESENTATION'
  | 'PEER_EVALUATION'
  | 'GENERAL';

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

export type AdminMilestoneScheduleRequest = {
  dueAt: string;
  evaluationClosesAt?: string;
  evaluationOpensAt?: string;
  lateSubmissionUntil?: string;
  opensAt?: string;
  revisionUntil?: string;
};

export type AdminMilestoneCreateInput = {
  description?: string;
  schedule: AdminMilestoneScheduleRequest;
  title: string;
  type: AdminMilestoneType;
  weekNumber: number;
};

/** 기존 마일스톤의 내용·제출 일정 변경 요청이다. 주차는 전용 일괄 변경 API로 관리한다. */
export type AdminMilestoneUpdateInput = {
  description?: string;
  schedule: AdminMilestoneScheduleRequest;
  title: string;
  type: AdminMilestoneType;
};

export type AdminMilestonePersistResponse = {
  id: number;
};
