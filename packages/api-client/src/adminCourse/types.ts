export type AdminOopCourseSemester = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';

export type AdminOopCourseStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type AdminOopCourseDto = {
  created_at?: string;
  id: number;
  name: string;
  semester: AdminOopCourseSemester;
  status: AdminOopCourseStatus;
  updated_at?: string;
  year: number;
};

export type AdminOopCourseInput = Pick<
  AdminOopCourseDto,
  'name' | 'semester' | 'status' | 'year'
>;

export type AdminOopCoursePersistResponse = {
  id: number;
};
