import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'grid',
  gap: tokens.spacing['4'],
});

export const header = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
});

export const preview = style({
  display: 'grid',
  gap: tokens.spacing['5'],
});

export const step = style({
  display: 'grid',
  gap: tokens.spacing['4'],
});

export const stepHeader = style({
  display: 'grid',
  gap: tokens.spacing['1'],
});

export const fields = style({
  display: 'grid',
  gap: tokens.spacing['4'],
});

export const teammatePreview = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'grid',
  gap: tokens.spacing['4'],
  padding: tokens.spacing['4'],
});

export const teammateHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
});

export const stepFooter = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
  justifyContent: 'space-between',
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
  justifyContent: 'flex-end',
});
