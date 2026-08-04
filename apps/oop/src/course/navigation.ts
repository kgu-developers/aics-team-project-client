export const studentPrimaryNavigation = [
  { label: '홈', to: '/student' },
  { label: '내 팀', to: '/student/team' },
  { label: '마일스톤', to: '/student/milestones' },
  { label: '제출물', to: '/student/submissions' },
  { label: '피드백', to: '/student/feedback' },
] as const;

export const studentContextualRoutes = [
  { label: '프로젝트 주제', to: '/student/project-topic' },
  { label: '상호평가', to: '/student/peer-review' },
  { label: '성적', to: '/student/grades' },
] as const;
