import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const headerActions = style({
  alignItems: 'center',
  display: 'flex',
  flex: '0 1 auto',
  flexWrap: 'nowrap',
  gap: tokens.spacing['4'],
  justifyContent: 'flex-end',
  minWidth: 0,
  '@media': {
    '(max-width: 767px)': {
      display: 'contents',
    },
  },
});

export const headerMenuPanel = style({
  display: 'contents',
  '@media': {
    '(max-width: 767px)': {
      display: 'none',
      flexDirection: 'column',
      gap: tokens.spacing['3'],
      gridColumn: '1 / -1',
      gridRow: 2,
      minWidth: 0,
      paddingBlockStart: tokens.spacing['3'],
      width: '100%',
    },
  },
});

export const headerMenuPanelOpen = style({
  '@media': {
    '(max-width: 767px)': {
      display: 'flex',
    },
  },
});

export const headerControls = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['2'],
  '@media': {
    '(max-width: 767px)': {
      gridColumn: 2,
      gridRow: 1,
    },
  },
});

export const menuToggle = style({
  display: 'none',
  '@media': {
    '(max-width: 767px)': {
      display: 'inline-flex',
    },
  },
});

export const profileTrigger = style({
  flexShrink: 0,
  overflow: 'visible',
});

export const headerNav = style({
  alignItems: 'center',
  display: 'flex',
  flex: '0 1 auto',
  flexWrap: 'nowrap',
  gap: tokens.spacing['4'],
  minWidth: 0,
  '@media': {
    '(max-width: 767px)': {
      alignItems: 'stretch',
      borderBlockStart: `1px solid ${tokens.color.border.base}`,
      display: 'none',
      flexDirection: 'column',
      gap: tokens.spacing['1'],
      paddingBlockStart: tokens.spacing['2'],
      width: '100%',
    },
  },
});

export const headerNavOpen = style({
  '@media': {
    '(max-width: 767px)': {
      display: 'flex',
    },
  },
});

const navLinkBase = {
  alignItems: 'center',
  borderRadius: tokens.radius.element,
  display: 'inline-flex',
  fontSize: tokens['font-size'].sm,
  fontWeight: tokens['font-weight'].medium,
  minHeight: 32,
  paddingInline: tokens.spacing['2'],
  textDecoration: 'none',
  transitionDuration: tokens.duration['fast-min'],
  transitionProperty: 'background-color, color',
  transitionTimingFunction: tokens.ease.standard,
  whiteSpace: 'nowrap',
  '@media': {
    '(max-width: 767px)': {
      justifyContent: 'flex-start',
      minHeight: 40,
      width: '100%',
    },
  },
};

export const navLink = style({
  ...navLinkBase,
  color: tokens.color.text.secondary,
});

export const navLinkActive = style({
  ...navLinkBase,
  color: tokens.color.text.accent,
  fontWeight: tokens['font-weight'].semibold,
});

globalStyle(`${navLink}:hover, ${navLinkActive}:hover`, {
  background: tokens.color.background.muted,
});

globalStyle(`${navLink}:focus-visible, ${navLinkActive}:focus-visible`, {
  outline: `2px solid ${tokens.color.accent}`,
  outlineOffset: 2,
});

export const profilePopover = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
  minWidth: 0,
  width: '100%',
});

export const profileIdentity = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['3'],
});

export const profileIdentityCopy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
  minWidth: 0,
});

export const profileName = style({
  margin: 0,
});

export const profileDetails = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  margin: 0,
});

export const profileDetailRow = style({
  display: 'grid',
  gap: tokens.spacing['3'],
  gridTemplateColumns: '52px minmax(0, 1fr)',
});

globalStyle(`${profileDetailRow} dt`, {
  color: tokens.color.text.secondary,
});

globalStyle(`${profileDetailRow} dd`, {
  margin: 0,
  overflowWrap: 'anywhere',
});

export const profileActions = style({
  borderBlockStart: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  flexDirection: 'row',
  gap: tokens.spacing['2'],
  paddingBlockStart: tokens.spacing['3'],
});

globalStyle(`${profileActions} > button`, {
  flex: '1 1 0',
  minWidth: 0,
});

export const passwordForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
});

export const passwordTitle = style({
  margin: 0,
});

export const passwordDescription = style({
  margin: 0,
});

export const passwordActions = style({
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'flex-end',
  paddingBlockStart: tokens.spacing['1'],
});

export const passwordError = style({
  color: tokens.color.text.red,
  margin: 0,
});
