import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/team')({
  component: StudentTeamPage,
});

function StudentTeamPage() {
  return (
    <PagePlaceholder
      title='내 팀'
      description='팀원, 역할, 팀장, 그리고 현재 프로젝트 주제를 확인합니다.'
      todos={['팀원과 역할 표시', '팀장 정보 표시', '프로젝트 주제 페이지 이동']}
    />
  );
}
