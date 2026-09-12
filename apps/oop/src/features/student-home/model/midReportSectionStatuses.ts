import type { MidReport, StudentHomeSectionStatus } from '@aics/core';

import { EDITOR_DOCS, editorSectionTo } from '~/app/constants/editorSections';

export type MidReportSectionsState = 'pending' | 'error' | 'ready';

/** The document blocks map one to one onto the mid report editor sections. */
export function midReportSectionStatuses(
  state: MidReportSectionsState,
  report?: MidReport,
): StudentHomeSectionStatus[] {
  return EDITOR_DOCS['mid-review'].sections.map(
    ({ slug, label }): StudentHomeSectionStatus => {
      const base = { id: slug, label, to: editorSectionTo('mid-review', slug) };
      if (state !== 'ready' || !report)
        return {
          ...base,
          status: 'not-started',
          statusLabel:
            state === 'error' ? '상태를 불러오지 못했어요.' : '상태 조회 중',
        };
      const block = report.blocks.find(item => item.key === slug);
      if (block?.status === 'COMPLETED')
        return {
          ...base,
          status: 'completed',
          statusLabel: '작성 완료',
          ...(block.lastSavedAt ? { updatedAt: block.lastSavedAt } : {}),
        };
      // lastSavedAt is always a date, so the recorded editor is the only
      // signal that someone has actually written in the block.
      const started = Boolean(block?.lastEditedBy);
      return {
        ...base,
        status: started ? 'in-progress' : 'not-started',
        statusLabel: started ? '작성 중' : '작성 전',
      };
    },
  );
}
