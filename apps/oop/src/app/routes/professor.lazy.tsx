import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor')({
  component: ProfessorPage,
});

function ProfessorPage() {
  return (
    <PagePlaceholder
      title='교수자 대시보드'
      description='교수자가 분반, 팀, 마일스톤, 제출 현황을 한눈에 보는 운영 홈입니다.'
      todos={[
        '분반별 주요 지표 표시',
        '리스크 팀과 마감 임박 제출 요약',
        '자주 쓰는 관리 화면으로 이동',
      ]}
    />
  );
}
