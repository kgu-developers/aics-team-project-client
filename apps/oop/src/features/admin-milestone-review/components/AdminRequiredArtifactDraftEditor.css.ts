import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const heading = style({
  alignItems: 'flex-start',
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const artifact = style({
  alignItems: 'center',
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
  padding: 16,
});

export const artifactActions = style({
  display: 'flex',
  flex: '0 0 auto',
  gap: 8,
});

export const dialogForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const dialogActions = style({
  display: 'flex',
  gap: 8,
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
  width: '100%',
});
