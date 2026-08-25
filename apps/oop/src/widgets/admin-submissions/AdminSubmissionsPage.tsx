import { Heading } from '@aics/design-system';
import { useSearch } from '@tanstack/react-router';

import * as styles from './AdminSubmissionsPage.css';

export default function AdminSubmissionsPage() {
  const search = useSearch({ from: '/admin/submissions' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const { milestoneId, sectionId } = search;

  return (
    <div className={styles.page}>
      <Heading level={1}>분반별 제출물</Heading>
      <p className={styles.placeholder}>
        {sectionId ?? '담당 분반'} · {milestoneId ?? '첫 번째 마일스톤'} 제출
        목록을 준비하고 있습니다.
      </p>
    </div>
  );
}
