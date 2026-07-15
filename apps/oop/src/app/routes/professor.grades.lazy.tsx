import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/grades')({
  component: ProfessorGradesPage,
});

function ProfessorGradesPage() {
  return (
    <PagePlaceholder
      title='성적 산출 및 확정'
      description='루브릭 평가와 제출 상태를 바탕으로 최종 성적을 산출하고 확정하는 페이지입니다.'
      todos={['최종 성적 산출', '성적 확정 전 검토', '확정 이력 기록']}
    />
  );
}
