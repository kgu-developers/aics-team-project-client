import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const card = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 160px) 1fr',
  overflow: 'hidden',
  '@media': {
    'screen and (max-width: 767px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const cardHeader = style({
  background: tokens.color.background.gray,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  justifyContent: 'center',
  padding: '16px 20px',
});

export const deadline = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});

export const cardBody = style({
  alignItems: 'center',
  display: 'flex',
  minHeight: 72,
  padding: '16px 20px',
});

export const status = style({
  alignItems: 'center',
  color: tokens.color.text.primary,
  display: 'flex',
  flexShrink: 0,
  fontSize: 14,
  gap: 8,
});
