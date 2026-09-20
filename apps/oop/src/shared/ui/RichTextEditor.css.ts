import { globalStyle, style } from '@vanilla-extract/css';

export const root = style({
  display: 'grid',
  gap: 'var(--spacing-3)',
  minWidth: 0,
});
export const toolbar = style({
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
  paddingBottom: 'var(--spacing-3)',
});
export const editor = style({
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  minHeight: 180,
  padding: 'var(--spacing-3)',
});
export const editorDisabled = style({
  background: 'var(--color-background-muted)',
  color: 'var(--color-text-secondary)',
});
globalStyle(`${editor} .ProseMirror`, { minHeight: 152, outline: 'none' });
globalStyle(`${editor} .ProseMirror h2`, {
  fontSize: 'var(--font-size-lg)',
  margin: '0 0 var(--spacing-3)',
});
globalStyle(`${editor} .ProseMirror p`, { margin: '0 0 var(--spacing-3)' });
globalStyle(`${editor} .ProseMirror ul, ${editor} .ProseMirror ol`, {
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-5)',
});
globalStyle(`${editor} .ProseMirror ul`, { listStyleType: 'disc' });
globalStyle(`${editor} .ProseMirror ol`, { listStyleType: 'decimal' });
globalStyle(`${editor} .ProseMirror blockquote`, {
  borderLeft: '3px solid var(--color-border-emphasized)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-3)',
});
globalStyle(`${editor} .ProseMirror pre`, {
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-sm)',
  margin: '0 0 var(--spacing-3)',
  padding: 'var(--spacing-3)',
});
