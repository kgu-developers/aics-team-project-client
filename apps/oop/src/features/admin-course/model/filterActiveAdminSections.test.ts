import type { AdminOopCourseDto } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';
import { describe, expect, it } from 'vitest';

import { filterActiveAdminSections } from './filterActiveAdminSections';

const sections: CurrentUser['sections'] = [
  {
    code: 'ACTIVE-SECTION',
    courseId: 1,
    id: '1',
    name: '운영 강좌 운영 분반',
    role: 'PROFESSOR',
    status: 'ACTIVE',
  },
  {
    code: 'ARCHIVED-COURSE',
    courseId: 2,
    id: '2',
    name: '보관 강좌 운영 분반',
    role: 'PROFESSOR',
    status: 'ACTIVE',
  },
  {
    code: 'ARCHIVED-SECTION',
    courseId: 1,
    id: '3',
    name: '운영 강좌 보관 분반',
    role: 'PROFESSOR',
    status: 'ARCHIVED',
  },
  {
    code: 'UNKNOWN-COURSE',
    id: '4',
    name: '강좌를 확인할 수 없는 분반',
    role: 'PROFESSOR',
    status: 'ACTIVE',
  },
];

const courses: AdminOopCourseDto[] = [
  {
    id: 1,
    name: '운영 강좌',
    semester: 'FALL',
    status: 'ACTIVE',
    year: 2026,
  },
  {
    id: 2,
    name: '보관 강좌',
    semester: 'FALL',
    status: 'ARCHIVED',
    year: 2025,
  },
];

describe('filterActiveAdminSections', () => {
  it('분반과 상위 강좌가 모두 운영 중인 경우만 남긴다', () => {
    expect(filterActiveAdminSections(sections, courses)).toEqual([sections[0]]);
  });
});
