import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  return (
    <PagePlaceholder
      title='로그인'
      description='사용자가 OOP 팀 프로젝트 운영 도구에 진입하기 위한 인증 페이지입니다.'
      todos={[
        '학교 계정 로그인 UI 연결',
        '로그인 실패/권한 없음 상태 처리',
        '로그인 후 역할별 홈 이동',
      ]}
    />
  );
}
