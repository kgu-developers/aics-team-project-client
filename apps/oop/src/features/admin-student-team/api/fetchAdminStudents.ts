import { apiClient } from '@aics/api-client';

export type AdminStudent = {
  id: string;
  name: string;
  studentNumber: string;
  major: string;
  team: {
    id: string;
    name: string;
  } | null;
};

export async function fetchAdminStudents(sectionId: string) {
  const response = await apiClient.get<AdminStudent[]>(
    `/admin/sections/${sectionId}/students`,
  );

  return response.data;
}
