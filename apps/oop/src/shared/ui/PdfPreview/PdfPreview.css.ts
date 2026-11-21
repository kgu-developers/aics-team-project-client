import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
  minWidth: 0,
  width: '100%',
});

export const embed = style({
  backgroundColor: tokens.color.background.muted,
  border: 0,
  borderRadius: tokens.radius.container,
  height: 520,
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      height: 360,
    },
  },
});
export const mobileCanvas = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
});
export const canvas = style({
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  height: 'auto',
  maxWidth: '100%',
});
export const pagination = style({ display: 'flex', gap: tokens.spacing['2'] });
export const pageStatus = style({
  color: tokens.color.text.secondary,
  margin: 0,
});

export const message = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
  padding: tokens.spacing['5'],
  textAlign: 'center',
});

export const controls = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'flex-end',
});
