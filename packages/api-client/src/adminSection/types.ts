export type AdminOopCourseDto = {
  created_at?: string;
  id: number;
  name: string;
  semester: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  updated_at?: string;
  year: number;
};

export type AdminOopUserDto = {
  createdAt?: string;
  email: string;
  globalRole: 'ADMIN' | 'USER';
  name: string;
  phone: string;
  studentNumber: string;
  updatedAt?: string;
};

export type AdminOopSectionDto = {
  capacity: number;
  classTime: string;
  code: string;
  contactVisibleFrom?: string;
  contactVisibleUntil?: string;
  course: AdminOopCourseDto;
  id: number;
  name: string;
  professor: AdminOopUserDto;
};

export type AdminOopSectionsResponse = {
  contents: AdminOopSectionDto[];
};

export type AdminOopSectionsFilter = {
  courseId: number;
  professorId: string;
  semester?: AdminOopCourseDto['semester'];
  status?: AdminOopCourseDto['status'];
  year?: number;
};
