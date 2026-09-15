import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  CreateSectionAnnouncementInput,
  SectionAnnouncementListResponse,
  SectionAnnouncementResponse,
  UpdateSectionAnnouncementInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  getMockAuthenticatedAccount,
  mockCsrfResponseHeaders,
} from '../authSession';
import { getMockMySections } from '../data/sections';
import { studentNoticeAnnouncements } from '../data/studentNotices';

let announcements: SectionAnnouncementResponse[] = [
  ...studentNoticeAnnouncements,
];

function canManageAnnouncements(globalRole: string) {
  return globalRole === 'ASSISTANT' || globalRole === 'PROFESSOR';
}

export const studentNoticeHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(':sectionId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);

      if (!account) {
        return new HttpResponse(null, { status: 401 });
      }

      const sectionId = Number(params.sectionId);
      if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
        return HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '분반 ID 형식이 올바르지 않습니다.',
          },
          { status: 400 },
        );
      }

      const accessibleSections = getMockMySections(
        account.credentials.studentNumber,
        { status: 'ACTIVE' },
      );
      if (!accessibleSections.some(section => section.id === sectionId)) {
        return HttpResponse.json(
          {
            code: 'ACCESS_DENIED',
            message: '이 분반의 공지사항에 접근할 수 없습니다.',
          },
          { status: 403 },
        );
      }

      return HttpResponse.json<SectionAnnouncementListResponse>(
        {
          contents: announcements.filter(
            announcement => announcement.sectionId === sectionId,
          ),
        },
        { headers: mockCsrfResponseHeaders() },
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(':sectionId')}`,
    async ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const sectionId = Number(params.sectionId);
      const input = (await request.json()) as CreateSectionAnnouncementInput;

      if (!account) return new HttpResponse(null, { status: 401 });
      if (!canManageAnnouncements(account.user.globalRole)) {
        return HttpResponse.json(
          {
            code: 'ACCESS_DENIED',
            message: '공지사항을 등록할 권한이 없습니다.',
          },
          { status: 403 },
        );
      }
      if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
        return HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '분반 ID 형식이 올바르지 않습니다.',
          },
          { status: 400 },
        );
      }
      if (
        !input.title?.trim() ||
        !input.content?.trim() ||
        !input.publishedAt
      ) {
        return HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '제목, 내용, 게시일시는 필수입니다.',
          },
          { status: 400 },
        );
      }

      const created: SectionAnnouncementResponse = {
        id:
          Math.max(0, ...announcements.map(announcement => announcement.id)) +
          1,
        sectionId,
        title: input.title,
        content: input.content,
        publishedAt: input.publishedAt.replace('T', ' '),
      };
      announcements = [created, ...announcements];
      return HttpResponse.json(created, { status: 201 });
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.DETAIL(':announcementId')}`,
    async ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const announcementId = Number(params.announcementId);
      const input = (await request.json()) as UpdateSectionAnnouncementInput;

      if (!account) return new HttpResponse(null, { status: 401 });
      if (!canManageAnnouncements(account.user.globalRole)) {
        return HttpResponse.json(
          {
            code: 'ACCESS_DENIED',
            message: '공지사항을 수정할 권한이 없습니다.',
          },
          { status: 403 },
        );
      }
      const existing = announcements.find(
        announcement => announcement.id === announcementId,
      );
      if (!existing) {
        return HttpResponse.json(
          { code: 'NOTICE_NOT_FOUND', message: '공지사항을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }
      const updated = {
        ...existing,
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.content === undefined ? {} : { content: input.content }),
        ...(input.publishedAt === undefined
          ? {}
          : { publishedAt: input.publishedAt.replace('T', ' ') }),
      };
      announcements = announcements.map(announcement =>
        announcement.id === updated.id ? updated : announcement,
      );
      return HttpResponse.json(updated);
    },
  ),
];
