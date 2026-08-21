import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  borderTop: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  flexDirection: 'column',
  marginTop: tokens.spacing['4'],
  paddingTop: tokens.spacing['4'],
});

export const fileSummary = style({
  background: tokens.color.background.muted,
  borderRadius: tokens.radius.element,
  padding: tokens.spacing['3'],
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
});
