import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/forbidden')({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <PagePlaceholder
      title='접근 차단'
      description='권한이 없는 사용자가 접근했을 때 보여줄 403 안내 페이지입니다.'
      todos={[
        '권한 부족 사유 표시',
        '다른 계정으로 로그인 동선 제공',
        '관리자 문의 안내 연결',
      ]}
    />
  );
}
