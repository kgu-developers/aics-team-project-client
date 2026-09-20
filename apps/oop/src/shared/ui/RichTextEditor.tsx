import type { RichTextJson } from '@aics/core';
import { IconButton, Text } from '@aics/design-system';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from 'lucide-react';
import { useEffect, useId } from 'react';

import { cx } from '~/shared/lib/cx';

import * as styles from './RichTextEditor.css';

type RichTextEditorProps = {
  content: RichTextJson;
  /** Visible label; also names the editor region for assistive technology. */
  label: string;
  isDisabled?: boolean;
  onChange: (value: RichTextJson) => void;
};

/**
 * Shared ProseMirror (tiptap) editor. The document is exchanged as JSON so
 * consumers serialize it with `serializeRichTextContent` and render it with
 * `RichTextViewer`; formatting therefore looks identical on every screen.
 */
export default function RichTextEditor({
  content,
  isDisabled = false,
  label,
  onChange,
}: RichTextEditorProps) {
  const labelId = useId();
  const editor = useEditor({
    content,
    editable: !isDisabled,
    editorProps: {
      attributes: {
        'aria-labelledby': labelId,
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    extensions: [StarterKit],
    onUpdate: ({ editor: nextEditor }) =>
      onChange(nextEditor.getJSON() as RichTextJson),
  });
  useEffect(() => {
    editor?.setEditable(!isDisabled);
  }, [editor, isDisabled]);
  useEffect(() => {
    if (!editor || JSON.stringify(editor.getJSON()) === JSON.stringify(content))
      return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  const tools = [
    {
      icon: Bold,
      label: '굵게',
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: '기울임',
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      icon: Strikethrough,
      label: '취소선',
      run: () => editor?.chain().focus().toggleStrike().run(),
    },
    {
      icon: Heading2,
      label: '소제목',
      run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: List,
      label: '글머리표 목록',
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: '번호 목록',
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: '인용문',
      run: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      icon: Code2,
      label: '코드 블록',
      run: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
  ];

  return (
    <div className={styles.root}>
      <Text id={labelId} weight='medium'>
        {label}
      </Text>
      <div aria-label={`${label} 서식`} className={styles.toolbar} role='group'>
        {tools.map(({ icon: Icon, label: toolLabel, run }) => (
          <IconButton
            icon={<Icon aria-hidden='true' size={18} />}
            isDisabled={isDisabled}
            key={toolLabel}
            label={toolLabel}
            onClick={run}
            size='sm'
            variant='ghost'
          />
        ))}
      </div>
      <div className={cx(styles.editor, isDisabled && styles.editorDisabled)}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
