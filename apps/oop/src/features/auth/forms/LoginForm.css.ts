import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const loginPage = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
  justifyContent: 'center',
  minHeight: '100dvh',
  padding: 24,
});

globalStyle(`${loginPage} h1`, {
  margin: `0 0 ${tokens.spacing['2']}`,
});

export const loginCard = style({
  width: 'min(100%, 420px)',
});

export const eyebrow = style({
  color: tokens.color.text.secondary,
  fontSize: '0.875rem',
  margin: `0 0 ${tokens.spacing['2']}`,
});

export const requestError = style({
  color: tokens.color.error,
  margin: 0,
});

export const demo = style({
  color: tokens.color.text.secondary,
  width: 'min(100%, 420px)',
});
