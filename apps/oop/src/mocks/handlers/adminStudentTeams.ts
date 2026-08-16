import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { Team } from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  adminStudentsFixture,
  adminTeamsFixture,
} from '../data/adminStudentTeams';
import { demoAdminAccessToken } from '../data/users';

const studentsById = new Map(
  adminStudentsFixture.map(student => [student.id, student]),
);

function getTeams(sectionId: string): Team[] {
  return adminTeamsFixture
    .filter(team => team.sectionId === sectionId)
    .map(team => ({
      id: team.id,
      sectionId: team.sectionId,
      name: team.name,
      members: team.memberIds.map(memberId => {
        const student = studentsById.get(memberId);

        if (!student) {
          throw new Error(`팀원 fixture를 찾을 수 없습니다: ${memberId}`);
        }

        return { id: student.id, name: student.name };
      }),
    }));
}

function getStudents(sectionId: string) {
  return adminStudentsFixture
    .filter(student => student.sectionId === sectionId)
    .map(student => {
      const team = student.teamId
        ? adminTeamsFixture.find(candidate => candidate.id === student.teamId)
        : null;

      if (student.teamId && !team) {
        throw new Error(
          `수강생의 팀 fixture를 찾을 수 없습니다: ${student.teamId}`,
        );
      }

      return {
        id: student.id,
        name: student.name,
        studentNumber: student.studentNumber,
        major: student.major,
        team: team ? { id: team.id, name: team.name } : null,
      };
    });
}

export const adminStudentTeamHandlers = [
  http.get(
    `${API_BASE_URL}/admin/sections/:sectionId/students`,
    ({ params, request }) => {
      const authorization = request.headers.get('authorization');

      if (authorization !== `Bearer ${demoAdminAccessToken}`) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const sectionId = params.sectionId;

      if (typeof sectionId !== 'string') {
        return HttpResponse.json(
          { code: 'SECTION_ID_REQUIRED', message: '분반 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      if (sectionId === 'section-error') {
        return HttpResponse.json(
          {
            code: 'STUDENT_LOOKUP_FAILED',
            message: '수강생 목록을 불러오지 못했습니다.',
          },
          { status: 500 },
        );
      }

      if (sectionId === 'section-empty') {
        return HttpResponse.json([]);
      }

      return HttpResponse.json(getStudents(sectionId));
    },
  ),

  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.ROOT}`, ({ request }) => {
    const authorization = request.headers.get('authorization');

    if (authorization !== `Bearer ${demoAdminAccessToken}`) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const sectionId = new URL(request.url).searchParams.get('sectionId');

    if (!sectionId) {
      return HttpResponse.json(
        { code: 'SECTION_ID_REQUIRED', message: '분반 정보가 필요합니다.' },
        { status: 400 },
      );
    }

    if (sectionId === 'section-error') {
      return HttpResponse.json(
        {
          code: 'TEAM_LOOKUP_FAILED',
          message: '팀 목록을 불러오지 못했습니다.',
        },
        { status: 500 },
      );
    }

    if (sectionId === 'section-empty') {
      return HttpResponse.json([]);
    }

    return HttpResponse.json(getTeams(sectionId));
  }),
];
