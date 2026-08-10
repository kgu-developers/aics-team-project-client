export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/me',
  },
  SECTION: {
    STUDENT_DASHBOARD: (sectionId: string) =>
      `/sections/${sectionId}/dashboard/student`,
  },
  TEAM: {
    ROOT: '/teams',
  },
} as const;
