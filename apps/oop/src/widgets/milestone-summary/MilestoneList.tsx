import type { StudentHomeMilestone } from '@aics/core';
import { CollapsibleGroup, EmptyState } from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import MilestoneCard from './MilestoneCard';
import * as styles from './MilestoneList.css';

type MilestoneListProps = {
  milestones: StudentHomeMilestone[];
  persistenceKey: string;
  defaultOpenId?: string | null;
  description?: string;
};

type MilestoneAccordionState = {
  scopeKey: string;
  defaultOpenId?: string;
  openIds: string[];
};

function initialOpenIds(defaultOpenId?: string) {
  return defaultOpenId ? [defaultOpenId] : [];
}

export default function MilestoneList({
  milestones,
  persistenceKey,
  defaultOpenId,
  description = '해당 단계를 펼쳐, 더 자세한 내용을 확인 해보세요.',
}: MilestoneListProps) {
  const detailAvailableIds = useMemo(
    () =>
      milestones
        .filter(milestone => milestone.isDetailAvailable)
        .map(milestone => milestone.id),
    [milestones],
  );
  const scopeKey = persistenceKey;
  const resolvedDefaultOpenId =
    defaultOpenId === undefined
      ? detailAvailableIds[0]
      : (defaultOpenId ?? undefined);
  const [accordionState, setAccordionState] = useState<MilestoneAccordionState>(
    () => ({
      scopeKey,
      defaultOpenId: resolvedDefaultOpenId,
      openIds: initialOpenIds(resolvedDefaultOpenId),
    }),
  );

  const isCurrentScope =
    accordionState.scopeKey === scopeKey &&
    accordionState.defaultOpenId === resolvedDefaultOpenId;
  const resolvedOpenIds = isCurrentScope
    ? accordionState.openIds
    : initialOpenIds(resolvedDefaultOpenId);
  const openIds = detailAvailableIds.filter(id => resolvedOpenIds.includes(id));

  useEffect(() => {
    setAccordionState(current =>
      current.scopeKey === scopeKey &&
      current.defaultOpenId === resolvedDefaultOpenId
        ? current
        : {
            scopeKey,
            defaultOpenId: resolvedDefaultOpenId,
            openIds: initialOpenIds(resolvedDefaultOpenId),
          },
    );
  }, [resolvedDefaultOpenId, scopeKey]);

  return (
    <section className={styles.milestoneSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>팀 프로젝트 진행 단계</h2>
        <p className={styles.sectionDesc}>{description}</p>
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
          onChange={value => {
            const selectedIds = Array.isArray(value) ? value : [value];
            const availableIdSet = new Set(detailAvailableIds);
            setAccordionState({
              scopeKey,
              defaultOpenId: resolvedDefaultOpenId,
              openIds: selectedIds.filter(id => availableIdSet.has(id)),
            });
          }}
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
