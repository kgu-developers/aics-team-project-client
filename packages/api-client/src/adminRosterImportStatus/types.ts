export type AdminRosterImportAppliedDto = {
  appliedAt: string;
  fileName: string | null;
};

export type AdminRosterImportStatusResponse = {
  studentRoster: AdminRosterImportAppliedDto | null;
  teamRoster: AdminRosterImportAppliedDto | null;
};
