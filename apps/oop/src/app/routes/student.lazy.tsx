import { createLazyFileRoute } from '@tanstack/react-router';

import RouteNotFoundPage from '~/app/components/RouteNotFoundPage';
import StudentShell from '~/app/components/StudentShell';
import { ROUTES } from '~/app/constants/routes';

export const Route = createLazyFileRoute('/student')({
  component: StudentShell,
  notFoundComponent: StudentNotFoundRoute,
});

function StudentNotFoundRoute() {
  return (
    <RouteNotFoundPage
      actionLabel='학생 홈으로 가기'
      actionTo={ROUTES.STUDENT.HOME}
      description='학생 흐름에 없는 주소입니다.'
      title='페이지를 찾을 수 없어요.'
    />
  );
}
