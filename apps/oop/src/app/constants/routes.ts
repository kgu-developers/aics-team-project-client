export const ROUTES = {
  LOGIN: '/login',
  ADMIN: '/admin',
  ADMIN_NOTICES: '/admin/notices',
  ADMIN_NOTICE_NEW: '/admin/notices/new',
  ADMIN_NOTICE_EDIT: '/admin/notices/$noticeId/edit',
  ADMIN_MEETINGS: '/admin/meetings',
  ADMIN_MEETING_DETAIL: '/admin/meetings/$meetingId',
  ADMIN_MILESTONES: '/admin/milestones',
  ADMIN_MILESTONE_DETAIL: '/admin/milestones/$milestoneId',
  ADMIN_MILESTONE_NEW: '/admin/milestones/new',
  ADMIN_PROFILE: '/admin/profile',
  ADMIN_STUDENT_TEAM: '/admin/student-team',
  ADMIN_SUBMISSIONS: '/admin/submissions',
  ADMIN_SUBMISSION_DETAIL: '/admin/submissions/$submissionId',
  ADMIN_TEAM_DETAIL: '/admin/teams/$teamId',
  STUDENT: {
    HOME: '/student',
    TEAM: '/student/team',
    TEAM_ACTION_PLANS: '/student/team/action-plans',
    MEETINGS: '/student/meetings',
    MEETING_NEW: '/student/meetings/new',
    NOTICES: '/student/notices',
    NOTICE_DETAIL: '/student/notices/$noticeId',
    PEER_REVIEW: '/student/peer-review',
    PRESENTATION_EVALUATION: '/student/presentation-evaluation',
  },
  ONBOARDING: {
    TEAM: '/onboarding/team',
    SURVEY: '/onboarding/team/survey',
    RESULT: '/onboarding/team/result',
    FIRST_MEETING: '/onboarding/team/first-meeting',
  },
} as const;

/** ROUTES 트리에서 문자열 리프 경로만 추출한다. */
type RoutePathOf<T> = T extends string
  ? T
  : { [K in keyof T]: RoutePathOf<T[K]> }[keyof T];

export type OnboardingDestination =
  | (typeof ROUTES.ONBOARDING)[keyof typeof ROUTES.ONBOARDING]
  | typeof ROUTES.STUDENT.HOME;

export type RouteDestination = RoutePathOf<typeof ROUTES>;
