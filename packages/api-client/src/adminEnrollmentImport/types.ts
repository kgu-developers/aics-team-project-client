export type AdminEnrollmentImportRowStatus =
  'VALID' | 'NEW_USER' | 'DUPLICATE' | 'INVALID';

export type AdminEnrollmentImportPreviewRowDto = {
  rowNumber: number;
  studentNumber: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: 'STUDENT' | 'ASSISTANT' | null;
  status: AdminEnrollmentImportRowStatus;
  message: string | null;
};

export type AdminEnrollmentImportPreviewResponse = {
  importId: number;
  summary: {
    total: number;
    valid: number;
    newUser: number;
    duplicate: number;
    invalid: number;
  };
  rows: AdminEnrollmentImportPreviewRowDto[];
};

export type ApplyAdminEnrollmentImportResponse = {
  importId: number;
  applied: number;
  createdUsers: number;
  skipped: number;
};
