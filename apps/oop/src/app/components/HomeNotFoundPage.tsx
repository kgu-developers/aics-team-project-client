import { ROUTES } from '~/app/constants/routes';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import RouteNotFoundPage from './RouteNotFoundPage';

/**
 * Root-level 404. The action must name where the user will actually land:
 * `/student` bounces non-students to `/admin`, so an admin who read
 * "학생 홈으로 가기" ended up somewhere else.
 */
export default function HomeNotFoundPage() {
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const role = useAuthStore(state => state.currentUser?.globalRole);

  if (!hasSession || !role)
    return (
      <RouteNotFoundPage
        actionLabel='로그인으로 가기'
        actionTo={ROUTES.LOGIN}
        description='없는 주소이거나 로그인이 필요한 화면입니다.'
        title='페이지를 찾을 수 없어요.'
      />
    );

  return role === 'STUDENT' ? (
    <RouteNotFoundPage
      actionLabel='학생 홈으로 가기'
      actionTo={ROUTES.STUDENT.HOME}
      description='현재 학생 흐름에 없는 주소입니다.'
      title='페이지를 찾을 수 없어요.'
    />
  ) : (
    <RouteNotFoundPage
      actionLabel='관리자 홈으로 가기'
      actionTo={ROUTES.ADMIN}
      description='현재 관리자 흐름에 없는 주소입니다.'
      title='페이지를 찾을 수 없어요.'
    />
  );
}
