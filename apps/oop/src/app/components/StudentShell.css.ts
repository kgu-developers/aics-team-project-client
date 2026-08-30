import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const shell = style({
  background: tokens.color.background.body,
  color: tokens.color.text.primary,
  minHeight: '100dvh',
});

export const shellPage = style({
  background: tokens.color.background.surface,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['6'],
  margin: '0 auto',
  maxWidth: 1280,
  minHeight: '100dvh',
  padding: '0 clamp(20px, 6.25vw, 80px) 24px',
  '@media': {
    '(max-width: 767px)': {
      padding: '0 0 20px',
    },
  },
});

export const shellHeader = style({
  alignItems: 'center',
  background: tokens.color.background.surface,
  borderBlockEnd: `1px solid ${tokens.color.border.base}`,
  boxSizing: 'border-box',
  display: 'flex',
  gap: tokens.spacing['4'],
  justifyContent: 'space-between',
  minHeight: 24,
  paddingBlockEnd: tokens.spacing['4'],
  paddingBlockStart: tokens.spacing['6'],
  position: 'sticky',
  top: 0,
  zIndex: 10,
  '@media': {
    '(max-width: 767px)': {
      columnGap: tokens.spacing['2'],
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      paddingBlockEnd: tokens.spacing['3'],
      paddingBlockStart: tokens.spacing['4'],
      paddingInline: tokens.spacing['4'],
      rowGap: 0,
    },
  },
});

export const shellBrand = style({
  alignItems: 'baseline',
  color: 'inherit',
  display: 'flex',
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textDecoration: 'none',
  '@media': {
    '(max-width: 767px)': {
      alignItems: 'center',
      flex: '1 1 auto',
      whiteSpace: 'nowrap',
    },
  },
});

export const shellCourse = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '@media': {
    '(max-width: 767px)': {
      display: 'none',
    },
  },
});

export const shellIdentity = style({
  marginLeft: '0.25em',
  '@media': {
    '(max-width: 767px)': {
      display: 'none',
    },
  },
});

export const shellCompactBrand = style({
  display: 'none',
  letterSpacing: '0.08em',
  lineHeight: 1,
  '@media': {
    '(max-width: 767px)': {
      display: 'inline-flex',
      flex: 'none',
    },
  },
});

export const shellContent = style({
  flex: 1,
  minWidth: 0,
});

export const shellFooter = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 105,
  '@media': {
    '(max-width: 767px)': {
      paddingInline: tokens.spacing['4'],
    },
  },
});

export const shellFooterBrand = style({
  alignItems: 'center',
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  width: '100%',
});

export const shellUniversityLogo = style({
  display: 'block',
  height: 'auto',
  width: 209,
});
