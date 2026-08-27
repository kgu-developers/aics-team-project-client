import type { Team } from '../team/types';

export type AuthLoginInput = {
  studentNumber: string;
  password: string;
};

export type AuthLoginResponse = {
  accessToken: string;
};

export type UserGlobalRole = 'STUDENT' | 'ASSISTANT' | 'PROFESSOR';

export type CurrentUserSection = {
  id: string;
  code: string;
  name: string;
  role: 'STUDENT' | 'ASSISTANT';
};

export type CurrentUser = {
  id: string;
  studentNumber: string;
  name: string;
  email: string;
  globalRole: UserGlobalRole;
  sections: CurrentUserSection[];
  currentTeam?: Team | null;
};
