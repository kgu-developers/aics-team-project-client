import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const header = style({
  alignItems: 'flex-start',
  display: 'flex',
  justifyContent: 'space-between',
});

export const description = style({
  color: tokens.color.text.secondary,
  marginTop: 8,
});

export const readOnly = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});

export const listSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
});

export const tabs = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
});

export const tab = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 6,
  color: tokens.color.text.primary,
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 14,
  fontWeight: 500,
  padding: '8px 12px',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const tabActive = style({
  background: tokens.color.background.card,
  borderColor: tokens.color.accent,
  color: tokens.color.text.accent,
});

export const tabPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const topic = style({
  fontWeight: 600,
});

export const downloadRow = style({
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
});

export const downloadLink = style({
  background: tokens.color.accent,
  borderRadius: 8,
  color: tokens.color['on-accent'],
  flex: 'none',
  fontSize: 14,
  padding: '8px 12px',
  textDecoration: 'none',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 14,
  textDecoration: 'none',
  width: 'fit-content',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
