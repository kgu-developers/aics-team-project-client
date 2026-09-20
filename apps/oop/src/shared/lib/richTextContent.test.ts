import { describe, expect, it } from 'vitest';

import {
  isRichTextEmpty,
  isRichTextNode,
  parseRichTextContent,
  plainTextToRichText,
  serializeRichTextContent,
} from './richTextContent';

describe('richTextContent', () => {
  it('허용하지 않은 mark와 잘못된 text 노드를 거부한다', () => {
    expect(
      isRichTextNode({
        type: 'text',
        text: '링크',
        marks: [{ type: 'script' }],
      }),
    ).toBe(false);
    expect(isRichTextNode({ type: 'text', text: 42 })).toBe(false);
    expect(
      isRichTextNode({
        type: 'doc',
        content: [{ type: 'unknown-node' }],
      }),
    ).toBe(false);
  });

  it('평문을 JSON으로 직렬화하고 같은 문서로 다시 읽는다', () => {
    const document = plainTextToRichText('첫 줄\n둘째 줄');

    expect(parseRichTextContent(serializeRichTextContent(document))).toEqual(
      document,
    );
  });

  it('공백만 있는 문서는 비어 있다고 판정한다', () => {
    expect(isRichTextEmpty(plainTextToRichText('  \n\t'))).toBe(true);
    expect(isRichTextEmpty(plainTextToRichText('  내용  '))).toBe(false);
  });
});
