import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeAdminNoticeAttachment(noticeId: string) {
  await apiClient.delete(ENDPOINTS.ADMIN.NOTICE_ATTACHMENT(noticeId));
}
