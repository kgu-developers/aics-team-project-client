import type {
  ProposalSectionsResponse,
  StudentHomeSectionStatus,
} from '@aics/core';

import { EDITOR_DOCS, editorSectionTo } from '~/app/constants/editorSections';

import { proposalSectionBySlug } from '~/features/proposal/projectProposal';

export type ProposalSectionsState = 'pending' | 'error' | 'ready';

/**
 * The server tracks the four writing areas only; team info has no server state,
 * so it is left out instead of being shown with an invented status.
 */
export function proposalSectionStatuses(
  state: ProposalSectionsState,
  sections?: ProposalSectionsResponse,
): StudentHomeSectionStatus[] {
  return EDITOR_DOCS.proposal.sections.flatMap(
    ({ slug, label }): StudentHomeSectionStatus[] => {
      const sectionType = proposalSectionBySlug[slug];
      if (!sectionType) return [];
      const base = { id: slug, label, to: editorSectionTo('proposal', slug) };
      if (state !== 'ready' || !sections)
        return [
          {
            ...base,
            status: 'not-started',
            statusLabel:
              state === 'error' ? '상태를 불러오지 못했어요.' : '상태 조회 중',
          },
        ];
      const current = sections.contents.find(
        item => item.section === sectionType,
      );
      if (current?.completed)
        return [
          {
            ...base,
            status: 'completed',
            statusLabel: '작성 완료',
            updatedAt: current.completedAt ?? undefined,
          },
        ];
      // An assignee is recorded when a teammate saves the area, so it marks progress.
      const started = Boolean(current?.assigneeUserId);
      return [
        {
          ...base,
          status: started ? 'in-progress' : 'not-started',
          statusLabel: started ? '작성 중' : '작성 전',
        },
      ];
    },
  );
}
