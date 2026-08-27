import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminNoticeDto = {
  date: string;
  id: string;
  section: string;
  title: string;
  writer: string;
};

export type AdminNoticeDetailDto = {
  attachment: string;
  content: readonly string[];
  createdAt: string;
  notice: AdminNoticeDto;
};

export async function fetchAdminNotice(noticeId: string) {
  const response = await apiClient.get<AdminNoticeDetailDto>(
    ENDPOINTS.ADMIN.NOTICE_DETAIL(noticeId),
  );

  return response.data;
}
