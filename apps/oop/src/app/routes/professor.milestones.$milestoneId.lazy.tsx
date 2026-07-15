import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/milestones/$milestoneId')({
  component: ProfessorMilestonesMilestoneIdPage,
});

function ProfessorMilestonesMilestoneIdPage() {
  return (
    <PagePlaceholder
      title='마일스톤 상세 설정'
      description='특정 마일스톤의 일정, 공개 상태, 제출 조건을 관리하는 페이지입니다.'
      todos={['공개/비공개 전환', '제출 조건 수정', '연결된 루브릭과 제출 현황 표시']}
    />
  );
}
