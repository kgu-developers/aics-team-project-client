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
  padding: '24px clamp(20px, 6.25vw, 80px)',
  '@media': {
    '(max-width: 720px)': {
      padding: 20,
    },
  },
});

export const shellHeader = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['4'],
  justifyContent: 'space-between',
  minHeight: 24,
  '@media': {
    '(max-width: 720px)': {
      alignItems: 'flex-start',
    },
  },
});

export const shellBrand = style({
  alignItems: 'baseline',
  color: 'inherit',
  display: 'flex',
  minWidth: 0,
  textDecoration: 'none',
  '@media': {
    '(max-width: 720px)': {
      flexDirection: 'column',
    },
  },
});

export const shellIdentity = style({
  marginLeft: '0.25em',
  '@media': {
    '(max-width: 720px)': {
      marginLeft: 0,
    },
  },
});

export const shellActions = style({
  flex: 'none',
});

export const shellContent = style({
  flex: 1,
  minWidth: 0,
});

export const shellFooter = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 105,
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
