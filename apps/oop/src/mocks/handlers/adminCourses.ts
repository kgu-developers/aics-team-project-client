import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminOopCourseInput,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  createAdminCourse,
  getAdminCourse,
  getAdminCourses,
  removeAdminCourse,
  updateAdminCourse,
} from '../data/adminCourses';

function guardAdmin(request: Request) {
  const account = getMockAuthenticatedAccount(request);
  if (!account) {
    return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (account.user.globalRole === 'STUDENT') {
    return HttpResponse.json({ code: 'COURSE_ACCESS_DENIED' }, { status: 403 });
  }
  return null;
}

function parseCourseId(value: string | readonly string[] | undefined) {
  const courseId = Number(value);
  return Number.isSafeInteger(courseId) && courseId > 0 ? courseId : null;
}

function isCourseInput(value: unknown): value is AdminOopCourseInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.name === 'string' &&
    input.name.trim().length > 0 &&
    typeof input.year === 'number' &&
    Number.isInteger(input.year) &&
    input.year > 0 &&
    ['SPRING', 'SUMMER', 'FALL', 'WINTER'].includes(String(input.semester)) &&
    ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(String(input.status))
  );
}

export const adminCourseHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSES}`, ({ request }) => {
    const errorResponse = guardAdmin(request);
    if (errorResponse) return errorResponse;
    return HttpResponse.json({ contents: getAdminCourses() });
  }),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSES}`,
    async ({ request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;
      const input: unknown = await request.json();
      if (!isCourseInput(input)) {
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
      }
      const course = createAdminCourse(input);
      return HttpResponse.json({ id: course.id }, { status: 201 });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSE(':courseId')}`,
    ({ params, request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;
      const courseId = parseCourseId(params.courseId);
      const course = courseId ? getAdminCourse(courseId) : null;
      return course
        ? HttpResponse.json(course)
        : HttpResponse.json({ code: 'COURSE_NOT_FOUND' }, { status: 404 });
    },
  ),
  http.put(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSE(':courseId')}`,
    async ({ params, request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;
      const courseId = parseCourseId(params.courseId);
      if (!courseId) {
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
      }
      const input: unknown = await request.json();
      if (!isCourseInput(input)) {
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
      }
      return updateAdminCourse(courseId, input)
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json({ code: 'COURSE_NOT_FOUND' }, { status: 404 });
    },
  ),
  http.delete(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSE(':courseId')}`,
    ({ params, request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;
      const courseId = parseCourseId(params.courseId);
      if (courseId === null) {
        return HttpResponse.json({ code: 'COURSE_NOT_FOUND' }, { status: 404 });
      }
      const course = getAdminCourse(courseId);
      if (!course) {
        return HttpResponse.json({ code: 'COURSE_NOT_FOUND' }, { status: 404 });
      }
      if (course.status !== 'DRAFT') {
        return HttpResponse.json(
          { code: 'COURSE_DELETE_NOT_ALLOWED' },
          { status: 409 },
        );
      }
      return removeAdminCourse(courseId)
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json({ code: 'COURSE_NOT_FOUND' }, { status: 404 });
    },
  ),
];
