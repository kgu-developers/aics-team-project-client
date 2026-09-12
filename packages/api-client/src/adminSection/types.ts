import type { AdminOopCourseDto } from '../adminCourse/types';

export type { AdminOopCourseDto } from '../adminCourse/types';

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

export type AdminOopSectionInput = {
  capacity: number;
  classTime: string;
  code: string;
  contactVisibleFrom?: string;
  contactVisibleUntil?: string;
  courseId: number;
  professorId: string;
};

export type AdminOopSectionPersistResponse = {
  id: number;
};

export type AdminOopSectionsFilter =
  | { courseId: number }
  | {
      professorId: string;
      semester?: AdminOopCourseDto['semester'];
      status?: AdminOopCourseDto['status'];
      year?: number;
    };
