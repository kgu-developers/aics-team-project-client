export type Project = {
  id: string;
  teamId: string;
  title: string;
  description?: string;
};

/** Basic persisted project fields available to the student home. */
export type TeamProjectResponse = {
  id: number;
  teamId: number;
  title?: string | null;
  description?: string | null;
};
