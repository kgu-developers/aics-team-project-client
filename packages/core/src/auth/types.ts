import type { SectionResponse } from '../section/types';
import type { Team } from '../team/types';

export type AuthLoginInput = {
  studentNumber: string;
  password: string;
};

export type AuthSessionRole = 'STUDENT' | 'ADMIN' | 'ASSISTANT';
export type AuthSessionResponse = { message: string; role?: AuthSessionRole };
export type AuthLoginResponse = AuthSessionResponse;
export type AuthRefreshResponse = AuthSessionResponse;
export type AuthLogoutResponse = AuthSessionResponse;
export type CurrentUserResponse = {
  studentNumber: string;
  email: string;
  name: string;
  phone: string;
  globalRole: 'ADMIN' | 'USER';
  sections?: SectionResponse[];
  teamId?: number | null;
};

export type UserGlobalRole = 'STUDENT' | 'ASSISTANT' | 'PROFESSOR';

export type CurrentUserSection = Partial<
  Omit<SectionResponse, 'code' | 'id' | 'name'>
> & {
  code: string;
  id: string;
  name: string;
  role: UserGlobalRole;
};

export type CurrentUser = {
  id: string;
  studentNumber: string;
  name: string;
  email: string;
  globalRole: UserGlobalRole;
  sections: CurrentUserSection[];
  /** Server identity; team details are resolved separately. */
  teamId?: string | null;
  currentTeam?: Team | null;
};
