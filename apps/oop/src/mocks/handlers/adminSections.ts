import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminOopCourseSemester,
  type AdminOopCourseStatus,
  type AdminOopSectionInput,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  createAdminSection,
  getAdminSections,
  getAdminSectionsByCourseId,
} from '../data/adminSections';

function guardAdmin(request: Request) {
  const account = getMockAuthenticatedAccount(request);
  if (!account) {
    return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (account.user.globalRole === 'STUDENT') {
    return HttpResponse.json(
      { code: 'SECTION_ACCESS_DENIED' },
      { status: 403 },
    );
  }
  return null;
}

function parseSemester(
  value: string | null,
): AdminOopCourseSemester | undefined {
  if (!value) return undefined;
  return ['SPRING', 'SUMMER', 'FALL', 'WINTER'].includes(value)
    ? (value as AdminOopCourseSemester)
    : undefined;
}

function parseStatus(value: string | null): AdminOopCourseStatus | undefined {
  if (!value) return undefined;
  return ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(value)
    ? (value as AdminOopCourseStatus)
    : undefined;
}

function parseYear(value: string | null) {
  if (!value) return undefined;
  const year = Number(value);
  return Number.isSafeInteger(year) && year > 0 ? year : undefined;
}

export const adminSectionHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTIONS}`, ({ request }) => {
    const errorResponse = guardAdmin(request);
    if (errorResponse) return errorResponse;
    const url = new URL(request.url);
    const courseIdParam = url.searchParams.get('courseId');
    const courseId = Number(courseIdParam);
    const professorId = url.searchParams.get('professorId');
    if (courseIdParam && professorId) {
      return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
    }
    if (courseIdParam) {
      if (!Number.isSafeInteger(courseId) || courseId < 1) {
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
      }
      return HttpResponse.json({
        contents: getAdminSectionsByCourseId(courseId),
      });
    }
    if (professorId) {
      const semesterParam = url.searchParams.get('semester');
      const statusParam = url.searchParams.get('status');
      const yearParam = url.searchParams.get('year');
      const semester = parseSemester(semesterParam);
      const status = parseStatus(statusParam);
      const year = parseYear(yearParam);
      if (
        (semesterParam && !semester) ||
        (statusParam && !status) ||
        (yearParam && !year)
      ) {
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
      }
      return HttpResponse.json({
        contents: getAdminSections({
          professorId,
          semester,
          status,
          year,
        }),
      });
    }
    return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
  }),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTIONS}`,
    async ({ request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;
      const input = (await request.json()) as AdminOopSectionInput;
      if (
        !input.code?.trim() ||
        !input.classTime?.trim() ||
        !Number.isInteger(input.capacity) ||
        input.capacity < 1 ||
        !input.professorId ||
        !Number.isSafeInteger(input.courseId)
      ) {
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
      }
      const section = createAdminSection(input);
      return section
        ? HttpResponse.json({ id: section.id }, { status: 201 })
        : HttpResponse.json({ code: 'COURSE_NOT_FOUND' }, { status: 404 });
    },
  ),
];
