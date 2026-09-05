export type Section = {
  id: string;
  courseId: string;
  name: string;
};

export const sectionSemesters = ['SPRING', 'SUMMER', 'FALL', 'WINTER'] as const;

export type SectionSemester = (typeof sectionSemesters)[number];

export const sectionStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

export type SectionStatus = (typeof sectionStatuses)[number];

export type SectionResponse = {
  id: number;
  code: string;
  name: string;
  classTime: string;
  capacity: number;
  contactVisibleFrom: string | null;
  contactVisibleUntil: string | null;
  courseId: number;
  courseName: string;
  year: number;
  semester: SectionSemester;
  status: SectionStatus;
};

export type FetchMySectionsFilter = {
  status?: SectionStatus;
  year?: number;
  semester?: SectionSemester;
};

export type MySectionsResponse = {
  contents: SectionResponse[];
};
