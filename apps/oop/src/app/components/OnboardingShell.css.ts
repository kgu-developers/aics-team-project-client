import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const shell = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100dvh',
  padding: 24,
  position: 'relative',
  '@media': {
    'screen and (max-width: 540px)': {
      padding: 0,
    },
  },
});

export const shellCard = style({
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 18,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 606,
  padding: '52px 46px',
  width: 'min(100%, 460px)',
  '@media': {
    'screen and (max-width: 540px)': {
      border: 0,
      borderRadius: 0,
      minHeight: '100dvh',
      padding: '32px 24px',
      width: '100%',
    },
  },
});

export const eyebrow = style({
  color: tokens.color.text.primary,
  fontSize: '1.375rem',
  fontWeight: 700,
  left: 64,
  margin: 0,
  position: 'absolute',
  top: 46,
  '@media': {
    'screen and (max-width: 700px)': {
      display: 'none',
    },
  },
});
