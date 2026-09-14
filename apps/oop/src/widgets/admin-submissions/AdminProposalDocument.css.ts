import { style } from '@vanilla-extract/css';

export const document = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-5)',
  padding: 'var(--spacing-6)',
  minWidth: 0,
});
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-3)',
  margin: 0,
});
export const content = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});
export const image = style({
  maxWidth: '100%',
  maxHeight: 480,
  objectFit: 'contain',
  alignSelf: 'flex-start',
});
