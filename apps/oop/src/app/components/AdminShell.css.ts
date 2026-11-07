import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

import { layoutTokens } from '~/app/tokens.css';

export const shell = style({
  background: tokens.color.background.body,
  display: 'grid',
  gridTemplateColumns: `${layoutTokens.workspace['sidebar-width']} minmax(0, 1fr)`,
  minHeight: '100dvh',
  transitionDuration: tokens.duration['fast-min'],
  transitionProperty: 'grid-template-columns',
  transitionTimingFunction: tokens.ease.standard,
});

export const shellCollapsed = style({
  gridTemplateColumns: '0 minmax(0, 1fr)',
});

export const sidebar = style({
  alignSelf: 'start',
  background: tokens.color.text.primary,
  color: tokens.color.background.surface,
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  minWidth: 0,
  overflow: 'visible',
  padding: '24px 16px 16px',
  position: 'sticky',
  top: 0,
  transitionDuration: tokens.duration['fast-min'],
  transitionProperty: 'padding',
  transitionTimingFunction: tokens.ease.standard,
  zIndex: 20,
});

export const sidebarCollapsed = style({
  paddingInline: 0,
});

export const sidebarContent = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
  overflowY: 'auto',
});

export const sidebarContentCollapsed = style({
  display: 'none',
  pointerEvents: 'none',
});

export const sidebarBoundaryToggle = style({
  alignItems: 'center',
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: '0 8px 8px 0',
  color: tokens.color.text.primary,
  cursor: 'pointer',
  display: 'inline-flex',
  height: 40,
  justifyContent: 'center',
  opacity: 0,
  padding: 0,
  position: 'absolute',
  right: -20,
  top: '50%',
  transform: 'translateY(-50%)',
  transition: 'opacity 120ms ease, background-color 120ms ease',
  width: 20,
  zIndex: 1,
  selectors: {
    '&::before': {
      background: 'transparent',
      content: '',
      height: '100dvh',
      left: -2,
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 2,
    },
    '&:hover': {
      background: tokens.color.background.muted,
      opacity: 1,
    },
    '&:hover::before': {
      background: tokens.color.accent,
    },
    '&:focus-visible': {
      opacity: 1,
      outline: `2px solid ${tokens.color.accent}`,
      outlineOffset: 2,
    },
    '&:focus-visible::before': {
      background: tokens.color.accent,
    },
  },
});

export const sidebarBoundaryToggleCollapsed = style({
  borderRadius: 0,
  height: '100dvh',
  opacity: 0,
  right: -18,
  top: 0,
  transform: 'none',
  width: 18,
  '@media': {
    '(hover: none)': {
      background: tokens.color.background.muted,
      opacity: 1,
      right: 0,
    },
  },
  selectors: {
    '&::before': {
      display: 'none',
    },
    '&:hover': {
      background: tokens.color.background.muted,
      opacity: 1,
    },
    '&:hover::before': { display: 'none' },
  },
});

globalStyle(`${sidebar}:hover ${sidebarBoundaryToggle}`, {
  opacity: 1,
});

export const brand = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '0 10px',
});
export const nav = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
  marginTop: 58,
});
const navBase = {
  alignItems: 'center',
  background: 'transparent',
  border: 0,
  borderRadius: tokens.radius.container,
  color: tokens.color.background.surface,
  cursor: 'pointer',
  display: 'flex',
  font: 'inherit',
  justifyContent: 'space-between',
  minHeight: 42,
  padding: '0 12px',
  textAlign: 'left' as const,
  textDecoration: 'none',
};
export const navItem = style(navBase);
export const activeNav = style({
  ...navBase,
  background: 'rgba(255, 255, 255, 0.06)',
});
export const navLabel = style({
  alignItems: 'center',
  display: 'inline-flex',
  gap: tokens.spacing['3'],
  minWidth: 0,
});
globalStyle(`${navLabel} svg`, {
  flexShrink: 0,
});
globalStyle(navItem + ':disabled', {
  color: tokens.color.text.disabled,
  cursor: 'not-allowed',
});
export const count = style({
  alignItems: 'center',
  background: tokens.color.accent,
  borderRadius: tokens.radius.full,
  color: tokens.color.background.surface,
  display: 'inline-flex',
  fontSize: 11,
  height: 20,
  justifyContent: 'center',
  width: 20,
});
globalStyle(navItem + ':disabled ' + count, {
  opacity: 0.6,
});
export const main = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});
export const content = style({
  flex: 1,
  minWidth: 0,
});
export const footer = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 105,
  paddingBlockStart: tokens.spacing['4'],
  paddingInline: 'clamp(20px, 5vw, 48px)',
});
export const footerBrand = style({
  alignItems: 'center',
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
});
export const footerMeta = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  paddingBottom: tokens.spacing['5'],
});
const darkLogoTextOverlay = {
  backgroundImage: "url('/brand/kyonggi-university.png')",
  backgroundSize: '100% 100%',
  display: 'none',
  filter: 'brightness(0) invert(1)',
  inset: 0,
  pointerEvents: 'none' as const,
  position: 'absolute' as const,
};

export const universityLogoContainer = style({
  position: 'relative',
  width: 209,
});

export const universityLogoLeftTextOverlay = style({
  ...darkLogoTextOverlay,
  clipPath: 'inset(0 76% 0 0)',
  '@media': {
    '(prefers-color-scheme: dark)': { display: 'block' },
  },
});

export const universityLogoRightTextOverlay = style({
  ...darkLogoTextOverlay,
  clipPath: 'inset(0 0 0 46.7%)',
  '@media': {
    '(prefers-color-scheme: dark)': { display: 'block' },
  },
});

export const universityLogo = style({
  display: 'block',
  height: 'auto',
  width: '100%',
});
globalStyle(brand + ' span', {
  color: tokens.color.text.disabled,
  fontSize: 12,
});
globalStyle(brand + ' small', {
  color: tokens.color.text.disabled,
  fontSize: 11,
  marginTop: 8,
});
