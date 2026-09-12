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
  contactVisibleFrom?: string | null;
  contactVisibleUntil?: string | null;
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
  contactVisibleFrom?: string | null;
  contactVisibleUntil?: string | null;
  courseId: number;
  professorId: string;
};

export type AdminOopSectionPersistResponse = {
  id: number;
};

export type AdminOopSectionUpdateInput = Partial<
  Pick<
    AdminOopSectionInput,
    'capacity' | 'classTime' | 'code' | 'courseId' | 'professorId'
  >
>;

export type AdminOopSectionContactVisibilityInput = {
  visibleFrom: string | null;
  visibleUntil: string | null;
};

export type AdminOopSectionsFilter =
  | { courseId: number }
  | {
      professorId: string;
      semester?: AdminOopCourseDto['semester'];
      status?: AdminOopCourseDto['status'];
      year?: number;
    };
