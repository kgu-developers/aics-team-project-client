import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  SectionAnnouncementListResponse,
  SectionAnnouncementResponse,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  getMockAuthenticatedAccount,
  mockCsrfResponseHeaders,
} from '../authSession';
import { getMockMySections } from '../data/sections';
import { studentNoticeAnnouncements } from '../data/studentNotices';

let announcements = structuredClone(studentNoticeAnnouncements);
export function resetSectionAnnouncements() {
  announcements = structuredClone(studentNoticeAnnouncements);
}
function id(value: unknown) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}
function access(
  request: Request,
  sectionId: number | undefined,
  write = false,
) {
  const account = getMockAuthenticatedAccount(request);
  if (!account) return 401;
  const active = getMockMySections(account.credentials.studentNumber, {
    status: 'ACTIVE',
  }).some(section => section.id === sectionId);
  const professor = account.user.globalRole === 'PROFESSOR' && active;
  const enrolled = account.user.globalRole === 'STUDENT' && active;
  return (write ? professor : professor || enrolled) ? undefined : 403;
}
function invalid() {
  return HttpResponse.json(
    { code: 'INVALID_INPUT', message: '입력 값을 확인해 주세요.' },
    { status: 400 },
  );
}
function denied(status: number) {
  if (status === 401) return new HttpResponse(null, { status });
  return HttpResponse.json({ code: 'ACCESS_DENIED' }, { status });
}
function validText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}
export const studentNoticeHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(':sectionId')}`,
    ({ params, request }) => {
      if (!getMockAuthenticatedAccount(request)) return denied(401);
      const sectionId = id(params.sectionId);
      if (!sectionId) return invalid();
      const status = access(request, sectionId);
      if (status) return denied(status);
      return HttpResponse.json<SectionAnnouncementListResponse>(
        {
          contents: announcements.filter(
            item =>
              item.sectionId === sectionId &&
              new Date(item.publishedAt.replace(' ', 'T')).getTime() <=
                Date.now(),
          ),
        },
        { headers: mockCsrfResponseHeaders() },
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(':sectionId')}`,
    async ({ params, request }) => {
      if (!getMockAuthenticatedAccount(request)) return denied(401);
      const sectionId = id(params.sectionId);
      if (!sectionId) return invalid();
      const status = access(request, sectionId, true);
      if (status) return denied(status);
      const input = (await request.json()) as {
        title?: unknown;
        content?: unknown;
        publishedAt?: unknown;
      };
      if (
        !validText(input.title) ||
        String(input.title).length > 192 ||
        !validText(input.content)
      )
        return invalid();
      const publishedAt =
        input.publishedAt === undefined
          ? new Date().toISOString()
          : String(input.publishedAt);
      if (!Number.isFinite(Date.parse(publishedAt))) return invalid();
      const notice: SectionAnnouncementResponse = {
        id: Math.max(...announcements.map(item => item.id), 0) + 1,
        sectionId,
        title: String(input.title),
        content: String(input.content),
        publishedAt,
      };
      announcements.push(notice);
      return HttpResponse.json(notice, {
        status: 201,
        headers: mockCsrfResponseHeaders(),
      });
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.DETAIL(':id')}`,
    async ({ params, request }) => {
      if (!getMockAuthenticatedAccount(request)) return denied(401);
      const noticeId = id(params.id);
      if (!noticeId) return invalid();
      const notice = announcements.find(item => item.id === noticeId);
      // This ID-only route cannot authorize a missing record's section. Keep
      // missing and foreign records indistinguishable to non-owners.
      const status = access(request, notice?.sectionId, true);
      if (status) return denied(status);
      if (!notice) return denied(403);
      const input = (await request.json()) as {
        title?: unknown;
        content?: unknown;
        publishedAt?: unknown;
      };
      if (
        input.title === undefined &&
        input.content === undefined &&
        input.publishedAt === undefined
      )
        return invalid();
      if (
        input.title !== undefined &&
        (!validText(input.title) || String(input.title).length > 192)
      )
        return invalid();
      if (input.content !== undefined && !validText(input.content))
        return invalid();
      if (
        input.publishedAt !== undefined &&
        (typeof input.publishedAt !== 'string' ||
          !Number.isFinite(Date.parse(input.publishedAt)))
      )
        return invalid();
      if (input.title !== undefined) notice.title = String(input.title);
      if (input.content !== undefined) notice.content = String(input.content);
      if (input.publishedAt !== undefined)
        notice.publishedAt = String(input.publishedAt);
      return HttpResponse.json(notice, { headers: mockCsrfResponseHeaders() });
    },
  ),
];
