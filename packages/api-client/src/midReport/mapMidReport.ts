import {
  midReportBlockKeys,
  type MidReport,
  type MidReportBlockKey,
} from '@aics/core';

const fieldKeys: Record<MidReportBlockKey, string[]> = {
  topic: ['title', 'description'],
  'gui-design': ['guiScreens'],
  'engine-design': ['features', 'architecture', 'testCases'],
  'project-plan': ['completed', 'inProgress', 'remaining', 'help'],
};
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const date = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
const id = (value: unknown) =>
  (typeof value === 'string' &&
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value))) ||
  (typeof value === 'number' && Number.isSafeInteger(value) && value > 0);

export class InvalidMidReportResponseError extends Error {
  constructor() {
    super('중간보고서 응답 형식이 올바르지 않아요.');
  }
}

/** 숫자 ID와 편집자 이름 projection을 기존 공통 문서 모델로 변환한다. */
export function mapMidReport(value: unknown): MidReport {
  const fail = (): never => {
    throw new InvalidMidReportResponseError();
  };
  if (
    !record(value) ||
    !id(value.id) ||
    !id(value.teamId) ||
    typeof value.title !== 'string' ||
    !Number.isSafeInteger(value.version) ||
    Number(value.version) < 0 ||
    !date(value.dueDate) ||
    !['DRAFT', 'SUBMITTED', 'REVISION_REQUESTED'].includes(
      String(value.status),
    ) ||
    (value.teamLeaderName !== null &&
      typeof value.teamLeaderName !== 'string') ||
    !(value.submittedAt === null || date(value.submittedAt)) ||
    !(value.submittedBy === null || typeof value.submittedBy === 'string') ||
    !Array.isArray(value.blocks) ||
    value.blocks.length !== 4
  )
    return fail();
  const blocks = value.blocks.map(block => {
    if (
      !record(block) ||
      !midReportBlockKeys.includes(block.key as MidReportBlockKey) ||
      typeof block.title !== 'string' ||
      typeof block.description !== 'string' ||
      !date(block.lastSavedAt) ||
      !['IN_PROGRESS', 'COMPLETED'].includes(String(block.status)) ||
      !(
        block.lock === null ||
        (record(block.lock) && typeof block.lock.ownerName === 'string')
      ) ||
      !Array.isArray(block.fields)
    )
      return fail();
    const key = block.key as MidReportBlockKey;
    const fields = block.fields.map(field => {
      if (
        !record(field) ||
        typeof field.key !== 'string' ||
        typeof field.label !== 'string' ||
        typeof field.value !== 'string' ||
        !(field.multiline === undefined || typeof field.multiline === 'boolean')
      )
        return fail();
      if (
        ['guiScreens', 'testCases'].includes(field.key) &&
        field.value.trim()
      ) {
        try {
          const rows: unknown = JSON.parse(field.value);
          const keys =
            field.key === 'guiScreens'
              ? ['id', 'name', 'description']
              : ['id', 'description', 'input', 'output'];
          if (
            !Array.isArray(rows) ||
            rows.some(
              row => !record(row) || keys.some(k => typeof row[k] !== 'string'),
            ) ||
            new Set(rows.map(row => row.id)).size !== rows.length
          )
            return fail();
        } catch {
          return fail();
        }
      }
      return {
        key: field.key,
        label: field.label,
        value: field.value,
        ...(field.multiline === undefined
          ? {}
          : { multiline: field.multiline }),
      };
    });
    if (
      fields.length !== fieldKeys[key].length ||
      new Set(fields.map(field => field.key)).size !== fields.length ||
      fields.some(field => !fieldKeys[key].includes(field.key))
    )
      return fail();
    return {
      key,
      title: block.title,
      description: block.description,
      fields,
      status: block.status as 'IN_PROGRESS' | 'COMPLETED',
      lock: block.lock as { ownerName: string } | null,
      lastEditedBy:
        typeof block.lastEditedByName === 'string'
          ? block.lastEditedByName
          : typeof block.lastEditedBy === 'string'
            ? block.lastEditedBy
            : '',
      lastSavedAt: block.lastSavedAt,
    };
  });
  if (new Set(blocks.map(block => block.key)).size !== 4) return fail();
  const revision = value.revision;
  if (
    revision != null &&
    (!record(revision) ||
      !Array.isArray(revision.affectedBlockKeys) ||
      !Array.isArray(revision.changedBlockKeys) ||
      [...revision.affectedBlockKeys, ...revision.changedBlockKeys].some(
        key => !midReportBlockKeys.includes(key),
      ) ||
      !date(revision.requestedAt) ||
      !(revision.resubmittedAt === null || date(revision.resubmittedAt)))
  )
    return fail();
  return {
    id: String(value.id),
    teamId: String(value.teamId),
    title: value.title,
    version: Number(value.version),
    dueDate: value.dueDate,
    status: value.status as MidReport['status'],
    teamLeaderName: value.teamLeaderName ?? '',
    submittedAt: value.submittedAt,
    submittedBy:
      typeof value.submittedByName === 'string'
        ? value.submittedByName
        : value.submittedBy,
    revision: revision as MidReport['revision'],
    blocks,
  };
}
