export const ROUTES = {
  LOGIN: '/login',
  ADMIN: '/admin',
  STUDENT: {
    HOME: '/student',
    TEAM: '/student/team',
    PROJECT_TOPIC: '/student/project-topic',
    MILESTONES: '/student/milestones',
    SUBMISSIONS: '/student/submissions',
    FEEDBACK: '/student/feedback',
    PEER_REVIEW: '/student/peer-review',
    GRADES: '/student/grades',
  },
  ONBOARDING: {
    TEAM: '/onboarding/team',
    SURVEY: '/onboarding/team/survey',
    RESULT: '/onboarding/team/result',
    FIRST_MEETING: '/onboarding/team/first-meeting',
  },
} as const;

export type OnboardingDestination =
  | (typeof ROUTES.ONBOARDING)[keyof typeof ROUTES.ONBOARDING]
  | typeof ROUTES.STUDENT.HOME;

export type RouteDestination =
  | typeof ROUTES.LOGIN
  | typeof ROUTES.ADMIN
  | (typeof ROUTES.STUDENT)[keyof typeof ROUTES.STUDENT]
  | (typeof ROUTES.ONBOARDING)[keyof typeof ROUTES.ONBOARDING];
