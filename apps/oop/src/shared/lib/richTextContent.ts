import type { RichTextJson } from '@aics/core';

/**
 * Server `content: string` fields (meeting records, announcements) carry a
 * ProseMirror JSON document. Older or manually entered rows are plain text;
 * they render as paragraphs and are never interpreted as HTML.
 */
const richTextNodeTypes = [
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'hardBreak',
  'horizontalRule',
];
const richTextMarkTypes = [
  'bold',
  'italic',
  'strike',
  'code',
  'link',
  'underline',
];

export function isRichTextNode(value: unknown): value is RichTextJson {
  if (!value || typeof value !== 'object') return false;
  const node = value as RichTextJson;
  if (!richTextNodeTypes.includes(node.type)) return false;
  if (
    node.marks !== undefined &&
    (!Array.isArray(node.marks) ||
      !node.marks.every(
        mark =>
          mark &&
          typeof mark === 'object' &&
          richTextMarkTypes.includes((mark as { type: string }).type),
      ))
  )
    return false;
  if (node.type === 'text' && typeof node.text !== 'string') return false;
  return (
    node.content === undefined ||
    (Array.isArray(node.content) && node.content.every(isRichTextNode))
  );
}

export function plainTextToRichText(text: string): RichTextJson {
  return {
    type: 'doc',
    content: text.split(/\r?\n/).map(line => ({
      type: 'paragraph',
      ...(line ? { content: [{ type: 'text', text: line }] } : {}),
    })),
  };
}

export function parseRichTextContent(content: string): RichTextJson {
  try {
    const parsed: unknown = JSON.parse(content);
    if (isRichTextNode(parsed) && parsed.type === 'doc') return parsed;
  } catch {
    // Plain text falls through.
  }
  return plainTextToRichText(content);
}

export function serializeRichTextContent(content: RichTextJson) {
  return JSON.stringify(content);
}

function collectText(value: unknown, values: string[]) {
  if (!value || typeof value !== 'object') return;
  const node = value as { content?: unknown[]; text?: unknown };
  if (typeof node.text === 'string') values.push(node.text);
  node.content?.forEach(child => collectText(child, values));
}

export function getRichTextPlainText(content: RichTextJson) {
  const values: string[] = [];
  collectText(content, values);
  return values.join(' ');
}

export function isRichTextEmpty(content: RichTextJson) {
  return getRichTextPlainText(content).trim().length === 0;
}

export const emptyRichText: RichTextJson = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};
