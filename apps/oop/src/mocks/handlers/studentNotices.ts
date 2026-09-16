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
function access(request: Request, sectionId: number, write = false) {
  const account = getMockAuthenticatedAccount(request);
  if (!account) return 401;
  const activeSection = getMockMySections(account.credentials.studentNumber, {
    status: 'ACTIVE',
  }).find(section => section.id === sectionId);
  const memberships = account.user.sections.filter(
    section =>
      Number(section.id) === sectionId || section.code === activeSection?.code,
  );
  const professor = Boolean(
    activeSection && memberships.some(section => section.role === 'PROFESSOR'),
  );
  // Enrollment is a section relationship; the global ASSISTANT role alone is not membership.
  const enrolled = Boolean(
    activeSection && memberships.some(section => section.role === 'STUDENT'),
  );
  return (write ? professor : professor || enrolled) ? undefined : 403;
}
function error(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}
function invalid() {
  return error(400, 'INVALID_INPUT', '유효한 입력 형식이 아닙니다.');
}
function denied(status: number) {
  return status === 401
    ? error(401, 'UNAUTHORIZED', '인증이 필요합니다.')
    : error(403, 'ACCESS_DENIED', '접근 권한이 없습니다.');
}
function validText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}
async function readInput(request: Request) {
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return undefined;
    return input as {
      title?: unknown;
      content?: unknown;
      publishedAt?: unknown;
    };
  } catch {
    return undefined;
  }
}
function publishedTime(value: string) {
  const normalized = value.replace(' ', 'T');
  return Date.parse(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(normalized)
      ? `${normalized}+09:00`
      : normalized,
  );
}
function validPublishedAt(value: unknown) {
  return (
    value == null ||
    (typeof value === 'string' && Number.isFinite(publishedTime(value)))
  );
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
              publishedTime(item.publishedAt) <= Date.now(),
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
      // Spring parses/validates the DTO before the facade checks ownership.
      const input = await readInput(request);
      if (
        !input ||
        !validText(input.title) ||
        String(input.title).length > 192 ||
        !validText(input.content) ||
        !validPublishedAt(input.publishedAt)
      )
        return invalid();
      const status = access(request, sectionId, true);
      if (status) return denied(status);
      const notice: SectionAnnouncementResponse = {
        id: Math.max(...announcements.map(item => item.id), 0) + 1,
        sectionId,
        title: String(input.title),
        content: String(input.content),
        publishedAt:
          input.publishedAt == null
            ? new Date().toISOString()
            : String(input.publishedAt),
      };
      announcements = [notice, ...announcements];
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
      const input = await readInput(request);
      if (
        !input ||
        (input.title != null &&
          (typeof input.title !== 'string' || input.title.length > 192)) ||
        (input.content != null && typeof input.content !== 'string') ||
        !validPublishedAt(input.publishedAt)
      )
        return invalid();
      // The deployed facade looks up the record before checking its professor.
      const notice = announcements.find(item => item.id === noticeId);
      if (!notice)
        return error(
          404,
          'SECTION_ANNOUNCEMENT_NOT_FOUND',
          '해당 공지사항을 찾을 수 없습니다.',
        );
      const status = access(request, notice.sectionId, true);
      if (status) return denied(status);
      if (
        input.title == null &&
        input.content == null &&
        input.publishedAt == null
      )
        return error(
          400,
          'SECTION_ANNOUNCEMENT_EMPTY_UPDATE',
          '수정할 내용이 없습니다.',
        );
      if (
        (input.title != null && !validText(input.title)) ||
        (input.content != null && !validText(input.content))
      )
        return error(
          400,
          'SECTION_ANNOUNCEMENT_INVALID_CONTENT',
          '제목과 내용은 공백일 수 없습니다.',
        );
      if (input.title != null) notice.title = String(input.title);
      if (input.content != null) notice.content = String(input.content);
      if (input.publishedAt != null)
        notice.publishedAt = String(input.publishedAt);
      return HttpResponse.json(notice, { headers: mockCsrfResponseHeaders() });
    },
  ),
];
