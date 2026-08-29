import { describe, expect, it } from 'vitest';

import {
  createAdminMilestoneSectionScheduleDraft,
  syncAdminMilestoneSectionScheduleDrafts,
} from './adminMilestoneSetupDraft';

describe('syncAdminMilestoneSectionScheduleDrafts', () => {
  it('선택한 분반 수만큼 독립적인 일정 초안을 만든다', () => {
    const firstSectionDraft = createAdminMilestoneSectionScheduleDraft();
    firstSectionDraft.opensAt.date = '2026-09-01';
    firstSectionDraft.isPublished = true;

    const drafts = syncAdminMilestoneSectionScheduleDrafts(
      ['oop-01', 'oop-02'],
      { 'oop-01': firstSectionDraft },
    );

    expect(drafts).toEqual({
      'oop-01': firstSectionDraft,
      'oop-02': createAdminMilestoneSectionScheduleDraft(),
    });
    expect(drafts['oop-01']).not.toBe(drafts['oop-02']);
  });

  it('선택에서 제외한 분반의 일정 초안은 제거한다', () => {
    const drafts = syncAdminMilestoneSectionScheduleDrafts(['oop-02'], {
      'oop-01': createAdminMilestoneSectionScheduleDraft(),
      'oop-02': createAdminMilestoneSectionScheduleDraft(),
    });

    expect(drafts).toEqual({
      'oop-02': createAdminMilestoneSectionScheduleDraft(),
    });
  });

  it('분반별 제출 정책 초안을 독립적으로 보존한다', () => {
    const firstSectionDraft = {
      ...createAdminMilestoneSectionScheduleDraft(),
      allowLateSubmission: true,
      allowSubmissionEditBeforeDueAt: true,
    };
    const secondSectionDraft = createAdminMilestoneSectionScheduleDraft();

    const drafts = syncAdminMilestoneSectionScheduleDrafts(
      ['oop-01', 'oop-02'],
      {
        'oop-01': firstSectionDraft,
        'oop-02': secondSectionDraft,
      },
    );

    expect(drafts['oop-01']).toMatchObject({
      allowLateSubmission: true,
      allowSubmissionEditBeforeDueAt: true,
    });
    expect(drafts['oop-02']).toMatchObject({
      allowLateSubmission: false,
      allowSubmissionEditBeforeDueAt: false,
    });
  });
});
