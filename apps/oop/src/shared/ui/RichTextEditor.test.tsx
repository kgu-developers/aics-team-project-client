import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { emptyRichText } from '~/shared/lib/richTextContent';

import RichTextEditor from './RichTextEditor';

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div />,
  useEditor: () => ({
    chain: () => ({
      focus: () => ({
        toggleBlockquote: () => ({ run: vi.fn() }),
        toggleBold: () => ({ run: vi.fn() }),
        toggleBulletList: () => ({ run: vi.fn() }),
        toggleCodeBlock: () => ({ run: vi.fn() }),
        toggleHeading: () => ({ run: vi.fn() }),
        toggleItalic: () => ({ run: vi.fn() }),
        toggleOrderedList: () => ({ run: vi.fn() }),
        toggleStrike: () => ({ run: vi.fn() }),
      }),
    }),
    commands: { setContent: vi.fn() },
    getJSON: () => emptyRichText,
    setEditable: vi.fn(),
  }),
}));

describe('RichTextEditor', () => {
  it('화살표 이동이 없는 서식 버튼 묶음을 toolbar로 과장하지 않는다', () => {
    render(
      <AstryxThemeProvider>
        <RichTextEditor
          content={emptyRichText}
          label='내용'
          onChange={vi.fn()}
        />
      </AstryxThemeProvider>,
    );

    expect(screen.getByRole('group', { name: '내용 서식' })).toBeVisible();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });
});
