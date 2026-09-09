import type { StudentHomeMilestone } from '@aics/core';

/** Preserve server week order; closed, completed and unknown stages are not active. */
export function selectActiveMilestone(
  milestones: StudentHomeMilestone[],
  canSubmitIds: Set<string>,
) {
  return (
    milestones.find(
      item =>
        (item.status === 'in-progress' ||
          item.status === 'revision-available') &&
        canSubmitIds.has(item.id),
    ) ??
    milestones.find(
      item =>
        item.status === 'in-progress' || item.status === 'revision-available',
    ) ??
    milestones.find(item => item.status === 'before-period')
  );
}
