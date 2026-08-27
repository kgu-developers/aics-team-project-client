import { apiClient } from '../client';
import type { AdminNoticeDto } from './fetchAdminNotice';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminNoticesResponse = {
  notices: AdminNoticeDto[];
  pageSize: number;
  sectionFilters: string[];
};

export async function fetchAdminNotices() {
  const response = await apiClient.get<AdminNoticesResponse>(
    ENDPOINTS.ADMIN.NOTICES,
  );

  return response.data;
}
