import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const titleRow = style({
  alignItems: 'flex-start',
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
});

export const backLink = style({
  color: tokens.color.text.accent,
  flex: '0 0 auto',
  fontSize: 13,
  textDecoration: 'none',
});

export const detailCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  padding: 'clamp(20px, 4vw, 32px)',
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const sectionTitle = style({ margin: 0 });

export const readOnlyGrid = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': { '(max-width: 640px)': { gridTemplateColumns: '1fr' } },
});

export const readOnlyField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
});

export const readOnlyValue = style({
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
});

export const sectionSchedule = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const policyTitle = style({ margin: 0 });

export const policyList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginTop: 8,
});

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});

globalStyle(`${detailCard} > section + section`, {
  borderTop: `1px solid ${tokens.color.border.base}`,
  paddingTop: 28,
});
