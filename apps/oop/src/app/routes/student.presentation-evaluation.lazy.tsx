import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/presentation-evaluation')({
  component: PresentationEvaluationPage,
});

function PresentationEvaluationPage() {
  return (
    <PagePlaceholder
      title='발표 평가'
      description='다른 팀의 발표를 보고 평가 항목을 채점합니다.'
      todos={[
        '평가 대상 팀 목록 표시',
        '평가 항목 입력 폼',
        '제출한 평가 내역 확인',
      ]}
    />
  );
}
