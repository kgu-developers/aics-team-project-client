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
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
  '@media': {
    'screen and (max-width: 640px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      gap: tokens.spacing[2],
    },
  },
});

export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 13,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const document = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[4],
  padding: 'clamp(18px, 3vw, 24px)',
});

export const documentHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[2],
});

export const eyebrow = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.08em',
});

export const metadataGrid = style({
  display: 'grid',
  columnGap: tokens.spacing[5],
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  margin: 0,
  rowGap: tokens.spacing[3],
  '@media': {
    'screen and (max-width: 900px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    'screen and (max-width: 560px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const metadataItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[1],
  minWidth: 0,
});

globalStyle(`${metadataItem} dt`, {
  color: tokens.color.text.secondary,
  fontSize: 13,
});

globalStyle(`${metadataItem} dd`, {
  fontWeight: 600,
  margin: 0,
  minWidth: 0,
  overflowWrap: 'anywhere',
});

export const participantsSection = style({
  borderTop: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[3],
  paddingTop: tokens.spacing[4],
});

export const contentCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[5],
  minHeight: 320,
  padding: 'clamp(24px, 4vw, 40px)',
});

export const contentTitleRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
  marginBottom: tokens.spacing[3],
});

export const contentSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[4],
});

export const participantList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const participant = style({
  background: 'transparent',
  border: 0,
  color: tokens.color.text.accent,
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const teamLink = style({
  color: tokens.color.text.accent,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const actionsSection = style({
  display: 'grid',
  gap: tokens.spacing[3],
});

export const editLogsSection = style({
  display: 'grid',
  gap: tokens.spacing[3],
});

export const actionsTitleRow = style({
  alignItems: 'end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
});

export const actionsCard = style({
  minWidth: 0,
  padding: tokens.spacing[4],
});

export const actionsError = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
});

export const actionsPagination = style({
  justifySelf: 'end',
});
