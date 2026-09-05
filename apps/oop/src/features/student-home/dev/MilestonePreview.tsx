import { Button } from '@aics/design-system';
import { useState } from 'react';

import * as styles from './MilestonePreview.css';

const previewOptions = [
  { value: 'proposal-topic', label: '제안서 · 주제 선정' },
  { value: 'proposal-writing', label: '제안서 · 작성' },
  { value: 'proposal-feedback', label: '제안서 · 수정 전 차단' },
  { value: 'proposal-feedback-ready', label: '제안서 · 답변 작성 가능' },
  { value: 'mid-report', label: '중간 · 작성' },
  {
    value: 'proposal-feedback-mid-report',
    label: '제안서 피드백 · 중간 작성',
  },
  { value: 'mid-feedback', label: '중간 · 수정 전 차단' },
  { value: 'mid-feedback-ready', label: '중간 · 반영 기록 작성 가능' },
  { value: 'presentation-material-empty', label: '발표 · 제출 전' },
  { value: 'presentation-material', label: '발표 · 자료 작성' },
  { value: 'presentation-evaluation', label: '발표 · 평가' },
  { value: 'final-report', label: '최종 · 제출' },
  { value: 'peer-evaluation', label: '상호 · 평가' },
] as const;

type MilestonePreviewProps = {
  onPreviewChange: () => void;
};

export default function MilestonePreview({
  onPreviewChange,
}: MilestonePreviewProps) {
  const [activePreview, setActivePreview] = useState(() =>
    new URLSearchParams(window.location.search).get('milestonePreview'),
  );

  function selectPreview(preview: string) {
    const url = new URL(window.location.href);

    url.searchParams.set('milestonePreview', preview);
    window.history.pushState(null, '', url);
    setActivePreview(preview);
    onPreviewChange();
  }

  return (
    <aside aria-label='개발용 마일스톤 미리보기' className={styles.root}>
      <p className={styles.label}>개발용 마일스톤 미리보기</p>
      <div className={styles.options}>
        {previewOptions.map(option => (
          <Button
            clickAction={() => selectPreview(option.value)}
            key={option.value}
            label={option.label}
            size='sm'
            variant={activePreview === option.value ? 'primary' : 'secondary'}
          />
        ))}
      </div>
    </aside>
  );
}
