import type {
  RequiredArtifactDto,
  RequiredArtifactInput,
  RequiredArtifactsResponse,
} from '@aics/api-client';

const initialArtifactsByMilestoneId: Record<string, RequiredArtifactDto[]> = {
  '103': [
    {
      allowedExtensions: ['pdf'],
      id: 1005,
      label: '프레젠테이션 자료',
      maxFileSizeMb: 100,
      required: true,
      type: 'FILE',
    },
    {
      id: 1006,
      label: '시연 영상',
      required: true,
      type: 'LINK',
    },
  ],
  '106': [
    {
      allowedExtensions: ['pdf'],
      id: 1005,
      label: '프레젠테이션 자료',
      maxFileSizeMb: 100,
      required: true,
      type: 'FILE',
    },
    {
      id: 1006,
      label: '시연 영상',
      required: true,
      type: 'LINK',
    },
  ],
  '104': [
    {
      allowedExtensions: ['pdf', 'zip'],
      id: 1004,
      label: '최종 보고서 및 산출물',
      maxFileSizeMb: 50,
      required: true,
      type: 'FILE',
    },
  ],
};

const artifactsByMilestoneId = structuredClone(initialArtifactsByMilestoneId);
let nextRequiredArtifactId = 2000;

export function resetAdminRequiredArtifactsFixture() {
  for (const milestoneId of Object.keys(artifactsByMilestoneId)) {
    delete artifactsByMilestoneId[milestoneId];
  }
  Object.assign(
    artifactsByMilestoneId,
    structuredClone(initialArtifactsByMilestoneId),
  );
  nextRequiredArtifactId = 2000;
}

export function getAdminRequiredArtifactsFixture(
  milestoneId: string,
): RequiredArtifactsResponse {
  return {
    contents: structuredClone(artifactsByMilestoneId[milestoneId] ?? []),
  };
}

export function createAdminRequiredArtifactFixture(
  milestoneId: string,
  input: RequiredArtifactInput,
) {
  const artifact: RequiredArtifactDto = {
    ...input,
    id: nextRequiredArtifactId++,
  };
  const artifacts = artifactsByMilestoneId[milestoneId] ?? [];
  artifacts.push(artifact);
  artifactsByMilestoneId[milestoneId] = artifacts;
  return artifact;
}

export function updateAdminRequiredArtifactFixture(
  milestoneId: string,
  requiredArtifactId: string,
  input: RequiredArtifactInput,
) {
  const artifact = artifactsByMilestoneId[milestoneId]?.find(
    candidate => candidate.id === Number(requiredArtifactId),
  );
  if (!artifact) return undefined;

  Object.assign(artifact, input);
  if (input.type !== 'FILE') {
    delete artifact.allowedExtensions;
    delete artifact.maxFileSizeMb;
  }
  return artifact;
}

export function removeAdminRequiredArtifactFixture(
  milestoneId: string,
  requiredArtifactId: string,
) {
  const artifacts = artifactsByMilestoneId[milestoneId];
  if (!artifacts) return false;

  const index = artifacts.findIndex(
    candidate => candidate.id === Number(requiredArtifactId),
  );
  if (index < 0) return false;

  artifacts.splice(index, 1);
  return true;
}
