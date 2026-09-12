import type {
  RequiredArtifactDto,
  RequiredArtifactInput,
  RequiredArtifactsResponse,
} from '@aics/api-client';

const initialArtifactsByMilestoneId: Record<string, RequiredArtifactDto[]> = {
  '101': [
    {
      allowedExtensions: ['pdf'],
      id: 1001,
      label: '프로젝트 제안서',
      maxFileSizeMb: 20,
      required: true,
      type: 'FILE',
    },
    {
      id: 1002,
      label: '프로젝트 저장소 링크',
      required: true,
      type: 'LINK',
    },
  ],
  '102': [
    {
      allowedExtensions: ['pdf'],
      id: 1003,
      label: '중간 보고서',
      maxFileSizeMb: 20,
      required: true,
      type: 'FILE',
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
