export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/me',
  },
  ADMIN: {
    SECTION_STUDENTS: (sectionId: string) =>
      `/admin/sections/${sectionId}/students`,
  },
  SECTION: {
    STUDENT_DASHBOARD: (sectionId: string) =>
      `/sections/${sectionId}/dashboard/student`,
  },
  TEAM: {
    ROOT: '/teams',
  },
  EDIT_LOCKS: {
    ROOT: '/edit-locks',
  },
  TOPIC: {
    BOARD: (sectionId: string) => `/sections/${sectionId}/project-topic`,
    VOTE: (sectionId: string) => `/sections/${sectionId}/project-topic/vote`,
  },
  SUBMISSION: {
    MY_TEAM_BY_MILESTONE: (milestoneId: string) =>
      `/milestones/${milestoneId}/my-team-submission`,
    DETAIL: (submissionId: string) => `/submissions/${submissionId}`,
    VERSIONS: (submissionId: string) => `/submissions/${submissionId}/versions`,
  },
  MID_REPORT: {
    CURRENT: '/mid-reports/current',
    BLOCK: (midReportId: string, blockKey: string) =>
      `/mid-reports/${midReportId}/blocks/${blockKey}`,
    BLOCK_COMPLETION: (midReportId: string, blockKey: string) =>
      `/mid-reports/${midReportId}/blocks/${blockKey}/completion`,
    SUBMIT: (midReportId: string) => `/mid-reports/${midReportId}/submit`,
  },
  PRESENTATION: {
    CURRENT: '/presentations/current',
    BLOCK: (presentationId: string, blockKey: string) =>
      `/presentations/${presentationId}/blocks/${blockKey}`,
    BLOCK_COMPLETION: (presentationId: string, blockKey: string) =>
      `/presentations/${presentationId}/blocks/${blockKey}/completion`,
    SUBMIT: (presentationId: string) =>
      `/presentations/${presentationId}/submit`,
  },
  PROPOSAL: {
    CURRENT: '/proposals/current',
    BLOCK: (proposalId: string, blockKey: string) =>
      `/proposals/${proposalId}/blocks/${blockKey}`,
    BLOCK_COMPLETION: (proposalId: string, blockKey: string) =>
      `/proposals/${proposalId}/blocks/${blockKey}/completion`,
    SUBMIT: (proposalId: string) => `/proposals/${proposalId}/submit`,
  },
  TEAM_ASSIGNMENT: {
    ROOT: (sectionId: string) => `/sections/${sectionId}/team-assignment`,
    SURVEY: (sectionId: string) =>
      `/sections/${sectionId}/team-assignment/survey`,
    LEADER: (sectionId: string, teamId: string) =>
      `/sections/${sectionId}/team-assignment/teams/${teamId}/leader`,
    PARTNER_CANDIDATES: (sectionId: string) =>
      `/sections/${sectionId}/team-assignment/partner-candidates`,
    PARTNER_REQUESTS: (sectionId: string) =>
      `/sections/${sectionId}/team-assignment/partner-requests`,
    PARTNER_REQUEST_RESPONSE: (sectionId: string, requestId: string) =>
      `/sections/${sectionId}/team-assignment/partner-requests/${requestId}`,
    PARTNER_REQUEST: (sectionId: string, requestId: string) =>
      `/sections/${sectionId}/team-assignment/partner-requests/${requestId}`,
  },
} as const;
