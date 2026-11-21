import type { DocumentEditorField } from '~/features/editor/documentEditor';
import { screenCardsMissingText } from '~/features/editor/screenCardValidation';

export function midReportGuiBlocker(fields: DocumentEditorField[]) {
  const value = fields.find(field => field.key === 'guiScreens')?.value;
  if (!value?.trim())
    return '화면 GUI 영역에 화면 카드를 한 개 이상 추가해 주세요.';
  let rows: unknown;
  try {
    rows = JSON.parse(value);
  } catch {
    return '화면 GUI 목록을 읽을 수 없어요. 화면 GUI 영역을 다시 확인해 주세요.';
  }
  if (!Array.isArray(rows))
    return '화면 GUI 목록을 읽을 수 없어요. 화면 GUI 영역을 다시 확인해 주세요.';
  if (!rows.length)
    return '화면 GUI 영역에 화면 카드를 한 개 이상 추가해 주세요.';
  const missing = screenCardsMissingText(
    rows.map((row: unknown) => {
      const item =
        row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        title: typeof item.name === 'string' ? item.name : undefined,
        description:
          typeof item.description === 'string' ? item.description : undefined,
      };
    }),
  );
  return missing ? `화면 GUI 영역을 확인해 주세요. ${missing}` : null;
}

export function getMidReportGuiIssue(
  blocks: { key: string; fields: DocumentEditorField[] }[],
) {
  const block = blocks.find(block => block.key === 'gui-design');
  if (!block)
    return {
      message: '중간보고서에 화면 GUI 영역이 없어요. 다시 불러와 주세요.',
      section: null,
    };
  const message = midReportGuiBlocker(block.fields);
  return message ? { message, section: 'gui-design' as const } : null;
}
