export const adminPreSurveyKeys = {
  all: ['admin-pre-survey'] as const,
  lists: () => [...adminPreSurveyKeys.all, 'list'] as const,
  list: (sectionId: string) =>
    [...adminPreSurveyKeys.lists(), sectionId] as const,
};
