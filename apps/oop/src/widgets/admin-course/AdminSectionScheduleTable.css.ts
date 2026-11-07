import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const header = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
});

export const scheduleTable = style({});

globalStyle(`${scheduleTable} tbody tr`, {
  transition: 'background-color 120ms ease',
});

globalStyle(`${scheduleTable} tbody tr:hover td`, {
  background: tokens.color.background.muted,
});

export const milestoneLink = style({
  color: tokens.color.text.primary,
  textDecoration: 'none',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${tokens.color.accent}`,
      outlineOffset: 2,
    },
  },
});

export const milestoneAction = style({
  alignItems: 'center',
  color: tokens.color.text.secondary,
  display: 'inline-flex',
  padding: 4,
  selectors: {
    '&:hover': {
      color: tokens.color.text.primary,
    },
    '&:focus-visible': {
      outline: `2px solid ${tokens.color.accent}`,
      outlineOffset: 2,
    },
  },
});
