import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const shell = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  position: 'relative',
  width: '100%',
});

export const standaloneShell = style({
  minHeight: '100dvh',
  padding: tokens.spacing['6'],
  '@media': {
    'screen and (max-width: 540px)': {
      padding: 0,
    },
  },
});

export const embeddedShell = style({
  minHeight: 'calc(100dvh - 9rem)',
  padding: `${tokens.spacing['5']} 0`,
  '@media': {
    'screen and (max-width: 540px)': {
      minHeight: 0,
      padding: 0,
    },
  },
});

export const surface = style({
  display: 'flex',
  minHeight: 606,
  width: 'min(100%, 460px)',
});

export const embeddedSurface = style({
  '@media': {
    'screen and (max-width: 540px)': {
      border: 0,
      borderRadius: 0,
      minHeight: 'auto',
      width: '100%',
    },
  },
});

export const standaloneSurface = style({
  '@media': {
    'screen and (max-width: 540px)': {
      border: 0,
      borderRadius: 0,
      minHeight: '100dvh',
      width: '100%',
    },
  },
});

export const content = style({
  boxSizing: 'border-box',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
  padding: '52px 46px',
  width: '100%',
  '@media': {
    'screen and (max-width: 540px)': {
      padding: '32px 24px',
    },
  },
});

export const embeddedContent = style({
  '@media': {
    'screen and (max-width: 540px)': {
      paddingBlock: tokens.spacing['5'],
    },
  },
});

export const eyebrow = style({
  left: 64,
  margin: 0,
  position: 'absolute',
  top: 46,
  '@media': {
    'screen and (max-width: 700px)': {
      display: 'none',
    },
  },
});
