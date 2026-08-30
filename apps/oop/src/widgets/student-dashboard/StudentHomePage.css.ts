import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  minWidth: 0,
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      paddingInline: tokens.spacing['4'],
    },
  },
});

export const status = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
  padding: '32px 0',
  textAlign: 'center',
  '@media': {
    'screen and (max-width: 767px)': {
      paddingInline: tokens.spacing['4'],
    },
  },
});
