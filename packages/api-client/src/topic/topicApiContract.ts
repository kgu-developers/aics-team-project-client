import type {
  TopicCandidateListResponse,
  TopicCandidatePersistResponse,
  TopicVotePersistResponse,
} from '@aics/core';

export function validateTopicId(id: string) {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    throw new Error('유효한 팀 또는 주제 후보 식별자가 필요합니다.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSafeId(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function validateTopicCandidate(
  value: unknown,
): asserts value is TopicCandidatePersistResponse {
  if (
    !isRecord(value) ||
    !isSafeId(value.id) ||
    typeof value.proposerUserId !== 'string' ||
    !value.proposerUserId.trim() ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string'
  ) {
    throw new Error('주제 후보 응답을 정확하게 확인할 수 없습니다.');
  }
}

export function validateTopicCandidates(
  value: unknown,
): asserts value is TopicCandidateListResponse {
  if (!isRecord(value) || !Array.isArray(value.contents)) {
    throw new Error('주제 후보 목록을 정확하게 확인할 수 없습니다.');
  }
  const ids = new Set<number>();
  for (const item of value.contents) {
    validateTopicCandidate(item);
    const candidate = item as unknown as Record<string, unknown>;
    if (
      typeof candidate.voteCount !== 'number' ||
      !Number.isSafeInteger(candidate.voteCount) ||
      candidate.voteCount < 0 ||
      typeof candidate.votedByMe !== 'boolean' ||
      ids.has(item.id)
    ) {
      throw new Error('주제 후보 투표 현황을 정확하게 확인할 수 없습니다.');
    }
    ids.add(item.id);
  }
}

export function validateTopicVote(
  value: unknown,
  candidateId: string,
): asserts value is TopicVotePersistResponse {
  if (
    !isRecord(value) ||
    !isSafeId(value.id) ||
    !isSafeId(value.candidateId) ||
    String(value.candidateId) !== candidateId ||
    typeof value.voterUserId !== 'string'
  ) {
    throw new Error('주제 투표 응답을 정확하게 확인할 수 없습니다.');
  }
}
