import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminOopCourseSemester,
  type AdminOopCourseStatus,
  type AdminOopSectionInput,
  type AdminOopSectionUpdateInput,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  createAdminSection,
  getAdminSections,
  getAdminSectionsByCourseId,
  updateAdminSectionFixture,
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

function invalidRequest() {
  return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseSectionId(value: string | readonly string[] | undefined) {
  const sectionId = Number(value);
  return Number.isSafeInteger(sectionId) && sectionId > 0 ? sectionId : null;
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

function isSectionUpdateInput(
  value: unknown,
): value is AdminOopSectionUpdateInput {
  if (!isRecord(value)) return false;
  const { capacity, classTime, code } = value;
  const keys = Object.keys(value);
  return (
    keys.length > 0 &&
    keys.every(key => ['capacity', 'classTime', 'code'].includes(key)) &&
    (capacity === undefined ||
      (typeof capacity === 'number' &&
        Number.isInteger(capacity) &&
        capacity > 0)) &&
    (classTime === undefined ||
      (typeof classTime === 'string' && classTime.trim().length > 0)) &&
    (code === undefined || (typeof code === 'string' && code.trim().length > 0))
  );
}

function isSectionInput(value: unknown): value is AdminOopSectionInput {
  if (!isRecord(value)) return false;
  return (
    typeof value.code === 'string' &&
    value.code.trim().length > 0 &&
    typeof value.classTime === 'string' &&
    value.classTime.trim().length > 0 &&
    typeof value.capacity === 'number' &&
    Number.isInteger(value.capacity) &&
    value.capacity > 0 &&
    typeof value.professorId === 'string' &&
    value.professorId.length > 0 &&
    typeof value.courseId === 'number' &&
    Number.isSafeInteger(value.courseId) &&
    value.courseId > 0
  );
}

function isContactVisibilityInput(
  value: unknown,
): value is { visibleFrom: string | null; visibleUntil: string | null } {
  if (!isRecord(value)) return false;
  const { visibleFrom, visibleUntil } = value;
  if (visibleFrom === null && visibleUntil === null) return true;
  return (
    typeof visibleFrom === 'string' &&
    typeof visibleUntil === 'string' &&
    !Number.isNaN(Date.parse(visibleFrom)) &&
    !Number.isNaN(Date.parse(visibleUntil)) &&
    Date.parse(visibleFrom) < Date.parse(visibleUntil)
  );
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
        return invalidRequest();
      }
      return HttpResponse.json({
        contents: getAdminSections({ professorId, semester, status, year }),
      });
    }
    return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
  }),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTIONS}`,
    async ({ request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;
      const input: unknown = await request.json();
      if (!isSectionInput(input)) return invalidRequest();
      const section = createAdminSection(input);
      return section
        ? HttpResponse.json({ id: section.id }, { status: 201 })
        : HttpResponse.json({ code: 'COURSE_NOT_FOUND' }, { status: 404 });
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION(':sectionId')}`,
    async ({ params, request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;
      const sectionId = parseSectionId(params.sectionId);
      const input: unknown = await request.json();
      if (!sectionId || !isSectionUpdateInput(input)) return invalidRequest();
      const section = updateAdminSectionFixture(sectionId, input);
      return section
        ? HttpResponse.json(section)
        : HttpResponse.json({ code: 'SECTION_NOT_FOUND' }, { status: 404 });
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION_CONTACT_VISIBILITY(':sectionId')}`,
    async ({ params, request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;
      const sectionId = parseSectionId(params.sectionId);
      const input: unknown = await request.json();
      if (!sectionId || !isContactVisibilityInput(input))
        return invalidRequest();
      const section = updateAdminSectionFixture(sectionId, {
        contactVisibleFrom: input.visibleFrom,
        contactVisibleUntil: input.visibleUntil,
      });
      return section
        ? HttpResponse.json(section)
        : HttpResponse.json({ code: 'SECTION_NOT_FOUND' }, { status: 404 });
    },
  ),
];
