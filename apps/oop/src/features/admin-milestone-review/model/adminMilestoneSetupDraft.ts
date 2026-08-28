export type AdminMilestoneSectionScheduleDraft = {
  dueAt: {
    date: string;
    time: string;
  };
  isPublished: boolean;
  opensAt: {
    date: string;
    time: string;
  };
};

function createDateTimeDraft() {
  return { date: '', time: '' };
}

export function createAdminMilestoneSectionScheduleDraft(): AdminMilestoneSectionScheduleDraft {
  return {
    dueAt: createDateTimeDraft(),
    isPublished: false,
    opensAt: createDateTimeDraft(),
  };
}

export function syncAdminMilestoneSectionScheduleDrafts(
  sectionIds: readonly string[],
  currentDrafts: Readonly<Record<string, AdminMilestoneSectionScheduleDraft>>,
) {
  return Object.fromEntries(
    sectionIds.map(sectionId => [
      sectionId,
      currentDrafts[sectionId] ?? createAdminMilestoneSectionScheduleDraft(),
    ]),
  ) as Record<string, AdminMilestoneSectionScheduleDraft>;
}
