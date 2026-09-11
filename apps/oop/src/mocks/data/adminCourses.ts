import type { AdminOopCourseDto, AdminOopCourseInput } from '@aics/api-client';

const initialCourses: AdminOopCourseDto[] = [
  {
    created_at: '2026-08-20T09:00:00',
    id: 1,
    name: '객체지향 프로그래밍',
    semester: 'FALL',
    status: 'ACTIVE',
    updated_at: '2026-09-01T10:00:00',
    year: 2026,
  },
  {
    created_at: '2026-08-22T09:00:00',
    id: 2,
    name: '웹 프로그래밍',
    semester: 'SPRING',
    status: 'DRAFT',
    updated_at: '2026-08-22T09:00:00',
    year: 2027,
  },
  {
    created_at: '2025-02-20T09:00:00',
    id: 3,
    name: '객체지향 프로그래밍',
    semester: 'FALL',
    status: 'ARCHIVED',
    updated_at: '2025-12-20T09:00:00',
    year: 2025,
  },
];

let courses = initialCourses.map(course => ({ ...course }));
let nextCourseId = 4;

export function getAdminCourses() {
  return courses.map(course => ({ ...course }));
}

export function getAdminCourse(courseId: number) {
  const course = courses.find(candidate => candidate.id === courseId);
  return course ? { ...course } : null;
}

export function createAdminCourse(input: AdminOopCourseInput) {
  const course: AdminOopCourseDto = {
    ...input,
    created_at: '2026-09-11T09:00:00',
    id: nextCourseId,
    updated_at: '2026-09-11T09:00:00',
  };
  nextCourseId += 1;
  courses = [...courses, course];
  return { ...course };
}

export function updateAdminCourse(
  courseId: number,
  input: AdminOopCourseInput,
) {
  const course = courses.find(candidate => candidate.id === courseId);
  if (!course) return null;

  Object.assign(course, input, { updated_at: '2026-09-11T09:10:00' });
  return { ...course };
}

export function removeAdminCourse(courseId: number) {
  const previousLength = courses.length;
  courses = courses.filter(course => course.id !== courseId);
  return courses.length !== previousLength;
}

export function resetAdminCoursesMockData() {
  courses = initialCourses.map(course => ({ ...course }));
  nextCourseId = 4;
}
