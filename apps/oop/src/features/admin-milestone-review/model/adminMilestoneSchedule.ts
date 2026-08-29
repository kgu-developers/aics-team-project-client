import type { AdminMilestoneScheduleResponse } from '@aics/api-client';

export type AdminMilestoneScheduleView = {
  sections: AdminMilestoneScheduleSectionView[];
};

export type AdminMilestoneScheduleSectionView = {
  memberCountLabel: string;
  milestones: AdminMilestoneScheduleMilestoneView[];
  sectionId: string;
  sectionLabel: string;
  unreadMessageCountLabel: string;
};

export type AdminMilestoneScheduleMilestoneView = {
  id: string;
  isPublished: boolean;
  summary: string;
  title: string;
};

export function toAdminMilestoneScheduleView(
  response: AdminMilestoneScheduleResponse,
  accessibleSectionIds: readonly string[],
): AdminMilestoneScheduleView {
  const accessibleSectionIdSet = new Set(accessibleSectionIds);

  return {
    sections: response.sections
      .filter(section => accessibleSectionIdSet.has(section.sectionId))
      .map(section => ({
        memberCountLabel: section.memberCountLabel,
        milestones: section.milestones.map(milestone => ({ ...milestone })),
        sectionId: section.sectionId,
        sectionLabel: section.sectionLabel,
        unreadMessageCountLabel: section.unreadMessageCountLabel,
      })),
  };
}
