import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
  minWidth: 0,
  width: '100%',
});

export const viewport = style({
  alignItems: 'flex-start',
  backgroundColor: tokens.color.background.muted,
  borderRadius: tokens.radius.container,
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  maxHeight: 520,
  overflow: 'auto',
  padding: tokens.spacing['3'],
  width: '100%',
});

export const page = style({
  maxWidth: '100%',
});

globalStyle(`${page} canvas`, {
  display: 'block',
  height: 'auto',
  maxWidth: '100%',
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
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
});

export const status = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
  minWidth: '3.5rem',
  textAlign: 'center',
});

export const zoom = style({
  display: 'flex',
  gap: tokens.spacing['1'],
  marginLeft: 'auto',
});
