import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/teams/$teamId')({
  component: ProfessorTeamsTeamIdPage,
});

function ProfessorTeamsTeamIdPage() {
  return (
    <PagePlaceholder
      title='팀 상세'
      description='팀원, 역할, 프로젝트 주제, 제출 흐름을 확인하는 페이지입니다.'
      todos={['팀원 역할 수정', '프로젝트 주제 상태 표시', '제출/피드백/변경 이력 연결']}
    />
  );
}
