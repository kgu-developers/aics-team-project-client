export type AdminPreSurveyResponsePreview = {
  etcOpinion: string | null;
  id: number;
  preferredRoles: string[];
  submittedAt: string;
  topicOpinion: string | null;
  userId: string;
  userName: string;
};

// MSW fixture for the KD3-148 administrator pre-survey response contract.
export const adminPreSurveyResponsesBySection: Record<
  string,
  AdminPreSurveyResponsePreview[]
> = {
  'oop-2026-2-01': [
    {
      etcOpinion: '금요일 오후에는 회의가 어렵습니다.',
      id: 1,
      preferredRoles: ['BACKEND', 'PM'],
      submittedAt: '2026-09-04 14:00',
      topicOpinion: '학사 일정 알림 서비스를 만들고 싶습니다.',
      userId: '20260001',
      userName: '김객체',
    },
    {
      etcOpinion: null,
      id: 2,
      preferredRoles: ['DESIGN', 'DOCUMENTATION_PRESENTATION'],
      submittedAt: '2026-09-04 14:12',
      topicOpinion: null,
      userId: '20260003',
      userName: '이프로',
    },
  ],
};
