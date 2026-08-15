import type { StudentHomeMilestone } from '@aics/core';
import { CollapsibleGroup, EmptyState } from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import MilestoneCard from './MilestoneCard';
import * as styles from './MilestoneList.css';

type MilestoneListProps = {
  milestones: StudentHomeMilestone[];
};

export default function MilestoneList({ milestones }: MilestoneListProps) {
  const detailAvailableIds = useMemo(
    () =>
      milestones
        .filter(milestone => milestone.isDetailAvailable)
        .map(milestone => milestone.id),
    [milestones],
  );
  const detailAvailableKey = detailAvailableIds.join('|');
  const [openIds, setOpenIds] = useState(detailAvailableIds);

  useEffect(() => {
    setOpenIds(detailAvailableKey ? detailAvailableKey.split('|') : []);
  }, [detailAvailableKey]);

  return (
    <section className={styles.milestoneSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>팀 프로젝트 진행 단계</h2>
        <p className={styles.sectionDesc}>
          해당 단계를 펼쳐, 더 자세한 내용을 확인 해보세요.
        </p>
      </div>
      {milestones.length === 0 ? (
        <EmptyState
          description='운영 일정이 등록되면 프로젝트 진행 단계를 확인할 수 있어요.'
          title='등록된 마일스톤이 없어요.'
        />
      ) : (
        <CollapsibleGroup
          type='multiple'
          value={openIds}
          onChange={value => setOpenIds(Array.isArray(value) ? value : [value])}
        >
          <div className={styles.milestoneList}>
            {milestones.map(milestone => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                isOpen={openIds.includes(milestone.id)}
              />
            ))}
          </div>
        </CollapsibleGroup>
      )}
    </section>
  );
}
