import type { CurrentUser, SectionResponse } from '@aics/core';
import { describe, expect, it } from 'vitest';

import { resolveStudentContext } from './resolveStudentContext';

const section: SectionResponse = {
  id: 1,
  code: 'OOP-01',
  name: '01분반',
  status: 'ACTIVE',
  capacity: 40,
  classTime: '',
  contactVisibleFrom: null,
  contactVisibleUntil: null,
  courseId: 1,
  courseName: 'OOP',
  year: 2026,
  semester: 'FALL',
};
const user: CurrentUser = {
  id: 'student',
  studentNumber: '20260001',
  email: '',
  name: '학생',
  globalRole: 'STUDENT',
  teamId: '7',
  sections: [{ ...section, id: '1', role: 'STUDENT' }],
};
const input = { user, sections: [section], isPending: false, isError: false };

describe('student context attribution', () => {
  it('distinguishes pending, failure, no section, selection, no team, and ready', () => {
    expect(resolveStudentContext({ ...input, isPending: true })).toEqual({
      status: 'loading',
    });
    expect(resolveStudentContext({ ...input, isError: true })).toEqual({
      status: 'error',
    });
    expect(resolveStudentContext({ ...input, sections: [] })).toEqual({
      status: 'no-section',
    });
    expect(
      resolveStudentContext({ ...input, user: { ...user, teamId: null } })
        .status,
    ).toBe('no-team');
    expect(resolveStudentContext(input)).toEqual({
      status: 'ready',
      section,
      teamId: '7',
    });
    const multi = {
      ...user,
      sections: [...user.sections, { ...user.sections[0]!, id: '2' }],
    };
    expect(
      resolveStudentContext({
        ...input,
        user: multi,
        sections: [section, { ...section, id: 2 }],
      }),
    ).toEqual({ status: 'selection-required' });
  });
  it('never attributes a scalar team to one of several memberships, even if only one is active', () => {
    const multi = {
      ...user,
      sections: [
        ...user.sections,
        { ...user.sections[0]!, id: '2', status: 'ARCHIVED' as const },
      ],
    };
    expect(resolveStudentContext({ ...input, user: multi })).toEqual({
      status: 'ambiguous',
      section,
    });
    expect(
      resolveStudentContext({
        ...input,
        user: multi,
        sections: [section, { ...section, id: 2 }],
        selectedId: 2,
      }),
    ).toEqual({ status: 'ambiguous', section: { ...section, id: 2 } });
  });
  it('intersects selectable sections with identity membership and ignores foreign selections', () => {
    expect(
      resolveStudentContext({ ...input, sections: [{ ...section, id: 2 }] }),
    ).toEqual({ status: 'no-section' });
    expect(
      resolveStudentContext({
        ...input,
        sections: [section, { ...section, id: 2 }],
        selectedId: 2,
      }),
    ).toEqual({ status: 'ready', section, teamId: '7' });
  });
  it.each(['', '0', '-1', '07', 'NaN', '9223372036854775808'])(
    'blocks invalid team ID %s',
    teamId => {
      expect(
        resolveStudentContext({ ...input, user: { ...user, teamId } }),
      ).toEqual({ status: 'ambiguous', section });
    },
  );
  it('preserves the int64 maximum without converting to Number', () => {
    expect(
      resolveStudentContext({
        ...input,
        user: { ...user, teamId: '9223372036854775807' },
      }).teamId,
    ).toBe('9223372036854775807');
  });
});
