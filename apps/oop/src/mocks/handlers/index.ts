import { authHandlers } from './auth';
import { studentHomeHandlers } from './studentHome';
import { teamAssignmentHandlers } from './teamAssignment';

export const handlers = [
  ...authHandlers,
  ...studentHomeHandlers,
  ...teamAssignmentHandlers,
];
