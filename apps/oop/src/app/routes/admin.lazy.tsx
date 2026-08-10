import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAuthStore } from '~/features/auth/authStore';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/admin')({
  component: AdminHomePage,
});

function AdminHomePage() {
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUser = useAuthStore(state => state.currentUser);

  if (!accessToken || !currentUser) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  if (currentUser.globalRole === 'STUDENT') {
    return <Navigate to={ROUTES.STUDENT.HOME} />;
  }

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
