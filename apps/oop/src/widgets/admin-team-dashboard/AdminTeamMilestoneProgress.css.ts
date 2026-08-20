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
  alignItems: 'center',
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'flex',
  gap: 24,
  justifyContent: 'space-between',
  padding: '16px 20px',
  '@media': {
    'screen and (max-width: 767px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      gap: 12,
    },
  },
});

export const cardHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const deadline = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});

export const status = style({
  alignItems: 'center',
  color: tokens.color.text.primary,
  display: 'flex',
  flexShrink: 0,
  fontSize: 14,
  gap: 8,
});
