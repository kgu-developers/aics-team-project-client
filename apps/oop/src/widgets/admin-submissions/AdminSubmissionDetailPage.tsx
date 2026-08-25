import { Heading, Text } from '@aics/design-system';
import { Link, useParams, useSearch } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminSubmissionsPage.css';

export default function AdminSubmissionDetailPage() {
  const { submissionId } = useParams({
    from: '/admin/submissions/$submissionId',
  });
  const search = useSearch({ from: '/admin/submissions/$submissionId' }) as {
    milestoneId?: string;
    sectionId?: string;
  };

  return (
    <div className={styles.page}>
      <Link
        className={styles.backLink}
        search={search}
        to={ROUTES.ADMIN_SUBMISSIONS}
      >
        ← 제안서 목록으로
      </Link>
      <Heading level={1}>제안서 상세보기</Heading>
      <Text className={styles.description}>
        제출 ID: {submissionId}. 상세 내용 조회는 다음 작업에서 연결합니다.
      </Text>
    </div>
  );
}
