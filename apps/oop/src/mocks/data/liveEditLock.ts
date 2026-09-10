import {
  liveEditLockTargetTypes,
  type LiveEditLockTargetType,
} from '@aics/core';

import { demoCurrentTeam, demoPartnerStudent, demoStudent } from './users';

export type LiveEditLockMockResource = {
  targetType: LiveEditLockTargetType;
  id: number;
  sectionId: string;
  studentNumbers: readonly string[];
};

export const liveEditLockMockResources: readonly LiveEditLockMockResource[] =
  liveEditLockTargetTypes.map(targetType => ({
    targetType,
    id: 19,
    sectionId: demoCurrentTeam.sectionId,
    studentNumbers: [
      demoStudent.studentNumber,
      demoPartnerStudent.studentNumber,
    ],
  }));
