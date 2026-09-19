import type { EditorDocId } from '~/app/constants/editorSections';

export type EditorReturnContext = Extract<
  EditorDocId,
  'proposal' | 'mid-review'
>;

export function validateEditorReturnContext(
  docId: EditorDocId,
  value: unknown,
): EditorReturnContext | undefined {
  return (docId === 'proposal' || docId === 'mid-review') && value === docId
    ? docId
    : undefined;
}

export function editorReturnLabel(context: EditorReturnContext | undefined) {
  switch (context) {
    case 'proposal':
      return '제안서 단계로 돌아가기';
    case 'mid-review':
      return '중간보고서 단계로 돌아가기';
    default:
      return '학생 홈으로';
  }
}
