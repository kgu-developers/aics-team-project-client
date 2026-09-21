import { describe, expect, it } from 'vitest';

import {
  createAdminMilestoneSectionScheduleDraftFromDto,
  createAdminMilestoneUpdateInput,
} from './adminMilestoneEdit';

describe('adminMilestoneEdit', () => {
  it('조회한 일정과 공개 상태를 수정 폼 초깃값으로 변환한다', () => {
    expect(
      createAdminMilestoneSectionScheduleDraftFromDto(
        {
          dueAt: '2026-09-10T23:59:00',
          evaluationClosesAt: '2026-09-14T23:59:00',
          evaluationOpensAt: '2026-09-12T09:00:00',
          lateSubmissionUntil: '2026-09-11T23:59:00',
          opensAt: '2026-09-01T09:00:00',
          revisionUntil: '2026-09-10T23:59:00',
        },
        'PUBLISHED',
        false,
        'PROPOSAL',
      ),
    ).toEqual({
      allowLateSubmission: true,
      allowSubmissionEditBeforeDueAt: false,
      dueAt: { date: '2026-09-10', time: '23:59' },
      evaluationClosesAt: { date: '2026-09-14', time: '23:59' },
      evaluationOpensAt: { date: '2026-09-12', time: '09:00' },
      isPublished: true,
      lateSubmissionUntil: { date: '2026-09-11', time: '23:59' },
      opensAt: { date: '2026-09-01', time: '09:00' },
      revisionUntil: '2026-09-10T23:59:00',
    });
  });

  it('상호평가 응답은 중첩 양식을 우선해 안전하게 기간을 복원한다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-10-20T23:59:00',
        evaluationClosesAt: '2026-10-19T23:59:00',
        evaluationOpensAt: '2026-10-11T09:00:00',
        opensAt: '2026-10-10T09:00:00',
      },
      'PUBLISHED',
      false,
      'PEER_EVALUATION',
      {
        anonymous: false,
        closesAt: '2026-10-21T23:59:00',
        id: 7,
        milestoneId: 3,
        opensAt: '2026-10-12T09:00:00',
        sectionId: 1,
      },
    );

    expect(schedule).toMatchObject({
      dueAt: { date: '2026-10-21', time: '23:59' },
      evaluationClosesAt: { date: '2026-10-21', time: '23:59' },
      evaluationOpensAt: { date: '2026-10-12', time: '09:00' },
      opensAt: { date: '2026-10-12', time: '09:00' },
    });
  });

  it('상호평가 수정은 기간 한 쌍만 검증하고 동일한 별칭과 익명 설정을 보낸다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-10-20T23:59:00',
        evaluationClosesAt: '2026-10-20T23:59:00',
        evaluationOpensAt: '2026-10-16T09:00:00',
        opensAt: '2026-10-16T09:00:00',
      },
      'DRAFT',
      false,
      'PEER_EVALUATION',
    );
    schedule.dueAt = { date: '', time: '' };
    schedule.opensAt = { date: '2027-01-01', time: '00:00' };

    expect(
      createAdminMilestoneUpdateInput({
        anonymous: false,
        description: ' 실명 상호 평가 ',
        schedule,
        title: ' 상호 평가 ',
        type: 'PEER_EVALUATION',
      }),
    ).toEqual({
      allowResubmissionBeforeDueAt: false,
      anonymous: false,
      description: '실명 상호 평가',
      schedule: {
        dueAt: '2026-10-20T23:59:00',
        evaluationClosesAt: '2026-10-20T23:59:00',
        evaluationOpensAt: '2026-10-16T09:00:00',
        opensAt: '2026-10-16T09:00:00',
      },
      title: '상호 평가',
      type: 'PEER_EVALUATION',
    });
  });

  it('폼에 없는 수정 마감(revisionUntil)은 그대로 되돌려 보내 PUT이 지우지 않게 한다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      { dueAt: '2026-09-10T23:59:00', revisionUntil: '2026-09-12T23:59:00' },
      'DRAFT',
      false,
      'PROPOSAL',
    );
    expect(
      createAdminMilestoneUpdateInput({
        description: '',
        schedule,
        title: '제안서',
        type: 'PROPOSAL',
      }).schedule,
    ).toEqual({
      dueAt: '2026-09-10T23:59:00',
      revisionUntil: '2026-09-12T23:59:00',
    });
  });

  it('폼에 없는 수정 마감이 잘못된 값이면 평가 기간을 검증할 수 없어 막는다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-09-10T23:59:00',
        evaluationClosesAt: '2026-09-13T09:00:00',
        evaluationOpensAt: '2026-09-12T09:00:00',
        revisionUntil: 'invalid',
      },
      'DRAFT',
      false,
      'PRESENTATION',
    );

    expect(() =>
      createAdminMilestoneUpdateInput({
        description: '',
        schedule,
        title: '발표',
        type: 'PRESENTATION',
      }),
    ).toThrow('수정 마감 일시를 확인해주세요.');
  });

  it.each([
    ['제출 마감', 'dueAt', '마일스톤 일정을 확인해주세요.'],
    ['지각 제출 마감', 'lateSubmissionUntil', '마일스톤 일정을 확인해주세요.'],
    ['수정 마감', 'revisionUntil', '수정 마감 일시를 확인해주세요.'],
  ] as const)(
    '달력에 없는 %s 일시는 발표 평가 선행 일시로 사용하지 않는다',
    (_label, field, message) => {
      const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
        {
          dueAt: '2026-02-28T12:00:00',
          evaluationClosesAt: '2026-03-04T00:00:00',
          evaluationOpensAt: '2026-03-03T00:00:00',
        },
        'DRAFT',
        false,
        'PRESENTATION',
      );

      if (field === 'revisionUntil') {
        schedule.revisionUntil = '2026-02-30T12:00:00';
      } else {
        schedule[field] = { date: '2026-02-30', time: '12:00' };
        if (field === 'lateSubmissionUntil')
          schedule.allowLateSubmission = true;
      }

      expect(() =>
        createAdminMilestoneUpdateInput({
          description: '',
          schedule,
          title: '발표',
          type: 'PRESENTATION',
        }),
      ).toThrow(message);
    },
  );

  it('발표 평가 시작이 자료 제출 마감보다 빠르면 서버에 보내기 전에 막는다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-09-10T23:59:00',
        evaluationClosesAt: '2026-09-12T23:59:00',
        evaluationOpensAt: '2026-09-09T09:00:00',
      },
      'DRAFT',
      false,
      'PRESENTATION',
    );
    expect(() =>
      createAdminMilestoneUpdateInput({
        description: '',
        schedule,
        title: '발표',
        type: 'PRESENTATION',
      }),
    ).toThrow('평가 시작 일시는 제출 마감 일시 이후여야 합니다');
  });

  it('발표 평가 시작이 지각 제출 마감보다 빠르면 막는다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-09-10T23:59:00',
        evaluationClosesAt: '2026-09-13T23:59:00',
        evaluationOpensAt: '2026-09-11T09:00:00',
        lateSubmissionUntil: '2026-09-11T23:59:00',
      },
      'DRAFT',
      false,
      'PRESENTATION',
    );
    expect(() =>
      createAdminMilestoneUpdateInput({
        description: '',
        schedule,
        title: '발표',
        type: 'PRESENTATION',
      }),
    ).toThrow('지각 제출·수정 마감 일시 이후여야 합니다');
  });

  it('수정 요청에는 주차 없이 변경 가능한 내용과 일정을 보낸다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      { dueAt: '2026-09-10T23:59:00' },
      'DRAFT',
      false,
      'PROPOSAL',
    );

    expect(
      createAdminMilestoneUpdateInput({
        description: ' 수정한 설명 ',
        schedule,
        title: ' 수정한 제안서 ',
        type: 'PROPOSAL',
      }),
    ).toEqual({
      allowResubmissionBeforeDueAt: false,
      description: '수정한 설명',
      schedule: { dueAt: '2026-09-10T23:59:00' },
      title: '수정한 제안서',
      type: 'PROPOSAL',
    });
  });

  it('지각 제출 마감일이 일반 제출 마감일보다 빠르면 수정하지 않는다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-09-10T23:59:00',
        lateSubmissionUntil: '2026-09-10T23:59:00',
      },
      'DRAFT',
      false,
      'PROPOSAL',
    );

    expect(() =>
      createAdminMilestoneUpdateInput({
        description: '',
        schedule,
        title: '제안서',
        type: 'PROPOSAL',
      }),
    ).toThrow('지각 제출 마감 일시는 제출 마감 일시보다 뒤여야 합니다.');
  });

  it('발표는 제출 마감과 평가 기간을 각각 저장한다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-11-20T18:00:00',
        evaluationClosesAt: '2026-11-25T18:00:00',
        evaluationOpensAt: '2026-11-21T18:00:00',
        opensAt: '2026-11-10T09:00:00',
      },
      'DRAFT',
      false,
      'PRESENTATION',
    );

    expect(schedule.evaluationOpensAt).toEqual({
      date: '2026-11-21',
      time: '18:00',
    });
    expect(schedule.evaluationClosesAt).toEqual({
      date: '2026-11-25',
      time: '18:00',
    });

    expect(
      createAdminMilestoneUpdateInput({
        description: '발표 평가',
        schedule,
        title: '발표 평가',
        type: 'PRESENTATION',
      }),
    ).toMatchObject({
      schedule: {
        dueAt: '2026-11-20T18:00:00',
        evaluationClosesAt: '2026-11-25T18:00:00',
        evaluationOpensAt: '2026-11-21T18:00:00',
        opensAt: '2026-11-10T09:00:00',
      },
    });
  });

  it('명시적 오프셋 일정은 서울 시각으로 복원하고 LocalDateTime으로 저장한다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-09-21T09:00:00Z',
        evaluationClosesAt: '2026-09-21T11:00:00Z',
        evaluationOpensAt: '2026-09-21T10:00:00Z',
        opensAt: '2026-09-20T23:00:00Z',
      },
      'DRAFT',
      false,
      'PRESENTATION',
    );

    expect(schedule).toMatchObject({
      dueAt: { date: '2026-09-21', time: '18:00' },
      evaluationClosesAt: { date: '2026-09-21', time: '20:00' },
      evaluationOpensAt: { date: '2026-09-21', time: '19:00' },
      opensAt: { date: '2026-09-21', time: '08:00' },
    });
    expect(
      createAdminMilestoneUpdateInput({
        description: '',
        schedule,
        title: '발표',
        type: 'PRESENTATION',
      }).schedule,
    ).toEqual({
      dueAt: '2026-09-21T18:00:00',
      evaluationClosesAt: '2026-09-21T20:00:00',
      evaluationOpensAt: '2026-09-21T19:00:00',
      opensAt: '2026-09-21T08:00:00',
    });
  });

  it('명시적 오프셋 수정 마감과 서울 평가 시작은 실제 시각으로 비교한다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-09-21T18:00:00',
        evaluationClosesAt: '2026-09-21T20:00:00',
        evaluationOpensAt: '2026-09-21T19:00:00',
        revisionUntil: '2026-09-21T10:30:00Z',
      },
      'DRAFT',
      false,
      'PRESENTATION',
    );

    expect(() =>
      createAdminMilestoneUpdateInput({
        description: '',
        schedule,
        title: '발표',
        type: 'PRESENTATION',
      }),
    ).toThrow('지각 제출·수정 마감 일시 이후여야 합니다');
  });
});
