import type { StudentHomeMilestone } from '@aics/core';
import { CollapsibleGroup, EmptyState } from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import MilestoneCard from './MilestoneCard';
import * as styles from './MilestoneList.css';

type MilestoneListProps = {
  milestones: StudentHomeMilestone[];
  persistenceKey: string;
};

type MilestoneAccordionState = {
  openIds: string[];
  knownAvailableIds: string[];
};

type ScopedMilestoneAccordionState = MilestoneAccordionState & {
  storageKey: string;
};

const MILESTONE_ACCORDION_STORAGE_KEY_PREFIX =
  'oop:student-home:milestone-accordion:v1';

function readMilestoneAccordionState(
  storageKey: string,
): MilestoneAccordionState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('openIds' in parsed) ||
      !('knownAvailableIds' in parsed) ||
      !Array.isArray(parsed.openIds) ||
      !parsed.openIds.every(id => typeof id === 'string') ||
      !Array.isArray(parsed.knownAvailableIds) ||
      !parsed.knownAvailableIds.every(id => typeof id === 'string')
    ) {
      return null;
    }

    return {
      openIds: parsed.openIds,
      knownAvailableIds: parsed.knownAvailableIds,
    };
  } catch {
    return null;
  }
}

function writeMilestoneAccordionState(
  storageKey: string,
  state: MilestoneAccordionState,
) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        openIds: state.openIds,
        knownAvailableIds: state.knownAvailableIds,
      }),
    );
  } catch {
    // Storage can be unavailable in restricted browser contexts. Local state still works.
  }
}

function reconcileMilestoneAccordionState(
  availableIds: string[],
  previous: MilestoneAccordionState | null,
): MilestoneAccordionState {
  if (!previous) {
    return { openIds: availableIds, knownAvailableIds: availableIds };
  }

  const previouslyAvailable = new Set(previous.knownAvailableIds);
  const previouslyOpen = new Set(previous.openIds);
  const newlyAvailableIds = availableIds.filter(
    id => !previouslyAvailable.has(id),
  );

  return {
    openIds: [
      ...previous.openIds,
      ...newlyAvailableIds.filter(id => !previouslyOpen.has(id)),
    ],
    knownAvailableIds: [...previous.knownAvailableIds, ...newlyAvailableIds],
  };
}

function hasSameIds(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

export default function MilestoneList({
  milestones,
  persistenceKey,
}: MilestoneListProps) {
  const detailAvailableIds = useMemo(
    () =>
      milestones
        .filter(milestone => milestone.isDetailAvailable)
        .map(milestone => milestone.id),
    [milestones],
  );
  const detailAvailableKey = detailAvailableIds.join('|');
  const storageKey = `${MILESTONE_ACCORDION_STORAGE_KEY_PREFIX}:${persistenceKey}`;
  const [accordionState, setAccordionState] =
    useState<ScopedMilestoneAccordionState>(() => ({
      storageKey,
      ...reconcileMilestoneAccordionState(
        detailAvailableIds,
        readMilestoneAccordionState(storageKey),
      ),
    }));

  const resolvedAccordionState =
    accordionState.storageKey === storageKey
      ? reconcileMilestoneAccordionState(detailAvailableIds, accordionState)
      : reconcileMilestoneAccordionState(
          detailAvailableIds,
          readMilestoneAccordionState(storageKey),
        );

  useEffect(() => {
    const nextAvailableIds = detailAvailableKey
      ? detailAvailableKey.split('|')
      : [];

    setAccordionState(current => {
      const previous =
        current.storageKey === storageKey
          ? current
          : readMilestoneAccordionState(storageKey);
      const next = reconcileMilestoneAccordionState(nextAvailableIds, previous);
      return current.storageKey === storageKey &&
        hasSameIds(current.openIds, next.openIds) &&
        hasSameIds(current.knownAvailableIds, next.knownAvailableIds)
        ? current
        : { storageKey, ...next };
    });
  }, [detailAvailableKey, storageKey]);

  useEffect(() => {
    if (accordionState.storageKey === storageKey) {
      writeMilestoneAccordionState(storageKey, accordionState);
    }
  }, [accordionState, storageKey]);

  const openIds = detailAvailableIds.filter(id =>
    resolvedAccordionState.openIds.includes(id),
  );

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
          onChange={value => {
            const selectedIds = Array.isArray(value) ? value : [value];
            const availableIdSet = new Set(detailAvailableIds);
            setAccordionState({
              storageKey,
              openIds: [
                ...resolvedAccordionState.openIds.filter(
                  id => !availableIdSet.has(id),
                ),
                ...selectedIds,
              ],
              knownAvailableIds: resolvedAccordionState.knownAvailableIds,
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
