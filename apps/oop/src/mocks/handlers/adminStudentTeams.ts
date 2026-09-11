import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { Team } from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  adminStudentsFixture,
  adminTeamsFixture,
} from '../data/adminStudentTeams';
import { demoAdmin } from '../data/users';

const demoSectionId = 'oop-2026-2-01';
const adminSectionId = 1;
const withdrawnStudentNumbers = new Set<string>();
const teamImportPreviews = new Map<
  number,
  { fileName: string; sectionId: string }
>();
const enrollmentImportPreviews = new Map<
  number,
  { fileName: string; sectionId: string }
>();
const rosterImportStatusBySection = new Map<
  string,
  {
    studentRoster: { appliedAt: string; fileName: string } | null;
    teamRoster: { appliedAt: string; fileName: string } | null;
  }
>();
let nextTeamImportId = 1;
let nextEnrollmentImportId = 1;

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

        return {
          id: student.id,
          name: student.name,
          isLeader: student.isLeader,
        };
      }),
    }));
}

function getStudents(sectionId: string) {
  const normalizedSectionId = sectionId === '1' ? demoSectionId : sectionId;

  return adminStudentsFixture
    .filter(student => student.sectionId === normalizedSectionId)
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

function resolveFixtureSectionId(sectionId: string) {
  return sectionId === String(adminSectionId) ? demoSectionId : sectionId;
}

function getAdminTeamId(teamId: string) {
  const suffix = teamId.split('-').at(-1);
  const numericId = Number(suffix);

  if (!Number.isSafeInteger(numericId)) {
    throw new Error(`팀 fixture ID 형식이 올바르지 않습니다: ${teamId}`);
  }

  return numericId;
}

function getEnrollmentId(studentId: string) {
  const suffix = studentId.split('-').at(-1);
  const numericId = Number(suffix);

  if (!Number.isSafeInteger(numericId)) {
    throw new Error(`수강생 fixture ID 형식이 올바르지 않습니다: ${studentId}`);
  }

  return numericId;
}

function getAdminEnrollmentResponse(sectionId: string) {
  return {
    contents: adminStudentsFixture
      .filter(
        student => student.sectionId === resolveFixtureSectionId(sectionId),
      )
      .map(student => ({
        createdAt: '2026-09-08T15:15:06.644Z',
        email: `${student.studentNumber}@example.com`,
        id: getEnrollmentId(student.id),
        major: student.major,
        name: student.name,
        phone: '010-1234-5678',
        role: 'STUDENT',
        status: withdrawnStudentNumbers.has(student.studentNumber)
          ? 'WITHDRAWN'
          : 'ACTIVE',
        studentNumber: student.studentNumber,
      })),
  };
}

function getAdminSectionTeamsResponse(sectionId: string) {
  return {
    contents: adminTeamsFixture
      .filter(team => team.sectionId === resolveFixtureSectionId(sectionId))
      .map(team => ({
        createdAt: '2026-09-08T15:15:06.656Z',
        id: getAdminTeamId(team.id),
        kickoffRule: '매주 화요일 회고',
        meetingSchedule: '매주 목 19:00',
        name: team.name,
        status: 'FORMING',
      })),
  };
}

function getAdminTeamResponse(teamId: string) {
  const team = adminTeamsFixture.find(
    candidate => getAdminTeamId(candidate.id) === Number(teamId),
  );

  if (!team) return null;

  return {
    createdAt: '2026-09-08T15:15:06.663Z',
    id: getAdminTeamId(team.id),
    kickoffRule: '매주 화요일 회고',
    meetingSchedule: '매주 목 19:00',
    members: team.memberIds.flatMap(memberId => {
      const student = studentsById.get(memberId);

      if (!student || withdrawnStudentNumbers.has(student.studentNumber)) {
        return [];
      }

      return [
        {
          id: getEnrollmentId(student.id),
          isLeader: student.isLeader,
          name: student.name,
          projectRole: null,
          studentNumber: student.studentNumber,
        },
      ];
    }),
    name: team.name,
    sectionId: adminSectionId,
    status: 'FORMING',
  };
}

export function resetAdminStudentTeamMockState() {
  withdrawnStudentNumbers.clear();
  teamImportPreviews.clear();
  enrollmentImportPreviews.clear();
  rosterImportStatusBySection.clear();
  nextTeamImportId = 1;
  nextEnrollmentImportId = 1;
}

export const adminStudentTeamHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ROSTER_IMPORT_STATUS(
      ':sectionId',
    )}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const sectionId = params.sectionId;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (typeof sectionId !== 'string') {
        return HttpResponse.json(
          { code: 'SECTION_ID_REQUIRED', message: '분반 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      return HttpResponse.json(
        rosterImportStatusBySection.get(sectionId) ?? {
          studentRoster: null,
          teamRoster: null,
        },
      );
    },
  ),

  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ENROLLMENTS(':sectionId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const sectionId = params.sectionId;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (typeof sectionId !== 'string') {
        return HttpResponse.json(
          { code: 'SECTION_ID_REQUIRED', message: '분반 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      return HttpResponse.json(getAdminEnrollmentResponse(sectionId));
    },
  ),

  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ENROLLMENT(
      ':sectionId',
      ':studentNumber',
    )}`,
    async ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const sectionId = params.sectionId;
      const studentNumber = params.studentNumber;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (typeof sectionId !== 'string' || typeof studentNumber !== 'string') {
        return HttpResponse.json(
          {
            code: 'ENROLLMENT_ID_REQUIRED',
            message: '수강생 정보가 필요합니다.',
          },
          { status: 400 },
        );
      }

      const student = adminStudentsFixture.find(
        candidate =>
          candidate.sectionId === resolveFixtureSectionId(sectionId) &&
          candidate.studentNumber === studentNumber,
      );

      if (!student) {
        return HttpResponse.json(
          {
            code: 'ENROLLMENT_NOT_FOUND',
            message: '수강생을 찾을 수 없습니다.',
          },
          { status: 404 },
        );
      }

      const input = (await request.json()) as { status?: string };

      if (input.status === 'WITHDRAWN') {
        withdrawnStudentNumbers.add(student.studentNumber);
      }

      return HttpResponse.json(
        getAdminEnrollmentResponse(sectionId).contents.find(
          enrollment => enrollment.studentNumber === studentNumber,
        ),
      );
    },
  ),

  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAMS(':sectionId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const sectionId = params.sectionId;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (typeof sectionId !== 'string') {
        return HttpResponse.json(
          { code: 'SECTION_ID_REQUIRED', message: '분반 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      return HttpResponse.json(getAdminSectionTeamsResponse(sectionId));
    },
  ),

  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM(':teamId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const teamId = params.teamId;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (typeof teamId !== 'string') {
        return HttpResponse.json(
          { code: 'TEAM_ID_REQUIRED', message: '팀 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      const team = getAdminTeamResponse(teamId);

      if (!team) {
        return HttpResponse.json(
          { code: 'TEAM_NOT_FOUND', message: '팀을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json(team);
    },
  ),

  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.USER(':studentNumber')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const studentNumber = params.studentNumber;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const student = adminStudentsFixture.find(
        candidate => candidate.studentNumber === studentNumber,
      );

      if (!student) {
        return HttpResponse.json(
          { code: 'USER_NOT_FOUND', message: '수강생을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json({
        createdAt: '2026-09-08T15:13:03.631Z',
        email: `${student.studentNumber}@example.com`,
        globalRole: 'USER',
        name: student.name,
        phone: '010-1234-5678',
        studentNumber: student.studentNumber,
        updatedAt: '2026-09-08T15:13:03.631Z',
      });
    },
  ),

  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_IMPORT_PREVIEW(':sectionId')}`,
    async ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const sectionId = params.sectionId;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (typeof sectionId !== 'string') {
        return HttpResponse.json(
          { code: 'SECTION_ID_REQUIRED', message: '분반 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      let formData: FormData;

      try {
        formData = await request.formData();
      } catch {
        return HttpResponse.json(
          { code: 'INVALID_FILE', message: '엑셀 파일을 읽을 수 없습니다.' },
          { status: 400 },
        );
      }
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return HttpResponse.json(
          { code: 'FILE_REQUIRED', message: '엑셀 파일이 필요합니다.' },
          { status: 400 },
        );
      }

      const importId = nextTeamImportId++;

      teamImportPreviews.set(importId, { fileName: file.name, sectionId });

      return HttpResponse.json({
        importId,
        rows: adminStudentsFixture
          .filter(
            student => student.sectionId === resolveFixtureSectionId(sectionId),
          )
          .map((student, index) => ({
            grade: null,
            leader: student.isLeader,
            message: '이미 같은 팀에 편성되어 있습니다.',
            name: student.name,
            phoneNumber: null,
            projectRole: null,
            rowNumber: index + 2,
            status: 'DUPLICATE',
            studentNumber: student.studentNumber,
            teamName:
              adminTeamsFixture.find(team => team.id === student.teamId)
                ?.name ?? '',
          })),
        summary: {
          duplicate: adminStudentsFixture.filter(
            student => student.sectionId === resolveFixtureSectionId(sectionId),
          ).length,
          invalid: 0,
          teams: adminTeamsFixture.filter(
            team => team.sectionId === resolveFixtureSectionId(sectionId),
          ).length,
          total: adminStudentsFixture.filter(
            student => student.sectionId === resolveFixtureSectionId(sectionId),
          ).length,
          update: 0,
          valid: 0,
        },
      });
    },
  ),

  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_IMPORT_APPLY(':importId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const importId = Number(params.importId);
      const preview = teamImportPreviews.get(importId);

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (!preview) {
        return HttpResponse.json(
          {
            code: 'TEAM_IMPORT_NOT_FOUND',
            message: '미리보기 결과를 찾을 수 없습니다.',
          },
          { status: 404 },
        );
      }

      teamImportPreviews.delete(importId);
      rosterImportStatusBySection.set(preview.sectionId, {
        ...(rosterImportStatusBySection.get(preview.sectionId) ?? {
          studentRoster: null,
          teamRoster: null,
        }),
        teamRoster: {
          appliedAt: '2026-09-09T11:30:00Z',
          fileName: preview.fileName,
        },
      });

      return HttpResponse.json({
        appliedMembers: 0,
        createdTeams: 0,
        importId,
        skipped: adminStudentsFixture.filter(
          student =>
            student.sectionId === resolveFixtureSectionId(preview.sectionId),
        ).length,
      });
    },
  ),

  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ENROLLMENT_IMPORT_PREVIEW(
      ':sectionId',
    )}`,
    async ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const sectionId = params.sectionId;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (typeof sectionId !== 'string') {
        return HttpResponse.json(
          { code: 'SECTION_ID_REQUIRED', message: '분반 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      let formData: FormData;

      try {
        formData = await request.formData();
      } catch {
        return HttpResponse.json(
          { code: 'INVALID_FILE', message: '엑셀 파일을 읽을 수 없습니다.' },
          { status: 400 },
        );
      }
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return HttpResponse.json(
          { code: 'FILE_REQUIRED', message: '엑셀 파일이 필요합니다.' },
          { status: 400 },
        );
      }

      const importId = nextEnrollmentImportId++;
      const students = adminStudentsFixture.filter(
        student => student.sectionId === resolveFixtureSectionId(sectionId),
      );

      enrollmentImportPreviews.set(importId, {
        fileName: file.name,
        sectionId,
      });

      return HttpResponse.json({
        importId,
        rows: students.map((student, index) => ({
          email: `${student.studentNumber}@example.com`,
          message: '이미 등록된 수강생입니다.',
          name: student.name,
          phone: '010-1234-5678',
          role: 'STUDENT',
          rowNumber: index + 2,
          status: 'DUPLICATE',
          studentNumber: student.studentNumber,
        })),
        summary: {
          duplicate: students.length,
          invalid: 0,
          newUser: 0,
          total: students.length,
          valid: 0,
        },
      });
    },
  ),

  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.ENROLLMENT_IMPORT_APPLY(':importId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const importId = Number(params.importId);
      const preview = enrollmentImportPreviews.get(importId);

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (!preview) {
        return HttpResponse.json(
          {
            code: 'ENROLLMENT_IMPORT_NOT_FOUND',
            message: '미리보기 결과를 찾을 수 없습니다.',
          },
          { status: 404 },
        );
      }

      enrollmentImportPreviews.delete(importId);
      rosterImportStatusBySection.set(preview.sectionId, {
        ...(rosterImportStatusBySection.get(preview.sectionId) ?? {
          studentRoster: null,
          teamRoster: null,
        }),
        studentRoster: {
          appliedAt: '2026-09-09T11:30:00Z',
          fileName: preview.fileName,
        },
      });

      return HttpResponse.json({
        applied: 0,
        createdUsers: 0,
        importId,
        skipped: adminStudentsFixture.filter(
          student =>
            student.sectionId === resolveFixtureSectionId(preview.sectionId),
        ).length,
      });
    },
  ),

  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAMS_FINALIZE(':sectionId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const sectionId = params.sectionId;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (typeof sectionId !== 'string') {
        return HttpResponse.json(
          { code: 'SECTION_ID_REQUIRED', message: '분반 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      return HttpResponse.json(getAdminSectionTeamsResponse(sectionId));
    },
  ),

  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_STUDENTS(':sectionId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);

      if (account?.user.id !== demoAdmin.id) {
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
    const account = getMockAuthenticatedAccount(request);

    if (account?.user.id !== demoAdmin.id) {
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
