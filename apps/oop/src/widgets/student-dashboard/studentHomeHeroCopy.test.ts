import { describe, expect, it } from 'vitest';

import { getStudentHomeHeroCopy } from './studentHomeHeroCopy';

import { createStudentHomeDashboardPreview } from '~/mocks/data/studentHome';

describe('getStudentHomeHeroCopy', () => {
  it('활성 milestone 하나의 작업 문구를 히어로에 반영한다', () => {
    const dashboard = createStudentHomeDashboardPreview('proposal-feedback');

    expect(
      getStudentHomeHeroCopy(dashboard.hero, dashboard.milestones),
    ).toMatchObject({
      heading: '제안서 피드백을 반영해 주세요.',
      ctaLabel: dashboard.hero.ctaLabel,
    });
  });

  it('동시에 활성인 제안서 피드백과 중간보고서 작업을 하나의 히어로로 합성한다', () => {
    const dashboard = createStudentHomeDashboardPreview(
      'proposal-feedback-mid-report',
    );

    expect(
      getStudentHomeHeroCopy(dashboard.hero, dashboard.milestones),
    ).toMatchObject({
      heading: '제안서를 보완하고, 중간보고서를 작성하고 있어요.',
      description: '제안서 피드백 반영과 중간보고서 작성을 함께 진행해 주세요.',
      ctaLabel: dashboard.hero.ctaLabel,
    });
  });

  it('복수 활성 단계에는 각 라벨의 종성에 맞는 조사를 사용한다', () => {
    const dashboard = createStudentHomeDashboardPreview(
      'proposal-feedback-mid-report',
    );
    const milestones = dashboard.milestones.map(milestone =>
      milestone.id === 'mid-review'
        ? {
            ...milestone,
            id: 'presentation',
            currentStepLabel: '발표 평가',
          }
        : milestone,
    );

    expect(getStudentHomeHeroCopy(dashboard.hero, milestones)).toMatchObject({
      description: '제안서 피드백 반영과 발표 평가를 함께 진행해 주세요.',
    });
  });

  it('상세가 가능한 milestone이 없으면 서버 hero 문구를 유지한다', () => {
    const dashboard = createStudentHomeDashboardPreview('proposal-topic');
    const milestones = dashboard.milestones.map(milestone => ({
      ...milestone,
      isDetailAvailable: false,
    }));

    expect(getStudentHomeHeroCopy(dashboard.hero, milestones)).toBe(
      dashboard.hero,
    );
  });
});
