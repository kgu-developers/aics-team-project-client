export type AdminSectionArtifactMemberDto = {
  name: string;
  studentNumber: string;
};

export type AdminSectionArtifactSummaryDto = {
  meetingRecordCount: number;
  meetingRecordEditCount: number;
  members: AdminSectionArtifactMemberDto[];
  overdueMissingStageCount: number;
  submittedStageCount: number;
  teamId: number;
  teamName: string;
};

export type AdminSectionArtifactSummaryResponse = {
  asOf: string;
  contents: AdminSectionArtifactSummaryDto[];
  sectionId: number;
  sectionName: string;
};

export type AdminSectionArtifactsExcelDownload = {
  file: Blob;
  fileName: string;
};

export type AdminSectionArtifactsInput = {
  asOf: string;
  sectionId: string;
};
