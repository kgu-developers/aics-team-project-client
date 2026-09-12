export type RequiredArtifactType = 'FILE' | 'LINK' | 'TEXT' | 'CHEERPJ_RUN';

export type RequiredArtifactDto = {
  allowedExtensions?: string[];
  id: number;
  label?: string;
  maxFileSizeMb?: number;
  required?: boolean;
  type?: RequiredArtifactType;
};

export type RequiredArtifactsResponse = {
  contents?: RequiredArtifactDto[];
};

export type RequiredArtifactInput = {
  allowedExtensions?: string[];
  label: string;
  maxFileSizeMb?: number;
  required: boolean;
  type: RequiredArtifactType;
};
