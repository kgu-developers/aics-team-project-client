import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  boxSizing: 'border-box',
  display: 'grid',
  gap: 'var(--spacing-5)',
  margin: '0 auto',
  maxWidth: 960,
  minWidth: 0,
  padding: 'var(--spacing-5) 0',
  width: '100%',
});
export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
  justifyContent: 'space-between',
});
export const list = style({ display: 'grid', gap: 'var(--spacing-3)' });
export const recordCard = style({
  display: 'grid',
  gap: 'var(--spacing-2)',
  padding: 'var(--spacing-5)',
});
export const recordLink = style({
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-lg)',
  fontWeight: 600,
  textDecoration: 'none',
});
export const meta = style({
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-sm)',
  margin: 0,
});
export const detailCard = style({
  display: 'grid',
  gap: 'var(--spacing-5)',
  minWidth: 0,
  padding: 'var(--spacing-6)',
});
export const editorCard = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
  height: 'auto',
  maxHeight: 'none',
  minWidth: 0,
  padding: 'var(--spacing-6)',
});
export const documentTitle = style({
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--spacing-5)',
});
export const properties = style({
  display: 'grid',
  gap: 'var(--spacing-3)',
});
export const fields = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
  minWidth: 0,
});
export const participantList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
});
export const participant = style({
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-full)',
  padding: 'var(--spacing-2) var(--spacing-3)',
});
export const content = style({
  borderTop: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  lineHeight: 1.7,
  minHeight: 80,
  overflowWrap: 'anywhere',
  paddingTop: 'var(--spacing-4)',
});
globalStyle(`${content} h2`, {
  fontSize: 'var(--font-size-lg)',
  margin: '0 0 var(--spacing-3)',
});
globalStyle(`${content} p`, { margin: '0 0 var(--spacing-3)' });
globalStyle(`${content} ul, ${content} ol`, {
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-5)',
});
globalStyle(`${content} ul`, { listStyleType: 'disc' });
globalStyle(`${content} ol`, { listStyleType: 'decimal' });
globalStyle(`${content} blockquote`, {
  borderLeft: '3px solid var(--color-border-emphasized)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-3)',
});
export const editor = style({
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  minHeight: 180,
  padding: 'var(--spacing-3)',
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
export const toolbar = style({
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
  paddingBottom: 'var(--spacing-3)',
});
export const tableFrame = style({
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
});
globalStyle(`${tableFrame} > .astryx-table-scroll-wrapper`, {
  marginInline: 0,
  maxWidth: '100%',
  width: '100%',
});
export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
  justifyContent: 'flex-end',
});
export const backLink = style({
  color: 'var(--color-text-accent)',
  textDecoration: 'none',
});
export const notice = style({
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  padding: 'var(--spacing-3)',
});
export const metadata = style({
  borderTop: '1px solid var(--color-border)',
  paddingTop: 'var(--spacing-3)',
});
export const error = style({ color: 'var(--color-text-error)', margin: 0 });
export const deleteDialogContent = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
});
export const deletePreview = style({
  display: 'grid',
  gap: 'var(--spacing-2)',
  padding: 'var(--spacing-4)',
});
export const dialogActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
  justifyContent: 'flex-end',
});
export const deleteButton = style({
  background: 'var(--color-background-error-inverted)',
  color: 'var(--color-on-error)',
});
