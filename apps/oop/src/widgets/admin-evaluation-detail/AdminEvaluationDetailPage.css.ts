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
export const backLink = style({
  color: tokens.color.text.accent,
  textDecoration: 'none',
  width: 'fit-content',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
});
export const titleSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});
export const evaluatorButton = style({
  background: 'none',
  border: 0,
  color: tokens.color.text.accent,
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});
export const metadata = style({ color: tokens.color.text.secondary });
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: 'clamp(20px, 4vw, 36px)',
});
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});
export const sectionHeader = style({
  display: 'grid',
  gap: 4,
});
export const tableWrap = style({ overflowX: 'auto' });
export const table = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderCollapse: 'separate',
  borderRadius: 8,
  borderSpacing: 0,
  overflow: 'hidden',
  width: '100%',
});
export const tableCell = style({
  background: tokens.color.background.card,
  borderBottom: `1px solid ${tokens.color.border.base}`,
  padding: 12,
  textAlign: 'left',
  verticalAlign: 'top',
});
export const tableHeader = style({
  background: tokens.color.background.muted,
  fontWeight: 700,
});
export const lastRow = style({});
globalStyle(`${lastRow} td`, { borderBottom: 'none' });
export const evaluationList = style({ display: 'grid', gap: 12 });
export const evaluationCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 18,
});
export const peerOverview = style({
  display: 'grid',
  gap: 16,
  padding: 20,
});
export const overviewHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});
export const eyebrow = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  margin: 0,
});
export const memberSummaryGrid = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
});
export const memberSummaryCard = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 10,
  display: 'grid',
  gap: 6,
  padding: 16,
});
export const memberSummaryHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  gap: 8,
  justifyContent: 'space-between',
});
export const memberIdentity = style({
  display: 'grid',
  gap: 2,
});
export const averageScore = style({
  color: tokens.color.text.primary,
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
});
export const evaluationHeader = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'space-between',
});
export const muted = style({ color: tokens.color.text.secondary });
export const responseGrid = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '140px minmax(0, 1fr)',
  '@media': { 'screen and (max-width: 720px)': { gridTemplateColumns: '1fr' } },
});
export const peerResponseGroup = style({ display: 'contents' });
export const peerResponseBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
});
export const response = style({
  background: tokens.color.background.muted,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 12,
});
export const responseTitle = style({ fontWeight: 700 });
export const meetingLink = style({
  color: tokens.color.text.accent,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
