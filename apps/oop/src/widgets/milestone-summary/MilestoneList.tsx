import type { StudentHomeMilestone } from '@aics/core';
import { CollapsibleGroup, EmptyState } from '@aics/design-system';
import { useState } from 'react';

import MilestoneCard from './MilestoneCard';
import * as styles from './MilestoneList.css';

type MilestoneListProps = {
  milestones: StudentHomeMilestone[];
};

export default function MilestoneList({ milestones }: MilestoneListProps) {
  const [openId, setOpenId] = useState(() => {
    const initiallyOpen = milestones.find(milestone => milestone.isOpen);
    return initiallyOpen ? initiallyOpen.id : '';
  });

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
          type='single'
          value={openId}
          onChange={value =>
            setOpenId(typeof value === 'string' ? value : (value[0] ?? ''))
          }
        >
          <div className={styles.milestoneList}>
            {milestones.map(milestone => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                isOpen={milestone.id === openId}
              />
            ))}
          </div>
        </CollapsibleGroup>
      )}
    </section>
  );
}
