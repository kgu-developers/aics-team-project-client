import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  SectionAnnouncementListResponse,
  SectionAnnouncementResponse,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { seoulInstant } from '~/shared/lib/seoulInstant';

import { noticeId as id } from '~/features/admin-notices/noticeScope';

import {
  getMockAuthenticatedAccount,
  mockCsrfResponseHeaders,
} from '../authSession';
import { getMockEnrollments } from '../data/enrollments';
import { getMockMySections } from '../data/sections';
import { studentNoticeAnnouncements } from '../data/studentNotices';

let announcements = structuredClone(studentNoticeAnnouncements);
let nextAttachmentId = 1;
const uploadedAttachments = new Map<number, File>();
export function resetSectionAnnouncements() {
  announcements = structuredClone(studentNoticeAnnouncements);
  nextAttachmentId = 1;
  uploadedAttachments.clear();
}
function access(request: Request, sectionId: number, write = false) {
  const account = getMockAuthenticatedAccount(request);
  if (!account) return 401;
  const activeSection = getMockMySections(account.credentials.studentNumber, {
    status: 'ACTIVE',
  }).find(section => section.id === sectionId);
  const memberships = account.user.sections.filter(
    section =>
      id(section.id) === sectionId || section.code === activeSection?.code,
  );
  const professor = Boolean(
    activeSection && memberships.some(section => section.role === 'PROFESSOR'),
  );
  const enrolled = getMockEnrollments(account.credentials.studentNumber).some(
    enrollment =>
      enrollment.sectionId === sectionId && enrollment.status === 'ACTIVE',
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
    const formData = await request.formData();
    const requestPart = formData.get('request');
    if (requestPart == null) return undefined;
    // MSW/XHR can materialize a multipart JSON Blob as a string in jsdom,
    // whereas browsers preserve it as a Blob. Both represent the same part.
    const requestText =
      typeof requestPart === 'string' ? requestPart : await requestPart.text();
    const input: unknown = JSON.parse(requestText);
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return undefined;
    return {
      files: formData
        .getAll('files')
        .filter((part): part is File => part instanceof File),
      input: input as {
        title?: unknown;
        content?: unknown;
        publishedAt?: unknown;
        deleteAttachmentIds?: unknown;
      },
    };
  } catch {
    return undefined;
  }
}
function attachmentsFrom(files: File[]) {
  return files.map(file => {
    const id = nextAttachmentId++;
    uploadedAttachments.set(id, file);
    return {
      id,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      downloadUrl: `${API_BASE_URL}/api/v1/mock/announcements/attachments/${id}`,
    };
  });
}
function validPublishedAt(value: unknown) {
  return (
    value == null ||
    (typeof value === 'string' && Number.isFinite(seoulInstant(value)))
  );
}
export const studentNoticeHandlers = [
  http.get(
    `${API_BASE_URL}/api/v1/mock/announcements/attachments/:attachmentId`,
    ({ params, request }) => {
      if (!getMockAuthenticatedAccount(request)) return denied(401);
      const attachmentId = id(params.attachmentId);
      const file = attachmentId ? uploadedAttachments.get(attachmentId) : null;
      if (!file)
        return error(
          404,
          'SECTION_ANNOUNCEMENT_ATTACHMENT_NOT_FOUND',
          '해당 첨부파일을 찾을 수 없습니다.',
        );
      return new HttpResponse(file, {
        headers: {
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
          'Content-Type': file.type || 'application/octet-stream',
        },
      });
    },
  ),
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
              seoulInstant(item.publishedAt) <= Date.now(),
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
      const payload = await readInput(request);
      const input = payload?.input;
      if (
        !payload ||
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
        attachments: attachmentsFrom(payload.files),
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
      const payload = await readInput(request);
      const input = payload?.input;
      if (
        !payload ||
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
        input.publishedAt == null &&
        input.deleteAttachmentIds == null &&
        payload.files.length === 0
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
      if (input.deleteAttachmentIds != null) {
        if (
          !Array.isArray(input.deleteAttachmentIds) ||
          input.deleteAttachmentIds.some(value => !Number.isInteger(value))
        )
          return invalid();
        const deleted = new Set(input.deleteAttachmentIds);
        const existing = notice.attachments ?? [];
        if (
          input.deleteAttachmentIds.some(
            value => !existing.some(file => file.id === value),
          )
        )
          return error(
            404,
            'SECTION_ANNOUNCEMENT_ATTACHMENT_NOT_FOUND',
            '해당 첨부파일을 찾을 수 없습니다.',
          );
        notice.attachments = existing.filter(file => !deleted.has(file.id));
        input.deleteAttachmentIds.forEach(attachmentId =>
          uploadedAttachments.delete(attachmentId),
        );
      }
      if (input.title != null) notice.title = String(input.title);
      if (input.content != null) notice.content = String(input.content);
      if (input.publishedAt != null)
        notice.publishedAt = String(input.publishedAt);
      if (payload.files.length)
        notice.attachments = [
          ...(notice.attachments ?? []),
          ...attachmentsFrom(payload.files),
        ];
      return HttpResponse.json(notice, { headers: mockCsrfResponseHeaders() });
    },
  ),
];
