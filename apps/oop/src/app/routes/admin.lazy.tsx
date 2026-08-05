import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/admin')({
  component: AdminHomePage,
});

function AdminHomePage() {
  return (
    <PagePlaceholder
      title='운영 홈'
      description='분반과 팀 프로젝트 운영에 필요한 관리 기능을 이곳에서 이어갑니다.'
      todos={[
        '분반별 팀 현황 요약',
        '마감 임박 제출물 확인',
        '피드백과 평가 작업 진입점',
      ]}
    />
  );
}
