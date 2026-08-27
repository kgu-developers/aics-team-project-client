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
  fontSize: 14,
  textDecoration: 'none',
  width: 'fit-content',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const pageHeader = style({
  alignItems: 'center',
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
  '@media': {
    'screen and (max-width: 560px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },
  },
});

export const metadata = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
});

export const document = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  padding: 'clamp(20px, 4vw, 40px)',
});

export const documentHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const documentLabel = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 600,
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const sectionDescription = style({
  color: tokens.color.text.secondary,
});

export const fieldGrid = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    'screen and (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const field = style({
  background: tokens.color.background.muted,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 16,
});

export const fullWidthField = style({
  gridColumn: '1 / -1',
});

export const fieldLabel = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 600,
});

export const fieldValue = style({
  whiteSpace: 'pre-wrap',
});

export const attachment = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 8,
});

export const imagePreview = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 6,
  maxHeight: 280,
  maxWidth: '100%',
  objectFit: 'contain',
});

export const downloadLink = style({
  color: tokens.color.text.accent,
  fontSize: 14,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  width: 'fit-content',
});

export const evaluationList = style({
  display: 'grid',
  gap: 12,
  marginTop: 16,
});

export const evaluationHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const evaluationClose = style({
  marginTop: 20,
});

export const evaluationItem = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 14,
});

export const table = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderCollapse: 'separate',
  borderRadius: 8,
  borderSpacing: 0,
  overflow: 'hidden',
  width: '100%',
});

export const tableCell = style({
  borderBottom: `1px solid ${tokens.color.border.base}`,
  padding: 12,
});

export const tableHeader = style({
  background: tokens.color.background.muted,
  fontWeight: 700,
  textAlign: 'left',
});

export const peerMemberButton = style({
  background: 'transparent',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const lastTableRow = style({
  display: 'table-row',
});

globalStyle(`${lastTableRow} td`, {
  borderBottom: 'none',
});

export const screenList = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    'screen and (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const evaluatorButton = style({
  background: 'none',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});
