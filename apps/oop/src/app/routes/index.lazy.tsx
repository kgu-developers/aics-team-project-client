import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <PagePlaceholder
      title='OOP 팀 프로젝트 운영 홈'
      description='역할별 진입과 전체 운영 흐름을 안내하는 앱 시작 페이지입니다.'
      todos={[
        '로그인 상태와 역할에 따라 교수자/조교/학생 홈으로 이동',
        'OOP course config를 기준으로 화면 문구와 메뉴 연결',
        '팀 공유 후 실제 홈 대시보드 범위 확정',
      ]}
    />
  );
}
