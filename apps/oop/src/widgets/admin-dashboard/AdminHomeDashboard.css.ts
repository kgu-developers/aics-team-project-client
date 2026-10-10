import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const dashboard = style({
  background: tokens.color.background.body,
  display: 'grid',
  gridTemplateColumns: '240px minmax(0, 1fr)',
  minHeight: '100dvh',
  '@media': { '(max-width: 900px)': { gridTemplateColumns: '1fr' } },
});
export const sidebar = style({
  background: tokens.color.text.primary,
  color: tokens.color.background.surface,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
  padding: '24px 16px 16px',
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
  gap: 4,
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
};
export const navItem = style(navBase);
export const activeNav = style({
  ...navBase,
  background: 'rgba(255, 255, 255, 0.06)',
});
export const count = style({
  alignItems: 'center',
  background: tokens.color.accent,
  borderRadius: 999,
  color: tokens.color.background.surface,
  display: 'inline-flex',
  fontSize: 11,
  height: 20,
  justifyContent: 'center',
  width: 20,
});
export const account = style({
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.08)',
  borderRadius: tokens.radius.container,
  display: 'flex',
  gap: 10,
  marginTop: 'auto',
  padding: 12,
});
globalStyle(account + ' div', {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});
export const avatar = style({
  background: tokens.color.icon.disabled,
  borderRadius: '50%',
  display: 'block',
  height: 28,
  width: 28,
});
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minWidth: 0,
});
export const sectionHeader = style({
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
});
export const scheduleHeaderActions = style({
  alignItems: 'center',
  display: 'flex',
  flexShrink: 0,
  gap: tokens.spacing['3'],
  '@media': {
    '(max-width: 640px)': {
      alignItems: 'flex-end',
      flexDirection: 'column',
      gap: tokens.spacing['2'],
    },
  },
});
export const scheduleState = style({
  color: tokens.color.text.secondary,
  margin: 0,
  padding: 24,
});
export const scheduleTableCard = style({
  minWidth: 0,
  overflow: 'hidden',
});
export const scheduleTableScroll = style({
  overflowX: 'auto',
  width: '100%',
});
export const scheduleTable = style({
  borderCollapse: 'collapse',
  minWidth: 900,
  tableLayout: 'fixed',
  width: '100%',
});
export const scheduleSection = style({
  alignItems: 'center',
  color: tokens.color.text.primary,
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'space-between',
  minHeight: 78,
  minWidth: 0,
  padding: `${tokens.spacing['3']} ${tokens.spacing['4']}`,
  textDecoration: 'none',
  transition: 'background-color var(--duration-fast) var(--ease-standard)',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${tokens.color.accent}`,
      outlineOffset: -3,
    },
    '&:hover': { background: tokens.color.background.muted },
  },
});
export const scheduleSectionLabel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
  minWidth: 0,
});
globalStyle(`${scheduleSectionLabel} strong`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const scheduleSectionTime = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  lineHeight: 1.35,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const scheduleSectionChevron = style({
  color: tokens.color.icon.disabled,
  flexShrink: 0,
  fontSize: 20,
  lineHeight: 1,
});
export const scheduleMilestoneItem = style({
  alignItems: 'flex-start',
  color: tokens.color.text.primary,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  justifyContent: 'center',
  minHeight: 78,
  minWidth: 0,
  padding: `${tokens.spacing['3']} ${tokens.spacing['3']}`,
  textDecoration: 'none',
  transition: 'background-color var(--duration-fast) var(--ease-standard)',
});
export const scheduleMilestoneDate = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 400,
  textAlign: 'left',
  whiteSpace: 'nowrap',
});
globalStyle(`${scheduleTable} th`, {
  background: tokens.color.background.muted,
  borderBottom: `1px solid ${tokens.color.border.base}`,
  borderRight: `1px solid ${tokens.color.border.base}`,
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 500,
  padding: `${tokens.spacing['3']} ${tokens.spacing['3']}`,
  textAlign: 'left',
  whiteSpace: 'nowrap',
});
globalStyle(`${scheduleTable} th:first-child`, {
  paddingLeft: tokens.spacing['4'],
  width: 150,
});
globalStyle(`${scheduleTable} th:last-child`, {
  borderRight: 0,
});
globalStyle(`${scheduleTable} td`, {
  borderBottom: `1px solid ${tokens.color.border.base}`,
  borderRight: `1px solid ${tokens.color.border.base}`,
  padding: 0,
  verticalAlign: 'middle',
});
globalStyle(`${scheduleTable} td:last-child`, {
  borderRight: 0,
});
globalStyle(`${scheduleTable} tbody tr:last-child td`, {
  borderBottom: 0,
});
export const sectionActions = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['2'],
});
export const communicationTabs = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['2'],
  minWidth: 0,
});
export const grid = style({
  alignItems: 'stretch',
  display: 'grid',
  gap: tokens.spacing['5'],
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': { '(max-width: 720px)': { gridTemplateColumns: '1fr' } },
});
export const more = style({
  background: 'transparent',
  border: 0,
  color: tokens.color.text.primary,
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
  padding: 0,
  textDecoration: 'none',
});
export const dashboardPanel = style({
  background: tokens.color.background.surface,
  border: '1px solid ' + tokens.color.border.base,
  borderRadius: tokens.radius.container,
  minHeight: 250,
  minWidth: 0,
  overflow: 'hidden',
});
export const dashboardPanelHeader = style({
  alignItems: 'center',
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
  minHeight: 58,
  padding: `0 ${tokens.spacing['4']}`,
});
export const dashboardPanelBody = style({
  padding: `0 ${tokens.spacing['4']}`,
});
export const panelState = style({
  color: tokens.color.text.secondary,
  margin: 0,
  padding: `${tokens.spacing['5']} 0`,
});
export const list = style({
  display: 'flex',
  flexDirection: 'column',
  listStyle: 'none',
  margin: 0,
  padding: 0,
});
export const item = style({
  alignItems: 'center',
  display: 'grid',
  gap: tokens.spacing['3'],
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  minHeight: 78,
  padding: `${tokens.spacing['4']} 0`,
  transition: 'background-color var(--duration-fast) var(--ease-standard)',
  '@media': {
    '(max-width: 480px)': {
      gridTemplateColumns: 'auto minmax(0, 1fr)',
    },
  },
});
export const itemLeading = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minWidth: 54,
});
export const itemContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
  minWidth: 0,
});
export const itemTitleRow = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['2'],
  minWidth: 0,
});
export const label = style({
  background: tokens.color.background.blue,
  borderRadius: 999,
  color: tokens.color.text.accent,
  display: 'block',
  fontSize: 12,
  maxWidth: 76,
  overflow: 'hidden',
  padding: '5px 10px',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const noticeBullet = style({
  background: tokens.color.accent,
  borderRadius: 999,
  height: 8,
  width: 8,
});
export const itemTitle = style({
  color: tokens.color.text.primary,
  flex: '1 1 auto',
  fontWeight: 500,
  lineHeight: 1.4,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
globalStyle(`${itemTitle}[href]`, {
  color: tokens.color.text.primary,
  textDecoration: 'none',
});
export const itemSubtitle = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  lineHeight: 1.35,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const date = style({
  color: tokens.color.text.secondary,
  flexShrink: 0,
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.3,
  textAlign: 'right',
  whiteSpace: 'nowrap',
  '@media': {
    '(max-width: 480px)': {
      gridColumn: 2,
      justifySelf: 'start',
    },
  },
});
globalStyle(item + ':hover', {
  background: tokens.color.background.muted,
});
globalStyle(`${scheduleMilestoneItem}[href]:hover`, {
  background: tokens.color.background.muted,
});
globalStyle(`${item} + ${item}`, {
  borderTop: `1px solid ${tokens.color.border.base}`,
});
globalStyle(brand + ' span, ' + account + ' span', {
  color: tokens.color.text.disabled,
  fontSize: 12,
});
globalStyle(brand + ' small', {
  color: tokens.color.text.disabled,
  fontSize: 11,
  marginTop: 8,
});
