import type { AdminSectionArtifactSummaryDto } from '@aics/api-client';

export const adminSectionArtifactSummariesBySection: Record<
  string,
  AdminSectionArtifactSummaryDto[]
> = {
  '1': [
    {
      meetingRecordCount: 6,
      meetingRecordEditCount: 4,
      members: [
        { name: '김가가', studentNumber: '20260001' },
        { name: '김나다', studentNumber: '20260002' },
      ],
      overdueMissingStageCount: 1,
      submittedStageCount: 3,
      teamId: 101,
      teamName: '1팀',
    },
    {
      meetingRecordCount: 4,
      meetingRecordEditCount: 1,
      members: [
        { name: '김다라', studentNumber: '20260003' },
        { name: '김마마', studentNumber: '20260004' },
      ],
      overdueMissingStageCount: 0,
      submittedStageCount: 4,
      teamId: 102,
      teamName: '2팀',
    },
  ],
};
