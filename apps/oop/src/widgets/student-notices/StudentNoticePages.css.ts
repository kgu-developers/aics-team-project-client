import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

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
  minWidth: 0,
  '@media': {
    'screen and (max-width: 767px)': {
      flexDirection: 'column',
    },
  },
});

export const backLink = style({
  color: tokens.color.text.accent,
  flex: 'none',
  fontSize: 13,
  textDecoration: 'none',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const tableCard = style({
  minWidth: 0,
  width: '100%',
});

export const titleLink = style({
  color: tokens.color.text.primary,
  textDecoration: 'none',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const titleCell = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing[2],
  minWidth: 0,
});

export const emptyCell = style({
  color: tokens.color.text.secondary,
  padding: '42px 16px',
  textAlign: 'center',
});

export const detailCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  overflowWrap: 'anywhere',
  padding: 28,
  '@media': {
    'screen and (max-width: 767px)': {
      padding: 20,
    },
  },
});

export const meta = style({ fontSize: 13 });

export const divider = style({
  background: tokens.color.border.base,
  height: 1,
  width: '100%',
});

export const attachments = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[3],
  marginTop: tokens.spacing[3],
});

export const attachmentList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[2],
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const attachmentItem = style({
  alignItems: 'center',
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  display: 'flex',
  gap: tokens.spacing[4],
  justifyContent: 'space-between',
  padding: tokens.spacing[3],
  '@media': {
    'screen and (max-width: 767px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
});

export const attachmentInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[1],
  minWidth: 0,
  overflowWrap: 'anywhere',
});

export const attachmentActions = style({
  alignItems: 'center',
  display: 'flex',
  flex: 'none',
  gap: tokens.spacing[2],
});

export const downloadLink = style({
  borderRadius: tokens.radius.element,
  color: tokens.color.text.accent,
  fontSize: 14,
  fontWeight: 500,
  padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
  textDecoration: 'none',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const imagePreviewList = style({
  display: 'grid',
  gap: tokens.spacing[4],
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  marginTop: tokens.spacing[3],
  '@media': {
    'screen and (max-width: 767px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
});

export const imagePreview = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[2],
  margin: 0,
});

export const previewImage = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'block',
  maxHeight: 560,
  objectFit: 'contain',
  width: '100%',
});

export const imageCaption = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  overflowWrap: 'anywhere',
});
