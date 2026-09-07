import type { CurrentUserSection, SectionResponse } from '@aics/core';
import { describe, expect, it } from 'vitest';

import { resolvePreSurveySectionId } from './resolvePreSurveySectionId';

import { getMockMySections } from '~/mocks/data/sections';
import { demoStudent } from '~/mocks/data/users';

const currentSection: CurrentUserSection = {
  id: 'oop-2026-2-01',
  code: 'OOP-01',
  name: '객체지향프로그래밍 01분반',
  role: 'STUDENT',
};

const section = (id: number, code: string): SectionResponse => ({
  id,
  code,
  name: `${id}분반`,
  classTime: '월123',
  capacity: 40,
  contactVisibleFrom: null,
  contactVisibleUntil: null,
  courseId: 1,
  courseName: '객체지향프로그래밍',
  year: 2026,
  semester: 'SPRING',
  status: 'ACTIVE',
});

describe('resolvePreSurveySectionId', () => {
  it('실제 데모 사용자의 legacy 분반을 분반 API의 숫자 ID에 연결한다', () => {
    expect(
      resolvePreSurveySectionId(
        demoStudent.sections[0],
        getMockMySections(demoStudent.studentNumber, { status: 'ACTIVE' }),
      ),
    ).toBe(1);
  });
  it('현재 사용자 분반 ID가 숫자면 서버 분반 목록의 같은 ID를 사용한다', () => {
    expect(
      resolvePreSurveySectionId({ ...currentSection, id: '2' }, [
        section(1, 'OOP-01'),
        section(2, 'OOP-02'),
      ]),
    ).toBe(2);
  });

  it('legacy ID는 분반 코드가 유일하게 일치하는 서버 ID로 해석한다', () => {
    expect(
      resolvePreSurveySectionId(currentSection, [
        section(1, 'OOP-01'),
        section(2, 'OOP-02'),
      ]),
    ).toBe(1);
  });

  it('분반 코드가 맞지 않는 유일 분반도 임의로 선택하지 않는다', () => {
    expect(
      resolvePreSurveySectionId(currentSection, [section(1, 'CS101')]),
    ).toBeUndefined();
  });

  it('여러 분반에서 ID와 코드가 모두 불명확하면 임의 ID를 고르지 않는다', () => {
    expect(
      resolvePreSurveySectionId(currentSection, [
        section(1, 'CS101'),
        section(2, 'CS102'),
      ]),
    ).toBeUndefined();
  });
});
