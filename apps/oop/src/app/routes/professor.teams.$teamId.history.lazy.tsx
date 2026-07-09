import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/teams/$teamId/history')({
  component: ProfessorTeamsTeamIdHistoryPage,
});

function ProfessorTeamsTeamIdHistoryPage() {
  return (
    <PagePlaceholder
      title='팀 변경 이력'
      description='팀 구성과 역할 변경 내역을 확인하는 페이지입니다.'
      todos={['변경 이력 타임라인', '변경자/변경 사유 표시', '감사 로그와 연결']}
    />
  );
}
