import type {
  AdminOopSectionDto,
  AdminOopSectionInput,
} from '@aics/api-client';

import { getAdminCourse } from './adminCourses';
import { addMockMySection, resetMockMySections } from './sections';
import { addDemoAdminSection, resetDemoAdminSections } from './users';

const professor = {
  email: 'admin@kgu.ac.kr',
  globalRole: 'ADMIN' as const,
  name: '관리자',
  phone: '010-0000-0000',
  studentNumber: '20260002',
};

type AdminSectionFixture = Omit<AdminOopSectionDto, 'course'> & {
  courseId: number;
};

const initialSections: AdminSectionFixture[] = [
  {
    capacity: 40,
    classTime: '월요일 1-2교시',
    code: 'OOP-01',
    courseId: 1,
    id: 1,
    name: 'OOP-01',
    professor,
  },
];

let sections = initialSections.map(section => ({ ...section }));
let nextSectionId = 2;

export function getAdminSections({
  courseId,
  professorId,
}: {
  courseId: number;
  professorId: string;
}) {
  const course = getAdminCourse(courseId);
  if (!course) return [];

  return sections
    .filter(
      section =>
        section.courseId === courseId &&
        section.professor.studentNumber === professorId,
    )
    .map(({ courseId: _, ...section }) => ({ ...section, course }));
}

export function getAdminSectionsByCourseId(courseId: number) {
  const course = getAdminCourse(courseId);
  if (!course) return [];

  return sections
    .filter(section => section.courseId === courseId)
    .map(({ courseId: _, ...section }) => ({ ...section, course }));
}

export function createAdminSection(input: AdminOopSectionInput) {
  const course = getAdminCourse(input.courseId);
  if (!course) return null;

  const section: AdminSectionFixture = {
    capacity: input.capacity,
    classTime: input.classTime,
    code: input.code,
    courseId: input.courseId,
    contactVisibleFrom: input.contactVisibleFrom,
    contactVisibleUntil: input.contactVisibleUntil,
    id: nextSectionId,
    name: input.code,
    professor: {
      ...professor,
      studentNumber: input.professorId,
    },
  };
  nextSectionId += 1;
  addDemoAdminSection({
    capacity: section.capacity,
    classTime: section.classTime,
    code: section.code,
    contactVisibleFrom: section.contactVisibleFrom ?? null,
    contactVisibleUntil: section.contactVisibleUntil ?? null,
    courseId: course.id,
    courseName: course.name,
    id: String(section.id),
    name: section.name,
    role: 'ASSISTANT',
    semester: course.semester,
    status: course.status,
    year: course.year,
  });
  addMockMySection(input.professorId, {
    capacity: section.capacity,
    classTime: section.classTime,
    code: section.code,
    courseId: course.id,
    courseName: course.name,
    id: section.id,
    name: section.name,
    semester: course.semester,
    status: course.status,
    year: course.year,
  });
  sections = [...sections, section];
  const { courseId: _, ...sectionDto } = section;
  return { ...sectionDto, course };
}

export function resetAdminSectionsMockData() {
  resetDemoAdminSections();
  resetMockMySections();
  sections = initialSections.map(section => ({ ...section }));
  nextSectionId = 2;
}
