export type AdminSectionEnrollmentDto = {
  id: number;
  studentNumber: string;
  name: string;
  email: string;
  phone: string;
  major: string | null;
  role: 'STUDENT' | 'ASSISTANT';
  status: 'ACTIVE' | 'WITHDRAWN';
  createdAt: string;
};

export type AdminSectionEnrollmentsResponse = {
  contents: AdminSectionEnrollmentDto[];
};

export type AdminSectionEnrollmentCreatedResponse = {
  id: number;
};

export type UpdateAdminSectionEnrollmentInput = Partial<{
  role: 'STUDENT' | 'ASSISTANT';
  status: 'ACTIVE' | 'WITHDRAWN';
}>;
