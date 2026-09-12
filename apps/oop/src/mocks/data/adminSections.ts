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
  {
    capacity: 35,
    classTime: '화요일 3-4교시',
    code: 'WEB-01',
    courseId: 2,
    id: 2,
    name: 'WEB-01',
    professor,
  },
];

let sections = initialSections.map(section => ({ ...section }));
let nextSectionId = 3;

export function getAdminSections({
  semester,
  status,
  year,
  professorId,
}: {
  professorId: string;
  semester?: AdminOopSectionDto['course']['semester'];
  status?: AdminOopSectionDto['course']['status'];
  year?: number;
}) {
  return sections
    .filter(section => section.professor.studentNumber === professorId)
    .flatMap(section => {
      const course = getAdminCourse(section.courseId);
      if (
        !course ||
        (semester && course.semester !== semester) ||
        (status && course.status !== status) ||
        (year && course.year !== year)
      )
        return [];
      return [
        {
          capacity: section.capacity,
          classTime: section.classTime,
          code: section.code,
          contactVisibleFrom: section.contactVisibleFrom,
          contactVisibleUntil: section.contactVisibleUntil,
          course,
          id: section.id,
          name: section.name,
          professor: section.professor,
        },
      ];
    });
}

export function getAdminSectionsByCourseId(courseId: number) {
  const course = getAdminCourse(courseId);
  if (!course) return [];

  return sections
    .filter(section => section.courseId === courseId)
    .map(section => ({
      capacity: section.capacity,
      classTime: section.classTime,
      code: section.code,
      contactVisibleFrom: section.contactVisibleFrom,
      contactVisibleUntil: section.contactVisibleUntil,
      course,
      id: section.id,
      name: section.name,
      professor: section.professor,
    }));
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
    contactVisibleFrom: section.contactVisibleFrom ?? null,
    contactVisibleUntil: section.contactVisibleUntil ?? null,
    courseId: course.id,
    courseName: course.name,
    id: section.id,
    name: section.name,
    semester: course.semester,
    status: course.status,
    year: course.year,
  });
  sections = [...sections, section];
  return {
    capacity: section.capacity,
    classTime: section.classTime,
    code: section.code,
    contactVisibleFrom: section.contactVisibleFrom,
    contactVisibleUntil: section.contactVisibleUntil,
    course,
    id: section.id,
    name: section.name,
    professor: section.professor,
  };
}

export function updateAdminSectionFixture(
  sectionId: number,
  input: Partial<AdminOopSectionInput>,
) {
  const index = sections.findIndex(section => section.id === sectionId);
  if (index < 0) return null;
  const section = {
    ...sections[index]!,
    ...input,
    courseId: input.courseId ?? sections[index]!.courseId,
  };
  sections = sections.map(item => (item.id === sectionId ? section : item));
  return (
    getAdminSectionsByCourseId(section.courseId).find(
      item => item.id === sectionId,
    ) ?? null
  );
}

export function resetAdminSectionsMockData() {
  resetDemoAdminSections();
  resetMockMySections();
  sections = initialSections.map(section => ({ ...section }));
  nextSectionId = 3;
}
