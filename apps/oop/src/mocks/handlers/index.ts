import { authHandlers } from './auth';
import { adminStudentTeamHandlers } from './adminStudentTeams';
import { studentHomeHandlers } from './studentHome';

export const handlers = [
  ...authHandlers,
  ...studentHomeHandlers,
  ...adminStudentTeamHandlers,
];
