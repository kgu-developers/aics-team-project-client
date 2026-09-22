export type AdminPreSurveyResponsePreview = {
  etcOpinion: string | null;
  id: number;
  preferredRoles: string[];
  preferredPeerUserId?: string | null;
  preferredPeerName?: string | null;
  preferredPeerStatus?: string | null;
  mutual?: boolean | null;
  submittedAt: string;
  topicOpinion: string | null;
  userId: string;
  userName: string;
};

const oopPreSurveyResponses: AdminPreSurveyResponsePreview[] = [
  {
    etcOpinion: '금요일 오후에는 회의가 어렵습니다.',
    id: 1,
    preferredRoles: ['DEVELOPMENT', 'TEAM_LEADER'],
    preferredPeerUserId: '20231234',
    preferredPeerName: '김민준',
    preferredPeerStatus: 'ACCEPTED',
    mutual: true,
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
    userId: '20231234',
    userName: '김민준',
  },
];

// MSW fixture for the KD3-148 administrator pre-survey response contract.
export const adminPreSurveyResponsesBySection: Record<
  string,
  AdminPreSurveyResponsePreview[]
> = {
  '1': oopPreSurveyResponses,
  'oop-2026-2-01': oopPreSurveyResponses,
};
