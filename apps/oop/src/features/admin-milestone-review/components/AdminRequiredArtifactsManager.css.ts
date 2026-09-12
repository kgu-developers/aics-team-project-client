import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[4],
});

export const heading = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[3],
});

export const artifact = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[3],
  padding: tokens.spacing[4],
});

export const artifactHeader = style({
  alignItems: 'start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
});

export const artifactMeta = style({
  color: tokens.color.text.secondary,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[1],
  margin: 0,
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[2],
});

export const dialogForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[4],
});

export const dialogActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[2],
  justifyContent: 'flex-end',
});

export const numberInput = style({
  appearance: 'none',
  background: tokens.color.background.surface,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  boxSizing: 'border-box',
  color: tokens.color.text.primary,
  font: 'inherit',
  minHeight: 40,
  padding: '8px 12px',
  width: 180,
});

export const error = style({ color: tokens.color.text.red, margin: 0 });
