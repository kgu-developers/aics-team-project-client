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
  '@media': {
    'screen and (max-width: 767px)': {
      padding: 'var(--spacing-5) var(--spacing-4) var(--spacing-8)',
    },
  },
});

export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'nowrap',
  gap: 'var(--spacing-3)',
  justifyContent: 'space-between',
  minWidth: 0,
});

export const breadcrumb = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
});

globalStyle(`${breadcrumb} ol`, {
  flexWrap: 'nowrap',
  minWidth: 0,
  overflow: 'hidden',
});

globalStyle(`${breadcrumb} li`, {
  minWidth: 0,
  whiteSpace: 'nowrap',
});

globalStyle(`${breadcrumb} li:last-child`, {
  flex: '1 1 auto',
  overflow: 'hidden',
});

globalStyle(`${breadcrumb} li:last-child > span:last-child`, {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const backLink = style({
  color: tokens.color.text.accent,
  flex: 'none',
  fontSize: 'var(--font-size-sm)',
  textDecoration: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const tableCard = style({
  height: 'auto',
  minWidth: 0,
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      border: 0,
      borderRadius: 0,
      boxShadow: 'none',
      padding: 0,
    },
  },
});

globalStyle(`${tableCard} .astryx-table-scroll-wrapper`, {
  height: 'auto',
  marginBlock: 0,
  marginInline: 0,
  maxWidth: '100%',
  minHeight: 0,
  width: '100%',
});

export const responsiveTable = style({
  height: 'auto',
  minWidth: 0,
  width: '100%',
});

globalStyle(`${responsiveTable} table`, {
  '@media': {
    'screen and (max-width: 767px)': {
      minWidth: '0 !important',
      tableLayout: 'fixed',
      width: '100%',
    },
  },
});

globalStyle(`${responsiveTable} th, ${responsiveTable} td`, {
  '@media': {
    'screen and (max-width: 767px)': {
      minWidth: '0 !important',
      overflowWrap: 'anywhere',
      paddingInline: `${tokens.spacing[2]} !important`,
    },
  },
});

globalStyle(
  `${responsiveTable} th:nth-child(3), ${responsiveTable} td:nth-child(3)`,
  {
    '@media': {
      'screen and (max-width: 767px)': {
        display: 'none',
      },
    },
  },
);

export const titleLink = style({
  color: tokens.color.text.primary,
  cursor: 'pointer',
  display: 'block',
  overflowWrap: 'anywhere',
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

globalStyle(`${responsiveTable} [data-student-notice-row]`, {
  cursor: 'pointer',
  transitionDuration: 'var(--duration-fast)',
  transitionProperty: 'background-color, box-shadow',
  transitionTimingFunction: 'var(--ease-standard)',
});
globalStyle(`${responsiveTable} [data-student-notice-row]:hover`, {
  backgroundColor: tokens.color.background.muted,
  boxShadow: `inset 0 0 0 1px ${tokens.color.border.base}`,
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
      border: 0,
      borderRadius: 0,
      boxShadow: 'none',
      padding: 'var(--spacing-4) 0',
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
