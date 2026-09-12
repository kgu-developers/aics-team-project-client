import type { FetchMySectionsFilter, SectionResponse } from '@aics/core';

const oopSectionOne: SectionResponse = {
  id: 1,
  code: '월8/1151',
  name: '01',
  classTime: '월123',
  capacity: 40,
  contactVisibleFrom: '2026-03-02T00:00:00',
  contactVisibleUntil: '2026-06-20T18:00:00',
  courseId: 1,
  courseName: '객체지향프로그래밍',
  year: 2026,
  semester: 'SPRING',
  status: 'ACTIVE',
};

const oopSectionTwo: SectionResponse = {
  ...oopSectionOne,
  id: 2,
  code: '화8/1151',
  name: '02',
  classTime: '화123',
};

const adminOopSection: SectionResponse = {
  ...oopSectionOne,
  code: 'OOP-01',
  name: 'OOP-01',
  semester: 'FALL',
};

const sectionsByStudentNumber: Readonly<Record<string, SectionResponse[]>> = {
  '20260001': [oopSectionOne],
  '20260002': [adminOopSection],
  '20260003': [oopSectionOne],
  '20260004': [oopSectionOne],
  '20260021': [oopSectionTwo],
};

let createdSectionsByStudentNumber: Record<string, SectionResponse[]> = {};

export function getMockMySections(
  studentNumber: string,
  filter: FetchMySectionsFilter,
) {
  return [
    ...(sectionsByStudentNumber[studentNumber] ?? []),
    ...(createdSectionsByStudentNumber[studentNumber] ?? []),
  ].filter(
    section =>
      (!filter.status || section.status === filter.status) &&
      (!filter.year || section.year === filter.year) &&
      (!filter.semester || section.semester === filter.semester),
  );
}

export function addMockMySection(
  studentNumber: string,
  section: SectionResponse,
) {
  createdSectionsByStudentNumber = {
    ...createdSectionsByStudentNumber,
    [studentNumber]: [
      ...(createdSectionsByStudentNumber[studentNumber] ?? []),
      section,
    ],
  };
}

export function resetMockMySections() {
  createdSectionsByStudentNumber = {};
}
