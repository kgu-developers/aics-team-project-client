import type { RichTextJson } from '@aics/core';

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
