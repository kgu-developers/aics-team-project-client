import { adminStudentTeamHandlers } from './adminStudentTeams';
import { authHandlers } from './auth';
import { studentHomeHandlers } from './studentHome';

export const handlers = [
  ...authHandlers,
  ...studentHomeHandlers,
  ...adminStudentTeamHandlers,
];
