export const ENDPOINTS = {
  PROJECT_PROPOSAL: {
    BY_TEAM: (teamId: string) => `/api/v1/teams/${teamId}/project`,
    IMAGE_UPLOAD: (teamId: string) =>
      `/api/v1/teams/${teamId}/project/images/upload`,
    SECTIONS: (projectId: number) =>
      `/api/v1/projects/${projectId}/proposal/sections`,
    SECTION: (projectId: number, section: string) =>
      `/api/v1/projects/${projectId}/proposal/sections/${section}`,
    COMPLETE: (projectId: number) =>
      `/api/v1/projects/${projectId}/proposal-complete`,
  },
  STUDENT_MILESTONE: {
    LIST: (sectionId: string) => `/api/v1/sections/${sectionId}/milestones`,
    MY_TEAM_SUBMISSION: (milestoneId: string) =>
      `/api/v1/milestones/${milestoneId}/my-team-submission`,
  },
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
  },
  USER: {
    ME: '/api/v1/users/me',
  },
  PROFILE: {
    ME: '/api/v1/me/profile',
    PASSWORD: (studentNumber: string) =>
      `/api/v1/users/${studentNumber}/password`,
  },
  ADMIN: {
    OOP_COURSES: '/api/v1/admin/courses',
    OOP_COURSE: (courseId: string | number) =>
      `/api/v1/admin/courses/${courseId}`,
    OOP_SECTIONS: '/api/v1/admin/sections',
    OOP_SECTION: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}`,
    OOP_SECTION_CONTACT_VISIBILITY: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/contact-visibility`,
    SECTION_ENROLLMENTS: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/enrollments`,
    SECTION_ENROLLMENT: (sectionId: string | number, studentNumber: string) =>
      `/api/v1/admin/sections/${sectionId}/enrollments/${studentNumber}`,
    SECTION_TEAMS: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/teams`,
    SECTION_TEAM_IMPORT_PREVIEW: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/team-imports/preview`,
    SECTION_TEAMS_FINALIZE: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/teams/finalize`,
    TEAM: (teamId: string | number) => `/api/v1/admin/teams/${teamId}`,
    TEAM_MEMBER: (teamId: string | number, studentNumber: string) =>
      `/api/v1/admin/teams/${teamId}/members/${studentNumber}`,
    TEAM_IMPORT_APPLY: (importId: string | number) =>
      `/api/v1/admin/team-imports/${importId}/apply`,
    USERS: '/api/v1/admin/users',
    USER: (studentNumber: string) => `/api/v1/admin/users/${studentNumber}`,
    SECTION_ENROLLMENT_IMPORT_PREVIEW: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/enrollment-imports/preview`,
    ENROLLMENT_IMPORT_APPLY: (importId: string | number) =>
      `/api/v1/admin/enrollment-imports/${importId}/apply`,
    SECTION_ROSTER_IMPORT_STATUS: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/roster-import-status`,
    OOP_PEER_EVALUATION_FORM: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/peer-evaluation-forms`,
    OOP_TEAM_EVALUATION_CRITERIA: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/team-evaluation-criteria`,
    OOP_PEER_EVALUATIONS: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/peer-evaluations`,
    OOP_PEER_EVALUATION_TEAM: (
      sectionId: string | number,
      teamId: string | number,
    ) => `/api/v1/admin/sections/${sectionId}/peer-evaluations/teams/${teamId}`,
    OOP_PRESENTATION_EVALUATIONS: (sectionId: string | number) =>
      `/api/v1/admin/sections/${sectionId}/presentation-evaluations`,
    OOP_PRESENTATION_EVALUATION_TEAM: (
      sectionId: string | number,
      teamId: string | number,
    ) =>
      `/api/v1/admin/sections/${sectionId}/presentation-evaluations/teams/${teamId}`,
    OOP_PRE_SURVEY_RESPONSES: (sectionId: string) =>
      `/api/v1/admin/sections/${sectionId}/pre-survey-responses`,
    OOP_PRE_SURVEY_RESPONSES_DOWNLOAD: (sectionId: string) =>
      `/api/v1/admin/sections/${sectionId}/pre-survey-responses/download`,
    MEETING_RECORDS: '/api/v1/admin/meeting-records',
    MEETING_RECORDS_LIST: '/api/v1/admin/meeting-records',
    MEETING_RECORD_DETAIL: (meetingId: string | number) =>
      `/api/v1/admin/meeting-records/${meetingId}`,
    MEETING_RECORD: (meetingId: string) =>
      `/api/v1/admin/meeting-records/${meetingId}`,
    MILESTONE_SCHEDULE: '/api/v1/admin/milestone-schedule',
    SECTION_MILESTONES: (sectionId: string) =>
      `/api/v1/admin/sections/${sectionId}/milestones`,
    SECTION_MILESTONE: (sectionId: string, milestoneId: string) =>
      `/api/v1/admin/sections/${sectionId}/milestones/${milestoneId}`,
    SECTION_MILESTONE_STATUS: (sectionId: string, milestoneId: string) =>
      `/api/v1/admin/sections/${sectionId}/milestones/${milestoneId}/status`,
    REQUIRED_ARTIFACTS: (sectionId: string, milestoneId: string) =>
      `/api/v1/admin/sections/${sectionId}/milestones/${milestoneId}/required-artifacts`,
    REQUIRED_ARTIFACT: (
      sectionId: string,
      milestoneId: string,
      requiredArtifactId: string,
    ) =>
      `/api/v1/admin/sections/${sectionId}/milestones/${milestoneId}/required-artifacts/${requiredArtifactId}`,
    SECTION_MILESTONE_WEEK_NUMBERS: (sectionId: string) =>
      `/api/v1/admin/sections/${sectionId}/milestones/week-numbers`,
    MILESTONE_SUBMISSIONS: (milestoneId: string) =>
      `/api/v1/admin/milestones/${milestoneId}/submissions`,
    SUBMISSION: (submissionId: string | number) =>
      `/api/v1/admin/submissions/${submissionId}`,
    SUBMISSION_DOWNLOAD: (submissionId: string | number) =>
      `/api/v1/admin/submissions/${submissionId}/download`,
    SUBMISSION_VERSION: (
      submissionId: string | number,
      version: string | number,
    ) => `/api/v1/admin/submissions/${submissionId}/versions/${version}`,
    SUBMISSION_VERSIONS: (submissionId: string | number) =>
      `/api/v1/admin/submissions/${submissionId}/versions`,
    SECTION_PRESENTATION_EVALUATIONS: (sectionId: string) =>
      `/api/v1/admin/sections/${sectionId}/presentation-evaluations`,
    SECTION_PRESENTATION_EVALUATION_TEAM: (
      sectionId: string | number,
      teamId: string | number,
    ) =>
      `/api/v1/admin/sections/${sectionId}/presentation-evaluations/teams/${teamId}`,
    SECTION_TEAM_MID_REPORT: (
      sectionId: string | number,
      teamId: string | number,
    ) => `/api/v1/admin/sections/${sectionId}/teams/${teamId}/mid-report`,
    SECTION_PRESENTATION_EVALUATION_SETTINGS: (sectionId: string) =>
      `/api/v1/admin/sections/${sectionId}/presentation-evaluation-settings`,
    SECTION_STUDENTS: (sectionId: string) =>
      `/api/v1/admin/sections/${sectionId}/students`,
    NOTICE_ATTACHMENT: (noticeId: string) =>
      `/api/v1/admin/notices/${noticeId}/attachment`,
    NOTICES: '/api/v1/admin/notices',
    NOTICE_DETAIL: (noticeId: string) => `/api/v1/admin/notices/${noticeId}`,
  },
  ANNOUNCEMENTS: {
    SECTION_LIST: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/announcements`,
    DETAIL: (announcementId: string | number) =>
      `/api/v1/announcements/${announcementId}`,
  },
  SECTION: {
    MY_SECTIONS: '/api/v1/sections',
    STUDENT_DASHBOARD: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/dashboard/student`,
  },
  PROJECT: {
    BY_TEAM: (teamId: string) => `/api/v1/teams/${teamId}/project`,
    DETAIL: (projectId: string | number) => `/api/v1/projects/${projectId}`,
    APPROVAL: (projectId: string | number) =>
      `/api/v1/projects/${projectId}/approval`,
    APPROVALS: (projectId: string | number) =>
      `/api/v1/projects/${projectId}/approvals`,
  },
  TEAM: {
    KICKOFF: (teamId: string) => `/api/v1/teams/${teamId}/kickoff`,
    MEMBER_CONTACTS: (teamId: string) =>
      `/api/v1/teams/${teamId}/members/contacts`,
    LEADER_CLAIM: (teamId: string) => `/api/v1/teams/${teamId}/leader-claim`,
    ROOT: '/api/v1/teams',
  },
  TEAM_MESSAGE: {
    BY_TEAM: (teamId: string) => `/api/v1/teams/${teamId}/messages`,
    UNREAD_COUNT: (teamId: string) =>
      `/api/v1/teams/${teamId}/unread-message-count`,
    IMPORTANT: (messageId: string | number) =>
      `/api/v1/messages/${messageId}/important`,
    READ: (messageId: string | number) => `/api/v1/messages/${messageId}/read`,
  },
  TEAM_THREAD: {
    BY_TEAM: (teamId: string) => `/api/v1/teams/${teamId}/thread`,
  },
  ADMIN_MESSAGE: {
    LIST: '/api/v1/admin/messages',
    READ: (messageId: string | number) =>
      `/api/v1/admin/messages/${messageId}/read`,
  },
  MEETING: {
    RECORDS: (teamId: string) => `/api/v1/teams/${teamId}/meeting-records`,
    ACTIONS: (teamId: string) => `/api/v1/teams/${teamId}/actions`,
    RECORD: (meetingId: string) => `/api/v1/meeting-records/${meetingId}`,
    RECORD_ACTIONS: (meetingId: string) =>
      `/api/v1/meeting-records/${meetingId}/actions`,
    ACTION: (actionId: string) => `/api/v1/meeting-actions/${actionId}`,
  },
  EDIT_LOCKS: {
    ROOT: '/api/v1/edit-locks',
  },
  EVALUATION: {
    CONTEXT: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/evaluation-context`,
    TEAM_CRITERIA: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/team-evaluation-criteria`,
    TEAM_EVALUATION: (milestoneId: string, teamId: string) =>
      `/api/v1/milestones/${milestoneId}/team-evaluations/${teamId}`,
    MY_TEAM_EVALUATIONS: (milestoneId: string) =>
      `/api/v1/milestones/${milestoneId}/team-evaluations/me`,
    PEER_TARGETS: (formId: string) =>
      `/api/v1/peer-evaluation-forms/${formId}/targets`,
    PEER_RESPONSES: (formId: string) =>
      `/api/v1/peer-evaluation-forms/${formId}/responses`,
  },
  TOPIC: {
    FINALIZE: (teamId: string) => `/api/v1/teams/${teamId}/topic-finalize`,
    CANDIDATES: (teamId: string) => `/api/v1/teams/${teamId}/topic-candidates`,
    CANDIDATE_VOTE: (candidateId: string) =>
      `/api/v1/topic-candidates/${candidateId}/vote`,
    // Legacy demo projection; production uses team/candidate endpoints above.
    BOARD: (sectionId: string) => `/api/v1/sections/${sectionId}/project-topic`,
    VOTE: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/project-topic/vote`,
  },
  SUBMISSION: {
    MILESTONE_PRESENTATIONS: (milestoneId: string) =>
      `/api/v1/milestones/${milestoneId}/presentations`,
    PRESENTATION_ORDER: (milestoneId: string) =>
      `/api/v1/milestones/${milestoneId}/presentation-order`,
    MY_TEAM_BY_MILESTONE: (milestoneId: string) =>
      `/api/v1/milestones/${milestoneId}/my-team-submission`,
    DETAIL: (submissionId: string) => `/api/v1/submissions/${submissionId}`,
    VERSIONS: (submissionId: string) =>
      `/api/v1/submissions/${submissionId}/versions`,
    VERSION: (submissionId: string, version: number) =>
      `/api/v1/submissions/${submissionId}/versions/${version}`,
    CONFIRMATION: (submissionId: string) =>
      `/api/v1/submissions/${submissionId}/confirmation`,
    MEMBER_CONFIRMATIONS: (submissionId: string) =>
      `/api/v1/submissions/${submissionId}/member-confirmations`,
    MY_MEMBER_CONFIRMATION: (submissionId: string) =>
      `/api/v1/submissions/${submissionId}/member-confirmations/me`,
    MID_REPORT_FEEDBACK: (submissionId: string) =>
      `/api/v1/submissions/${submissionId}/mid-report-feedback`,
  },
  REVIEW: {
    REVISION_RESPONSE: (reviewId: string) =>
      `/api/v1/reviews/${reviewId}/revision-response`,
  },
  MID_REPORT: {
    CURRENT: '/api/v1/mid-reports/current',
    BLOCK: (midReportId: string, blockKey: string) =>
      `/api/v1/mid-reports/${midReportId}/blocks/${blockKey}`,
    BLOCK_COMPLETION: (midReportId: string, blockKey: string) =>
      `/api/v1/mid-reports/${midReportId}/blocks/${blockKey}/completion`,
    SUBMIT: (midReportId: string) =>
      `/api/v1/mid-reports/${midReportId}/submit`,
  },
  PRESENTATION: {
    CURRENT: '/api/v1/presentations/current',
    BLOCK: (presentationId: string, blockKey: string) =>
      `/api/v1/presentations/${presentationId}/blocks/${blockKey}`,
    BLOCK_COMPLETION: (presentationId: string, blockKey: string) =>
      `/api/v1/presentations/${presentationId}/blocks/${blockKey}/completion`,
    SUBMIT: (presentationId: string) =>
      `/api/v1/presentations/${presentationId}/submit`,
  },
  PROPOSAL: {
    CURRENT: '/api/v1/proposals/current',
    BLOCK: (proposalId: string, blockKey: string) =>
      `/api/v1/proposals/${proposalId}/blocks/${blockKey}`,
    BLOCK_COMPLETION: (proposalId: string, blockKey: string) =>
      `/api/v1/proposals/${proposalId}/blocks/${blockKey}/completion`,
    SUBMIT: (proposalId: string) => `/api/v1/proposals/${proposalId}/submit`,
  },
  TEAM_ASSIGNMENT: {
    SUBMIT_SURVEY_RESPONSE: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/pre-survey/responses`,
    MY_SURVEY_RESPONSE: '/api/v1/users/me/pre-survey-response',
    ROOT: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/team-assignment`,
    SURVEY: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/team-assignment/survey`,
    LEADER: (sectionId: string, teamId: string) =>
      `/api/v1/sections/${sectionId}/team-assignment/teams/${teamId}/leader`,
    PARTNER_CANDIDATES: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/team-assignment/partner-candidates`,
    PARTNER_REQUESTS: (sectionId: string) =>
      `/api/v1/sections/${sectionId}/team-assignment/partner-requests`,
    PARTNER_REQUEST_RESPONSE: (sectionId: string, requestId: string) =>
      `/api/v1/sections/${sectionId}/team-assignment/partner-requests/${requestId}`,
    PARTNER_REQUEST: (sectionId: string, requestId: string) =>
      `/api/v1/sections/${sectionId}/team-assignment/partner-requests/${requestId}`,
  },
} as const;
