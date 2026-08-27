import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const card = style({
  background: tokens.color.background.card,
  borderRadius: 12,
  display: 'flex',
  overflow: 'hidden',
  '@media': {
    'screen and (max-width: 767px)': {
      flexDirection: 'column',
    },
  },
});

export const meta = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color['border-emphasized']}`,
  borderRadius: '12px 0 0 12px',
  display: 'flex',
  flex: 'none',
  flexDirection: 'column',
  gap: 4,
  padding: '16px 12px',
  width: 160,
  '@media': {
    'screen and (max-width: 767px)': {
      borderRadius: '12px 12px 0 0',
      width: '100%',
    },
  },
});

export const content = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderLeft: 0,
  borderRadius: '0 12px 12px 0',
  flex: 1,
  minWidth: 0,
  '@media': {
    'screen and (max-width: 767px)': {
      borderLeft: `1px solid ${tokens.color.border.base}`,
      borderRadius: '0 0 12px 12px',
    },
  },
});

export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 72,
  padding: '14px 16px',
});

export const footer = style({
  borderTop: `1px solid ${tokens.color.border.base}`,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr)) auto',
  minHeight: 43,
});

export const footerMetric = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minWidth: 0,
  padding: 10,
});

export const label = style({
  fontWeight: 600,
});

export const secondaryLabel = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
});

export const detailLink = style({
  alignItems: 'center',
  alignSelf: 'center',
  background: tokens.color.accent,
  border: 0,
  borderRadius: 8,
  color: tokens.color['on-accent'],
  cursor: 'pointer',
  display: 'inline-flex',
  font: 'inherit',
  fontSize: 14,
  fontWeight: 500,
  justifyContent: 'center',
  margin: 8,
  minWidth: 84,
  padding: '8px 12px',
  textDecoration: 'none',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
  ':hover': {
    background: tokens.color.accent,
  },
});

export const detailButtonDisabled = style({
  cursor: 'not-allowed',
  opacity: 0.55,
});
