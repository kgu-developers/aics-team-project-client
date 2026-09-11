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
      const input = (await request.json()) as AdminOopCourseInput;
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
      const input = (await request.json()) as AdminOopCourseInput;
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
      return courseId && removeAdminCourse(courseId)
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json({ code: 'COURSE_NOT_FOUND' }, { status: 404 });
    },
  ),
];
