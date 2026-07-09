import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/rubrics/new')({
  component: ProfessorRubricsNewPage,
});

function ProfessorRubricsNewPage() {
  return (
    <PagePlaceholder
      title='루브릭 생성'
      description='새 평가 루브릭과 항목별 점수 기준을 만드는 페이지입니다.'
      todos={['루브릭 기본 정보 입력', '항목별 배점 설정', '마일스톤 연결 준비']}
    />
  );
}
