import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
});
export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});
export const title = style({
  color: tokens.color.text.primary,
  fontSize: 28,
  margin: 0,
});
export const description = style({
  color: tokens.color.text.secondary,
  margin: 0,
});
export const boardHeader = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'space-between',
});
export const boardTitle = style({
  color: tokens.color.text.primary,
  fontSize: 20,
  margin: 0,
});
export const participation = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
});
export const voteCount = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
});
export const candidateEnd = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});
export const error = style({ color: tokens.color.text.red, margin: 0 });
