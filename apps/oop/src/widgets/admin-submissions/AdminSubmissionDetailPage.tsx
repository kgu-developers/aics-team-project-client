import { Heading, Text } from '@aics/design-system';
import { Link, useParams, useSearch } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminSubmissionsPage.css';

const milestoneLabels = {
  'final-report': '최종 보고서',
  midterm: '중간 점검',
  'peer-review': '상호 평가',
  'presentation-evaluate': '발표 평가',
  'presentation-submit': '발표 자료 제출',
  proposal: '제안서',
} as const;

function getMilestoneLabel(milestoneId: string | undefined) {
  if (milestoneId && milestoneId in milestoneLabels) {
    return milestoneLabels[milestoneId as keyof typeof milestoneLabels];
  }

  return '제출물';
}

export default function AdminSubmissionDetailPage() {
  const { submissionId } = useParams({
    from: '/admin/submissions/$submissionId',
  });
  const search = useSearch({ from: '/admin/submissions/$submissionId' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const milestoneLabel = getMilestoneLabel(search.milestoneId);

  return (
    <div className={styles.page}>
      <Link
        className={styles.backLink}
        search={search}
        to={ROUTES.ADMIN_SUBMISSIONS}
      >
        ← {milestoneLabel} 목록으로
      </Link>
      <Heading level={1}>{milestoneLabel} 상세보기</Heading>
      <Text className={styles.description}>
        제출 ID: {submissionId}. 상세 내용 조회는 다음 작업에서 연결합니다.
      </Text>
    </div>
  );
}
