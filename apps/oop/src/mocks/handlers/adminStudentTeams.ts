import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { Team } from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  getMockAuthenticatedAccount,
  revokeMockAccountSession,
} from '../authSession';
import {
  adminStudentsFixture,
  adminTeamsFixture,
} from '../data/adminStudentTeams';
import { demoAdmin, demoUserAccounts } from '../data/users';

const demoSectionId = 'oop-2026-2-01';
const adminSectionId = 1;
const withdrawnStudentNumbers = new Set<string>();
const teamLeaderStudentNumbers = new Map<string, string>();
const teamIdByStudentNumber = new Map<string, string>();
const projectRoleBySectionStudent = new Map<string, string>();
const finalizedSectionIds = new Set<string>();
const createdUsers = new Map<
  string,
  { email: string; name: string; phone: string; studentNumber: string }
>();
const assistantEnrollmentsBySection = new Map<
  string,
  { email: string; name: string; phone: string; studentNumber: string }
>();
const withdrawnAssistantEnrollmentKeys = new Set<string>();
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

function getStudentTeamId(student: (typeof adminStudentsFixture)[number]) {
  return teamIdByStudentNumber.get(student.studentNumber) ?? student.teamId;
}

function getTeamStudents(teamId: string) {
  return adminStudentsFixture.filter(
    student => getStudentTeamId(student) === teamId,
  );
}

function getProjectRoleKey(sectionId: string, studentNumber: string) {
  return `${sectionId}:${studentNumber}`;
}

function getTeams(sectionId: string): Team[] {
  return adminTeamsFixture
    .filter(team => team.sectionId === sectionId)
    .map(team => ({
      id: team.id,
      sectionId: team.sectionId,
      name: team.name,
      members: getTeamStudents(team.id).map(student => ({
        id: student.id,
        name: student.name,
        isLeader:
          student.studentNumber ===
          (teamLeaderStudentNumbers.get(team.id) ??
            team.memberIds
              .map(memberId => studentsById.get(memberId))
              .find(candidate => candidate?.isLeader)?.studentNumber),
      })),
    }));
}

function getStudents(sectionId: string) {
  const normalizedSectionId = sectionId === '1' ? demoSectionId : sectionId;

  return adminStudentsFixture
    .filter(student => student.sectionId === normalizedSectionId)
    .map(student => {
      const teamId = getStudentTeamId(student);
      const team = teamId
        ? adminTeamsFixture.find(candidate => candidate.id === teamId)
        : null;

      if (teamId && !team) {
        throw new Error(`수강생의 팀 fixture를 찾을 수 없습니다: ${teamId}`);
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
  const assistantEnrollments = [...assistantEnrollmentsBySection.entries()]
    .filter(([key]) => key.startsWith(`${sectionId}:`))
    .filter(([key]) => !withdrawnAssistantEnrollmentKeys.has(key))
    .map(([, enrollment]) => enrollment);

  return {
    contents: [
      ...adminStudentsFixture
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
      ...assistantEnrollments.map((assistantEnrollment, index) => ({
        createdAt: '2026-09-14T20:30:00.000Z',
        email: assistantEnrollment.email,
        id: 999 + index,
        major: null,
        name: assistantEnrollment.name,
        phone: assistantEnrollment.phone,
        role: 'ASSISTANT' as const,
        status: 'ACTIVE' as const,
        studentNumber: assistantEnrollment.studentNumber,
      })),
    ],
  };
}

function getAssistantEnrollmentResponse(
  sectionId: string,
  studentNumber: string,
  status: 'ACTIVE' | 'WITHDRAWN',
) {
  const assistantEntries = [...assistantEnrollmentsBySection.entries()].filter(
    ([key]) => key.startsWith(`${sectionId}:`),
  );
  const assistantIndex = assistantEntries.findIndex(
    ([, enrollment]) => enrollment.studentNumber === studentNumber,
  );
  const assistant = assistantEntries[assistantIndex]?.[1];
  if (!assistant || assistantIndex < 0) return null;

  return {
    createdAt: '2026-09-14T20:30:00.000Z',
    email: assistant.email,
    id: 999 + assistantIndex,
    major: null,
    name: assistant.name,
    phone: assistant.phone,
    role: 'ASSISTANT' as const,
    status,
    studentNumber: assistant.studentNumber,
  };
}

function getAdminSectionTeamsResponse(sectionId: string) {
  const fixtureSectionId = resolveFixtureSectionId(sectionId);

  return {
    contents: adminTeamsFixture
      .filter(team => team.sectionId === fixtureSectionId)
      .map(team => ({
        createdAt: '2026-09-08T15:15:06.656Z',
        id: getAdminTeamId(team.id),
        kickoffRule: '매주 화요일 회고',
        meetingSchedule: '매주 목 19:00',
        name: team.name,
        status: finalizedSectionIds.has(fixtureSectionId)
          ? 'CONFIRMED'
          : 'FORMING',
      })),
  };
}

function getAdminTeamResponse(teamId: string) {
  const team = adminTeamsFixture.find(
    candidate => getAdminTeamId(candidate.id) === Number(teamId),
  );

  if (!team) return null;

  const leaderStudentNumber =
    teamLeaderStudentNumbers.get(team.id) ??
    getTeamStudents(team.id).find(student => student?.isLeader)?.studentNumber;

  return {
    createdAt: '2026-09-08T15:15:06.663Z',
    id: getAdminTeamId(team.id),
    kickoffRule: '매주 화요일 회고',
    meetingSchedule: '매주 목 19:00',
    members: getTeamStudents(team.id).flatMap(student => {
      if (!student || withdrawnStudentNumbers.has(student.studentNumber)) {
        return [];
      }

      return [
        {
          id: getEnrollmentId(student.id),
          isLeader: student.studentNumber === leaderStudentNumber,
          major: student.major,
          name: student.name,
          projectRole:
            projectRoleBySectionStudent.get(
              getProjectRoleKey(team.sectionId, student.studentNumber),
            ) ?? null,
          studentNumber: student.studentNumber,
        },
      ];
    }),
    name: team.name,
    sectionId: adminSectionId,
    status: finalizedSectionIds.has(String(team.sectionId))
      ? 'CONFIRMED'
      : 'FORMING',
  };
}

export function resetAdminStudentTeamMockState() {
  withdrawnStudentNumbers.clear();
  teamLeaderStudentNumbers.clear();
  teamIdByStudentNumber.clear();
  projectRoleBySectionStudent.clear();
  finalizedSectionIds.clear();
  createdUsers.clear();
  assistantEnrollmentsBySection.clear();
  withdrawnAssistantEnrollmentKeys.clear();
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

  http.post(`${API_BASE_URL}${ENDPOINTS.ADMIN.USERS}`, async ({ request }) => {
    const account = getMockAuthenticatedAccount(request);

    if (account?.user.id !== demoAdmin.id) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const input = (await request.json()) as {
      email: string;
      name: string;
      password: string;
      phone: string;
      studentNumber: string;
    };
    if (
      typeof input.password !== 'string' ||
      input.password.length < 8 ||
      input.password.length > 64
    ) {
      return HttpResponse.json(
        {
          code: 'INVALID_PASSWORD',
          message: '비밀번호는 8자 이상 64자 이하여야 합니다.',
        },
        { status: 400 },
      );
    }
    const exists =
      createdUsers.has(input.studentNumber) ||
      adminStudentsFixture.some(
        student => student.studentNumber === input.studentNumber,
      );

    if (exists) {
      return HttpResponse.json(
        { code: 'USER_ALREADY_EXISTS', message: '이미 존재하는 사용자입니다.' },
        { status: 409 },
      );
    }

    createdUsers.set(input.studentNumber, input);
    return HttpResponse.json(
      { studentNumber: input.studentNumber },
      { status: 201 },
    );
  }),

  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ENROLLMENTS(':sectionId')}`,
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

      const input = (await request.json()) as {
        role: string;
        studentNumber: string;
      };
      const fixtureUser = adminStudentsFixture.find(
        student => student.studentNumber === input.studentNumber,
      );
      const user =
        createdUsers.get(input.studentNumber) ??
        (fixtureUser
          ? {
              email: `${fixtureUser.studentNumber}@example.com`,
              name: fixtureUser.name,
              phone: '010-1234-5678',
              studentNumber: fixtureUser.studentNumber,
            }
          : undefined);

      if (input.role !== 'ASSISTANT' || !user) {
        return HttpResponse.json(
          { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
          { status: 404 },
        );
      }
      const enrollmentKey = `${sectionId}:${input.studentNumber}`;
      if (assistantEnrollmentsBySection.has(enrollmentKey)) {
        return HttpResponse.json(
          {
            code: 'ENROLLMENT_ALREADY_EXISTS',
            message: '이미 등록된 사용자입니다.',
          },
          { status: 409 },
        );
      }

      assistantEnrollmentsBySection.set(enrollmentKey, user);
      const enrollment = getAdminEnrollmentResponse(sectionId).contents.find(
        item => item.studentNumber === input.studentNumber,
      );
      return HttpResponse.json({ id: enrollment!.id }, { status: 201 });
    },
  ),

  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_MEMBER(
      ':teamId',
      ':studentNumber',
    )}`,
    async ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const teamId = params.teamId;
      const studentNumber = params.studentNumber;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }
      if (typeof teamId !== 'string' || typeof studentNumber !== 'string') {
        return HttpResponse.json(
          { code: 'TEAM_MEMBER_REQUIRED', message: '팀원 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      const team = adminTeamsFixture.find(
        candidate => getAdminTeamId(candidate.id) === Number(teamId),
      );
      const isMember = team?.id
        ? getTeamStudents(team.id).some(
            member => member.studentNumber === studentNumber,
          )
        : false;
      if (!team || !isMember) {
        return HttpResponse.json(
          {
            code: 'TEAM_MEMBER_NOT_FOUND',
            message: '팀원을 찾을 수 없습니다.',
          },
          { status: 404 },
        );
      }

      const input = (await request.json()) as {
        isLeader?: boolean;
        projectRole?: string;
        targetTeamId?: number;
      };
      const member = getTeamStudents(team.id).find(
        candidate => candidate.studentNumber === studentNumber,
      );
      if (!member) {
        return HttpResponse.json(
          {
            code: 'TEAM_MEMBER_NOT_FOUND',
            message: '팀원을 찾을 수 없습니다.',
          },
          { status: 404 },
        );
      }

      const sourceTeamId = getAdminTeamId(team.id);
      const targetTeamId = input.targetTeamId;
      const isMoving =
        Number.isSafeInteger(targetTeamId) && targetTeamId !== sourceTeamId;

      if (
        finalizedSectionIds.has(team.sectionId) &&
        (isMoving || input.projectRole !== undefined)
      ) {
        return HttpResponse.json(
          {
            code: 'TEAM_CONFIRMED',
            message: '확정된 팀의 역할과 팀 소속은 변경할 수 없습니다.',
          },
          { status: 409 },
        );
      }

      if (isMoving) {
        const targetTeam = adminTeamsFixture.find(
          candidate => getAdminTeamId(candidate.id) === targetTeamId,
        );
        const sourceLeader =
          teamLeaderStudentNumbers.get(team.id) ??
          team.memberIds
            .map(memberId => studentsById.get(memberId))
            .find(candidate => candidate?.isLeader)?.studentNumber;

        if (!targetTeam || targetTeam.sectionId !== team.sectionId) {
          return HttpResponse.json(
            {
              code: 'TEAM_MEMBER_SECTION_MISMATCH',
              message: '같은 분반의 팀으로만 이동할 수 있습니다.',
            },
            { status: 400 },
          );
        }
        if (
          finalizedSectionIds.has(team.sectionId) ||
          finalizedSectionIds.has(targetTeam.sectionId)
        ) {
          return HttpResponse.json(
            {
              code: 'TEAM_CONFIRMED',
              message: '확정된 팀의 팀원은 이동할 수 없습니다.',
            },
            { status: 409 },
          );
        }
        if (
          member.studentNumber === sourceLeader &&
          input.isLeader === undefined
        ) {
          return HttpResponse.json(
            {
              code: 'LEADER_MOVE_REQUIRES_EXPLICIT_ROLE',
              message: '팀장 이동 시 팀장 여부를 명시해야 합니다.',
            },
            { status: 400 },
          );
        }
        if (
          getTeamStudents(targetTeam.id).some(
            candidate => candidate.studentNumber === studentNumber,
          )
        ) {
          return HttpResponse.json(
            {
              code: 'TEAM_MEMBER_ALREADY_EXISTS',
              message: '대상 팀에 이미 속한 학생입니다.',
            },
            { status: 409 },
          );
        }

        teamIdByStudentNumber.set(studentNumber, targetTeam.id);
        if (member.studentNumber === sourceLeader && input.isLeader === false) {
          teamLeaderStudentNumbers.set(team.id, '');
        }
      }

      if (input.isLeader === true) {
        const updatedTeamId = isMoving ? targetTeamId : sourceTeamId;
        const updatedTeam = adminTeamsFixture.find(
          candidate => getAdminTeamId(candidate.id) === updatedTeamId,
        );
        if (updatedTeam) {
          teamLeaderStudentNumbers.set(updatedTeam.id, studentNumber);
        }
      }
      if (input.projectRole !== undefined) {
        if (input.projectRole.length > 50) {
          return HttpResponse.json(
            {
              code: 'PROJECT_ROLE_TOO_LONG',
              message: '프로젝트 역할은 50자 이하여야 합니다.',
            },
            { status: 400 },
          );
        }
        projectRoleBySectionStudent.set(
          getProjectRoleKey(team.sectionId, studentNumber),
          input.projectRole,
        );
      }
      const updatedMember = getAdminTeamResponse(
        String(isMoving ? targetTeamId : sourceTeamId),
      )?.members.find(member => member.studentNumber === studentNumber);

      return HttpResponse.json(updatedMember);
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

      const assistantEnrollmentKey = `${sectionId}:${studentNumber}`;
      const assistant = assistantEnrollmentsBySection.get(
        assistantEnrollmentKey,
      );
      if (!student && !assistant) {
        return HttpResponse.json(
          {
            code: 'ENROLLMENT_NOT_FOUND',
            message: '수강생을 찾을 수 없습니다.',
          },
          { status: 404 },
        );
      }

      const input = (await request.json()) as { status?: string };

      if (input.status === 'WITHDRAWN' && student) {
        withdrawnStudentNumbers.add(student.studentNumber);
      }
      if (input.status === 'WITHDRAWN' && assistant) {
        withdrawnAssistantEnrollmentKeys.add(assistantEnrollmentKey);
      }

      if (assistant) {
        return HttpResponse.json(
          getAssistantEnrollmentResponse(
            sectionId,
            studentNumber,
            input.status === 'WITHDRAWN' ? 'WITHDRAWN' : 'ACTIVE',
          ),
        );
      }

      return HttpResponse.json(
        getAdminEnrollmentResponse(sectionId).contents.find(
          enrollment => enrollment.studentNumber === studentNumber,
        ),
      );
    },
  ),

  http.put(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.USER(':studentNumber')}`,
    async ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const studentNumber = params.studentNumber;

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }
      if (typeof studentNumber !== 'string') {
        return HttpResponse.json(
          { code: 'USER_REQUIRED', message: '사용자 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      const input = (await request.json()) as {
        email?: string;
        name?: string;
        password?: string;
        phone?: string;
      };
      if (
        typeof input.email !== 'string' ||
        typeof input.name !== 'string' ||
        typeof input.phone !== 'string'
      ) {
        return HttpResponse.json(
          {
            code: 'INVALID_USER_INPUT',
            message: '사용자 정보를 확인해 주세요.',
          },
          { status: 400 },
        );
      }
      if (
        input.password !== undefined &&
        (typeof input.password !== 'string' ||
          input.password.length < 8 ||
          input.password.length > 64)
      ) {
        return HttpResponse.json(
          {
            code: 'INVALID_PASSWORD',
            message: '비밀번호는 8자 이상 64자 이하여야 합니다.',
          },
          { status: 400 },
        );
      }

      const fixtureUser = adminStudentsFixture.find(
        student => student.studentNumber === studentNumber,
      );
      const enrolledAssistant = [
        ...assistantEnrollmentsBySection.values(),
      ].find(enrollment => enrollment.studentNumber === studentNumber);
      const existingUser =
        createdUsers.get(studentNumber) ??
        enrolledAssistant ??
        (fixtureUser
          ? {
              email: `${fixtureUser.studentNumber}@example.com`,
              name: fixtureUser.name,
              phone: '010-1234-5678',
              studentNumber: fixtureUser.studentNumber,
            }
          : undefined);
      if (!existingUser) {
        return HttpResponse.json(
          { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
          { status: 404 },
        );
      }
      const updatedUser = { ...existingUser, ...input };
      createdUsers.set(studentNumber, updatedUser);
      [...assistantEnrollmentsBySection.entries()]
        .filter(([, enrollment]) => enrollment.studentNumber === studentNumber)
        .forEach(([key, enrollment]) => {
          assistantEnrollmentsBySection.set(key, { ...enrollment, ...input });
        });
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.USER_PASSWORD_RESET(':studentNumber')}`,
    ({ params, request }) => {
      const adminAccount = getMockAuthenticatedAccount(request);
      const studentNumber = params.studentNumber;

      if (adminAccount?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }
      if (typeof studentNumber !== 'string') {
        return HttpResponse.json(
          { code: 'USER_REQUIRED', message: '사용자 정보가 필요합니다.' },
          { status: 400 },
        );
      }

      const fixtureUser = adminStudentsFixture.some(
        student => student.studentNumber === studentNumber,
      );
      if (!fixtureUser && !createdUsers.has(studentNumber)) {
        return HttpResponse.json(
          { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      const studentAccount = demoUserAccounts.find(
        candidate => candidate.user.studentNumber === studentNumber,
      );
      if (studentAccount) revokeMockAccountSession(studentAccount);
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.delete(
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
      if (
        typeof studentNumber !== 'string' ||
        !createdUsers.has(studentNumber)
      ) {
        return HttpResponse.json(
          { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      createdUsers.delete(studentNumber);
      [...assistantEnrollmentsBySection.keys()]
        .filter(key => key.endsWith(`:${studentNumber}`))
        .forEach(key => assistantEnrollmentsBySection.delete(key));
      return new HttpResponse(null, { status: 204 });
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

      const createdUser =
        typeof studentNumber === 'string'
          ? createdUsers.get(studentNumber)
          : undefined;

      if (!student && !createdUser) {
        return HttpResponse.json(
          { code: 'USER_NOT_FOUND', message: '수강생을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json({
        createdAt: '2026-09-08T15:13:03.631Z',
        email: createdUser?.email ?? `${student!.studentNumber}@example.com`,
        globalRole: 'USER',
        name: createdUser?.name ?? student!.name,
        phone: createdUser?.phone ?? '010-1234-5678',
        studentNumber: createdUser?.studentNumber ?? student!.studentNumber,
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

      finalizedSectionIds.add(resolveFixtureSectionId(sectionId));
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
