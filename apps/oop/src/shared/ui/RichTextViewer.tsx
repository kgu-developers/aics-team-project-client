import type { RichTextJson } from '@aics/core';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

import * as styles from './RichTextViewer.css';

export default function RichTextViewer({ content }: { content: RichTextJson }) {
  const editor = useEditor({
    content,
    editable: false,
    extensions: [StarterKit],
  });
  useEffect(() => {
    editor?.commands.setContent(content);
  }, [content, editor]);
  return (
    <div className={styles.content}>
      <EditorContent editor={editor} />
    </div>
  );
}
