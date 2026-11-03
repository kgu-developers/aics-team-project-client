import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMessageRecipient = {
  leaderName: string | null;
  teamId: number;
  teamName: string;
};

export type AdminMessageRecipientsResponse = {
  contents: AdminMessageRecipient[];
};

export async function fetchAdminMessageRecipients(messageId: string | number) {
  const response = await apiClient.get<AdminMessageRecipientsResponse>(
    ENDPOINTS.ADMIN_MESSAGE.RECIPIENTS(messageId),
  );
  return response.data;
}
