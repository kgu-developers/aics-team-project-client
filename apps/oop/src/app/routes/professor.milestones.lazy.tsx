import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/milestones')({
  component: ProfessorMilestonesPage,
});

function ProfessorMilestonesPage() {
  return (
    <PagePlaceholder
      title='마일스톤 관리'
      description='OOP 팀 프로젝트의 제출 주기와 공개 상태를 관리하는 페이지입니다.'
      todos={['마일스톤 목록 표시', '마일스톤 생성', '공개/비공개 상태 요약']}
    />
  );
}
