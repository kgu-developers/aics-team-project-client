import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <PagePlaceholder
      title='알림 센터'
      description='마감 임박, 피드백, 수정 요청, 제출 완료 알림을 모아 보는 페이지입니다.'
      todos={['알림 목록 표시', '읽음 처리', '알림 유형별 필터']}
    />
  );
}
