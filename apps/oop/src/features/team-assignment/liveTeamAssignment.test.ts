import type { SectionResponse, TeamKickoffResponse } from '@aics/core';
import { describe, expect, it } from 'vitest';

import {
  resolveContactVisibility,
  resolveLiveTeamAssignmentStage,
  toTeamAssignmentProjection,
} from './liveTeamAssignment';

const section: SectionResponse = {
  id: 1,
  code: 'CS101',
  name: '01',
  classTime: '월123',
  capacity: 40,
  contactVisibleFrom: '2026-09-10T10:00:00+09:00',
  contactVisibleUntil: '2026-09-11T10:00:00+09:00',
  courseId: 1,
  courseName: '객체지향프로그래밍',
  year: 2026,
  semester: 'FALL',
  status: 'ACTIVE',
};

const team: TeamKickoffResponse = {
  id: 4,
  name: '7조',
  members: [
    {
      id: 10,
      studentNumber: '20260001',
      name: '한가온',
      isLeader: false,
      projectRole: '프론트엔드',
    },
  ],
};

describe('resolveLiveTeamAssignmentStage', () => {
  it('팀 배정 후 연락처 공개 전에는 결과 확인 단계에 머문다', () => {
    expect(
      resolveLiveTeamAssignmentStage(
        section,
        team,
        Date.parse('2026-09-10T09:59:59+09:00'),
      ),
    ).toBe('result');
  });

  it('연락처 공개 시각부터 첫 만남 단계를 연다', () => {
    expect(
      resolveLiveTeamAssignmentStage(
        section,
        team,
        Date.parse('2026-09-10T10:00:00+09:00'),
      ),
    ).toBe('firstMeeting');
  });

  it('팀장 확정은 연락처 공개 시간과 관계없이 온보딩 완료로 본다', () => {
    const confirmedTeam = {
      ...team,
      members: [{ ...team.members[0]!, isLeader: true }],
    };

    expect(
      resolveLiveTeamAssignmentStage(
        section,
        confirmedTeam,
        Date.parse('2026-09-12T10:00:00+09:00'),
      ),
    ).toBe('completed');
  });

  it('팀장 없이 연락처 공개 기간이 지나면 종료 상태를 구분한다', () => {
    expect(
      resolveLiveTeamAssignmentStage(
        section,
        team,
        Date.parse('2026-09-11T10:00:01+09:00'),
      ),
    ).toBe('contactClosed');
  });
});

it('공개 시작이 없으면 결과 단계이며, 종료 시각이 없으면 시작 이후 공개를 유지한다', () => {
  expect(
    resolveLiveTeamAssignmentStage(
      { ...section, contactVisibleFrom: null },
      team,
    ),
  ).toBe('result');
  expect(
    resolveLiveTeamAssignmentStage(
      { ...section, contactVisibleUntil: null },
      team,
      Date.parse('2099-01-01'),
    ),
  ).toBe('firstMeeting');
});

describe('toTeamAssignmentProjection', () => {
  it('킥오프 응답을 기존 팀 화면이 사용하는 모델로 변환한다', () => {
    expect(
      toTeamAssignmentProjection(
        section,
        team,
        'result',
        Date.parse(section.contactVisibleFrom!) - 1,
      ),
    ).toMatchObject({
      sectionId: '1',
      phase: 'result',
      window: { nextAvailableAt: section.contactVisibleFrom },
      assignedTeam: {
        id: '4',
        name: '7조',
        members: [
          {
            id: '10',
            name: '한가온',
            studentNumber: '20260001',
            role: '프론트엔드',
          },
        ],
      },
      leaderConfirmation: {
        status: 'not-confirmed',
        isActionAvailable: false,
      },
    });
  });
  it('온보딩 시작 시각 이후에 팀장 선정이 가능하다', () => {
    expect(
      toTeamAssignmentProjection(
        section,
        team,
        'firstMeeting',
        Date.parse(section.contactVisibleFrom!),
      ).leaderConfirmation?.isActionAvailable,
    ).toBe(true);
    expect(
      toTeamAssignmentProjection(
        { ...section, contactVisibleFrom: null },
        team,
        'result',
      ).leaderConfirmation?.isActionAvailable,
    ).toBe(false);
  });
});

it('연락처는 시작·종료 경계를 포함하고 잘못된 종료값은 공개하지 않는다', () => {
  const start = Date.parse(section.contactVisibleFrom!);
  const end = Date.parse(section.contactVisibleUntil!);
  expect(resolveContactVisibility(section, start - 1)).toBe('upcoming');
  expect(resolveContactVisibility(section, start)).toBe('open');
  expect(resolveContactVisibility(section, end)).toBe('open');
  expect(resolveContactVisibility(section, end + 1)).toBe('closed');
  expect(
    resolveContactVisibility({ ...section, contactVisibleFrom: null }, end),
  ).toBe('unscheduled');
  expect(
    resolveContactVisibility(
      { ...section, contactVisibleUntil: 'invalid' },
      end,
    ),
  ).toBe('closed');
});
