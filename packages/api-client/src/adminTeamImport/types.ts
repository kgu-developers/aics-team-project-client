export type AdminTeamImportRowStatus =
  'VALID' | 'UPDATE' | 'DUPLICATE' | 'INVALID';

export type AdminTeamImportPreviewRowDto = {
  rowNumber: number;
  teamName: string;
  studentNumber: string;
  name: string | null;
  leader: boolean;
  projectRole: string | null;
  phoneNumber: string | null;
  grade: string | null;
  status: AdminTeamImportRowStatus;
  message: string | null;
};

export type AdminTeamImportPreviewResponse = {
  importId: number;
  summary: {
    total: number;
    teams: number;
    valid: number;
    update: number;
    duplicate: number;
    invalid: number;
  };
  rows: AdminTeamImportPreviewRowDto[];
};

export type ApplyAdminTeamImportResponse = {
  importId: number;
  createdTeams: number;
  appliedMembers: number;
  skipped: number;
};
