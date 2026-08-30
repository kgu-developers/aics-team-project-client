import type { DocumentSession, DocumentSessionBlock } from '@aics/core';

type Field = { key: string; value: string };

type StructuredRowValidator = (row: Record<string, unknown>) => boolean;

type StructuredFieldValidators = Readonly<
  Record<string, StructuredRowValidator>
>;

type Session<TBlock extends DocumentSessionBlock<string, Field>> =
  DocumentSession<TBlock>;

const revisionBaselinesByDocumentId = new Map<string, Map<string, Field[]>>();

function hasEveryAffectedBlockChanged<
  TBlock extends DocumentSessionBlock<string, Field>,
>(document: Session<TBlock>) {
  const revision = document.revision;
  return Boolean(
    revision &&
    revision.affectedBlockKeys.length > 0 &&
    revision.affectedBlockKeys.every(key =>
      revision.changedBlockKeys.includes(key),
    ),
  );
}

function fieldsChanged<TField extends Field>(
  current: TField[],
  next: TField[],
) {
  return (
    current.length !== next.length ||
    current.some(
      (field, index) =>
        field.key !== next[index]?.key || field.value !== next[index]?.value,
    )
  );
}

function revisionChangedBlockKeys<
  TBlock extends DocumentSessionBlock<string, Field>,
>(
  document: Session<TBlock>,
  blockKey: TBlock['key'],
  fields: TBlock['fields'],
) {
  const revision = document.revision;
  if (!revision || !revision.affectedBlockKeys.includes(blockKey))
    return revision?.changedBlockKeys ?? [];

  const baseline = revisionBaselinesByDocumentId
    .get(document.id)
    ?.get(blockKey);
  const differsFromBaseline = Boolean(
    baseline && fieldsChanged(baseline, fields),
  );
  return differsFromBaseline
    ? Array.from(new Set([...revision.changedBlockKeys, blockKey]))
    : revision.changedBlockKeys.filter(key => key !== blockKey);
}

function isStructuredRow(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasRequiredTextValues(
  row: Record<string, unknown>,
  keys: readonly string[],
) {
  return keys.every(
    key => typeof row[key] === 'string' && row[key].trim().length > 0,
  );
}

export function hasValidStructuredRows(
  value: string,
  validateRow: StructuredRowValidator,
) {
  try {
    const rows = JSON.parse(value) as unknown;
    return (
      Array.isArray(rows) &&
      rows.length > 0 &&
      rows.every(row => isStructuredRow(row) && validateRow(row))
    );
  } catch {
    return false;
  }
}

export function hasNonEmptyStringArray(value: string) {
  try {
    const items = JSON.parse(value) as unknown;
    return (
      Array.isArray(items) &&
      items.length > 0 &&
      items.every(item => typeof item === 'string' && item.trim().length > 0)
    );
  } catch {
    return false;
  }
}

export function areDocumentFieldsComplete(
  fields: readonly Field[],
  requiredFieldKeys: readonly string[],
  structuredFieldValidators: StructuredFieldValidators = {},
) {
  const fieldKeys = fields.map(field => field.key);
  if (
    fields.length !== requiredFieldKeys.length ||
    new Set(fieldKeys).size !== fieldKeys.length ||
    requiredFieldKeys.some(key => !fieldKeys.includes(key)) ||
    Object.keys(structuredFieldValidators).some(
      key => !requiredFieldKeys.includes(key),
    )
  )
    return false;
  return fields.every(field => {
    const validateRow = structuredFieldValidators[field.key];
    return validateRow
      ? hasValidStructuredRows(field.value, validateRow)
      : field.value.trim().length > 0;
  });
}

export function saveDocumentSessionBlock<
  TBlock extends DocumentSessionBlock<string, Field>,
>(
  document: Session<TBlock>,
  blockKey: TBlock['key'],
  version: number,
  fields: TBlock['fields'],
  editorName: string,
): Session<TBlock> | null {
  if (document.version !== version || document.status === 'SUBMITTED')
    return null;
  const target = document.blocks.find(block => block.key === blockKey);
  if (!target) return null;
  const changed = fieldsChanged(target.fields, fields);
  return {
    ...document,
    version: document.version + 1,
    revision:
      document.status === 'REVISION_REQUESTED' &&
      document.revision &&
      document.revision.affectedBlockKeys.includes(blockKey)
        ? {
            ...document.revision,
            changedBlockKeys: revisionChangedBlockKeys(
              document,
              blockKey,
              fields,
            ),
          }
        : document.revision,
    blocks: document.blocks.map(block =>
      block.key === blockKey
        ? {
            ...block,
            fields,
            status:
              block.status === 'COMPLETED' && changed
                ? 'IN_PROGRESS'
                : block.status,
            lastEditedBy: editorName,
            lastSavedAt: new Date().toISOString(),
          }
        : block,
    ) as TBlock[],
  };
}

export function completeDocumentSessionBlock<
  TBlock extends DocumentSessionBlock<string, Field>,
>(
  document: Session<TBlock>,
  blockKey: TBlock['key'],
  version: number,
  editorName: string,
  canComplete: (block: TBlock) => boolean,
): Session<TBlock> | null {
  if (document.version !== version || document.status === 'SUBMITTED')
    return null;
  const target = document.blocks.find(block => block.key === blockKey);
  if (!target || !canComplete(target)) return null;
  return {
    ...document,
    version: document.version + 1,
    blocks: document.blocks.map(block =>
      block.key === blockKey
        ? {
            ...block,
            status: 'COMPLETED',
            lastEditedBy: editorName,
            lastSavedAt: new Date().toISOString(),
          }
        : block,
    ) as TBlock[],
  };
}

export function submitDocumentSession<
  TBlock extends DocumentSessionBlock<string, Field>,
>(
  document: Session<TBlock>,
  version: number,
  submitterName: string,
): Session<TBlock> | null {
  if (
    document.version !== version ||
    document.status === 'SUBMITTED' ||
    document.teamLeaderName !== submitterName ||
    document.blocks.some(block => block.status !== 'COMPLETED') ||
    (document.status === 'REVISION_REQUESTED' &&
      !hasEveryAffectedBlockChanged(document))
  )
    return null;
  const submittedAt = new Date().toISOString();
  return {
    ...document,
    status: 'SUBMITTED',
    submittedAt,
    submittedBy: submitterName,
    version: document.version + 1,
    revision: document.revision
      ? { ...document.revision, resubmittedAt: submittedAt }
      : document.revision,
  };
}

export function requestDocumentSessionRevision<
  TBlock extends DocumentSessionBlock<string, Field>,
>(
  document: Session<TBlock>,
  affectedBlockKeys: TBlock['key'][],
): Session<TBlock> | null {
  const uniqueKeys = Array.from(new Set(affectedBlockKeys));
  if (
    document.status !== 'SUBMITTED' ||
    document.revision ||
    uniqueKeys.length === 0 ||
    uniqueKeys.some(key => !document.blocks.some(block => block.key === key))
  )
    return null;

  revisionBaselinesByDocumentId.set(
    document.id,
    new Map(
      document.blocks
        .filter(block => uniqueKeys.includes(block.key))
        .map(block => [
          block.key,
          block.fields.map(field => ({ key: field.key, value: field.value })),
        ]),
    ),
  );

  return {
    ...document,
    status: 'REVISION_REQUESTED',
    version: document.version + 1,
    revision: {
      affectedBlockKeys: uniqueKeys,
      changedBlockKeys: [],
      requestedAt: new Date().toISOString(),
      resubmittedAt: null,
    },
    blocks: document.blocks.map(block =>
      uniqueKeys.includes(block.key)
        ? { ...block, status: 'IN_PROGRESS' }
        : block,
    ) as TBlock[],
  };
}

export function hasRequiredDocumentRevisionChanges<
  TBlock extends DocumentSessionBlock<string, Field>,
>(document: Session<TBlock>) {
  return (
    document.status !== 'REVISION_REQUESTED' ||
    hasEveryAffectedBlockChanged(document)
  );
}

export function hasResubmittedDocumentRevision<
  TBlock extends DocumentSessionBlock<string, Field>,
>(document: Session<TBlock>) {
  return (
    document.status === 'SUBMITTED' && Boolean(document.revision?.resubmittedAt)
  );
}
