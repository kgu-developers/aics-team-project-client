import { style } from '@vanilla-extract/css';

export const row = style({
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  display: 'grid',
  gap: 'var(--spacing-4)',
  padding: 'var(--spacing-4)',
});

export const dialogForm = style({
  boxSizing: 'border-box',
  maxHeight: 'calc(100dvh - 32px)',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: 'var(--spacing-4)',
  width: '100%',
});

export const dialogActions = style({
  background: 'var(--color-background-card)',
  bottom: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
  paddingBlock: 'var(--spacing-2)',
  position: 'sticky',
});

export const imagePreview = style({
  width: '100%',
  maxHeight: 'min(320px, 32dvh)',
  objectFit: 'contain',
});

export const screenBoard = style({
  maxWidth: '100%',
  minWidth: 0,
  overflow: 'hidden',
  width: '100%',
});

export const screenList = style({
  boxSizing: 'border-box',
  display: 'flex',
  gap: 'var(--spacing-4)',
  listStyle: 'none',
  margin: 0,
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  padding: 0,
  width: '100%',
});
export const screenCard = style({
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  display: 'grid',
  flex: '0 0 240px',
  gap: 'var(--spacing-3)',
  justifyItems: 'start',
  minWidth: 0,
  padding: 'var(--spacing-4)',
});
export const screenActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
});
export const screenAddCell = style({
  alignItems: 'center',
  display: 'flex',
  flex: '0 0 auto',
  justifyContent: 'center',
  padding: 'var(--spacing-2)',
});
export const screenAddButton = style({
  borderRadius: '999px',
});
export const tableWrapper = style({
  height: 'auto',
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
});
