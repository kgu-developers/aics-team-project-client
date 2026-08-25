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

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const submission = style({
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

export const submissionMeta = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color['border-emphasized']}`,
  borderRadius: '12px 0 0 12px',
  display: 'flex',
  flex: 'none',
  flexDirection: 'column',
  gap: 4,
  padding: '16px 12px',
  width: 140,
  '@media': {
    'screen and (max-width: 767px)': {
      borderRadius: '12px 12px 0 0',
      width: '100%',
    },
  },
});

export const submissionContent = style({
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

export const submissionSummary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 72,
  padding: '14px 16px',
});

export const submissionFooter = style({
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

export const teamName = style({
  fontWeight: 600,
});

export const topic = style({
  fontWeight: 600,
});

export const date = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
});

export const detailLink = style({
  alignItems: 'center',
  alignSelf: 'center',
  background: tokens.color.accent,
  borderRadius: 8,
  color: tokens.color['on-accent'],
  display: 'inline-flex',
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
