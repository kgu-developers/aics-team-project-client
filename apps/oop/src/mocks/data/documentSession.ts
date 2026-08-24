import type { DocumentSession, DocumentSessionBlock } from '@aics/core';

type Field = { key: string; value: string };

type StructuredRowValidator = (row: Record<string, unknown>) => boolean;

type StructuredFieldValidators = Readonly<
  Record<string, StructuredRowValidator>
>;

type Session<TBlock extends DocumentSessionBlock<string, Field>> =
  DocumentSession<TBlock>;

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
  return {
    ...document,
    version: document.version + 1,
    blocks: document.blocks.map(block =>
      block.key === blockKey
        ? {
            ...block,
            fields,
            status:
              block.status === 'COMPLETED' &&
              fieldsChanged(block.fields, fields)
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
    document.blocks.some(block => block.status !== 'COMPLETED')
  )
    return null;
  return {
    ...document,
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
    submittedBy: submitterName,
    version: document.version + 1,
  };
}
