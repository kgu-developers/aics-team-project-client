export const ROUTES = {
  LOGIN: '/login',
  ADMIN: '/admin',
  STUDENT: {
    HOME: '/student',
    TEAM: '/student/team',
    PROJECT_TOPIC: '/student/project-topic',
    SUBMISSIONS: '/student/submissions',
    FEEDBACK: '/student/feedback',
    PEER_REVIEW: '/student/peer-review',
    GRADES: '/student/grades',
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
