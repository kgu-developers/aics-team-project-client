import { tokens } from '@aics/design-system';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';

const revealTeamContent = keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const root = style({
  boxSizing: 'border-box',
  display: 'grid',
  gap: tokens.spacing['4'],
  gridTemplateColumns: 'minmax(0, 1fr)',
  minWidth: 0,
  width: '100%',
  paddingBottom: '96px',
  '@media': {
    'screen and (min-width: 1024px)': {
      gridTemplateColumns: '400px minmax(0, 1fr)',
    },
    'screen and (max-width: 767px)': {
      paddingInline: tokens.spacing['4'],
    },
  },
});
globalStyle(`${root} > header`, {
  gridColumn: '1 / -1',
  '@media': {
    'screen and (min-width: 1024px)': { gridColumn: '2', gridRow: '1' },
  },
});
export const sidebar = style({
  display: 'contents',
  '@media': {
    'screen and (min-width: 1024px)': {
      alignSelf: 'start',
      background: tokens.color.background.card,
      border: `1px solid ${tokens.color.border.base}`,
      borderRadius: tokens.radius.element,
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing['3'],
      gridColumn: '1',
      gridRow: '1 / span 2',
      height: 'clamp(360px, calc(100dvh - 180px), 900px)',
      minWidth: 0,
      padding: tokens.spacing['4'],
      position: 'sticky',
      top: tokens.spacing['3'],
    },
  },
});
export const sidebarHeading = style({
  display: 'none',
  '@media': {
    'screen and (min-width: 1024px)': {
      display: 'grid',
      gap: tokens.spacing['1'],
    },
  },
});
export const teamNavigation = style({
  display: 'none',
  '@media': {
    'screen and (min-width: 1024px)': {
      display: 'grid',
      gap: tokens.spacing['1'],
      alignContent: 'start',
      flex: '0 0 auto',
      maxHeight: 160,
      minHeight: 112,
      overflowY: 'auto',
      order: 1,
    },
  },
});
export const teamNavigationItem = style({
  alignItems: 'center',
  display: 'grid',
  gap: tokens.spacing['2'],
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  minWidth: 0,
});
export const teamNavigationButton = style({
  background: 'transparent',
  border: 0,
  color: tokens.color.text.primary,
  justifyContent: 'flex-start',
  minWidth: 0,
  overflow: 'hidden',
  padding: `${tokens.spacing['1']} 0`,
  textOverflow: 'ellipsis',
  width: '100%',
  selectors: {
    '&:hover': { background: 'transparent', textDecoration: 'underline' },
    '&:focus-visible': { outline: `2px solid ${tokens.color.accent}` },
  },
});
export const teamStatusDot = style({ alignItems: 'center', display: 'flex' });
export const order = style({ color: tokens.color.text.primary });
export const selectedOrder = style({
  color: tokens.color.text.accent,
  fontWeight: tokens['font-weight'].semibold,
});
export const contextHeader = style({
  width: '100%',
});
export const headerContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
});
export const title = style({
  color: tokens.color.text.primary,
  fontSize: tokens['font-size']['2xl'],
  margin: 0,
});
export const description = style({
  color: tokens.color.text.secondary,
  margin: 0,
});
export const windowTime = style({
  color: tokens.color.text.primary,
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
});
export const windowRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${tokens.spacing['2']} ${tokens.spacing['5']}`,
});
export const timer = style({
  color: tokens.color.text.accent,
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
});
export const status = style({ color: tokens.color.text.secondary, margin: 0 });
export const submitPanel = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
});
export const submitTitle = style({
  color: tokens.color.text.primary,
  fontWeight: 600,
  margin: 0,
});
export const dynamicContent = style({
  animation: `${revealTeamContent} ${tokens.duration.fast} ${tokens.ease.standard}`,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['5'],
  minWidth: 0,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
    'screen and (min-width: 1024px)': { gridColumn: '2', gridRow: '2' },
  },
});
export const teamHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  padding: `0 ${tokens.spacing['2']}`,
});
export const teamIdentity = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['4'],
  minWidth: 0,
});
export const orderBadge = style({
  alignItems: 'center',
  background: tokens.color.accent,
  borderRadius: tokens.radius.element,
  color: tokens.color['on-accent'],
  display: 'flex',
  flex: '0 0 auto',
  fontSize: tokens['font-size']['2xl'],
  fontWeight: tokens['font-weight'].bold,
  height: '64px',
  justifyContent: 'center',
  width: '64px',
});
export const teamName = style({
  color: tokens.color.text.accent,
  fontWeight: tokens['font-weight'].semibold,
  margin: 0,
});
export const teamEyebrow = style({
  color: tokens.color.text.accent,
  fontSize: tokens['font-size'].sm,
  fontWeight: tokens['font-weight'].semibold,
  margin: 0,
});
export const teamTitle = style({
  color: tokens.color.text.primary,
  fontSize: tokens['font-size']['3xl'],
  margin: 0,
});
export const meta = style({
  color: tokens.color.text.secondary,
  margin: 0,
});
export const contentDivider = style({
  margin: 0,
});
export const contentGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['5'],
  width: '100%',
});
export const cardContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
});
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
});
export const sectionTitle = style({
  color: tokens.color.text.primary,
  fontSize: 18,
  margin: 0,
});
export const previewPage = style({
  flex: '0 0 min(82vw, 720px)',
  margin: 0,
  minWidth: 280,
  position: 'relative',
  scrollSnapAlign: 'start',
});
export const previewImage = style({
  aspectRatio: '16 / 9',
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  display: 'block',
  objectFit: 'contain',
  width: '100%',
});
export const previewCaption = style({
  background: tokens.color.background.card,
  borderRadius: tokens.radius.element,
  bottom: tokens.spacing['3'],
  color: tokens.color.text.secondary,
  fontSize: 12,
  padding: `${tokens.spacing['1']} ${tokens.spacing['2']}`,
  position: 'absolute',
  right: tokens.spacing['3'],
});
export const bodyText = style({
  color: tokens.color.text.secondary,
  lineHeight: 1.65,
  margin: 0,
});
export const detailList = style({
  color: tokens.color.text.secondary,
  display: 'grid',
  gap: tokens.spacing['3'],
  margin: 0,
  paddingLeft: tokens.spacing['5'],
});
export const screenGrid = style({
  display: 'grid',
  gap: tokens.spacing['4'],
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': { '(max-width: 680px)': { gridTemplateColumns: '1fr' } },
});
export const screenItem = style({
  display: 'grid',
  gap: tokens.spacing['2'],
});
export const screenImage = style({
  aspectRatio: '16 / 10',
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  objectFit: 'cover',
  width: '100%',
});
export const link = style({
  color: tokens.color.text.accent,
});
globalStyle(`${detailList} li`, {
  display: 'grid',
  gap: tokens.spacing['1'],
});
globalStyle(`${screenItem} p`, {
  color: tokens.color.text.secondary,
  margin: 0,
});
export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['5'],
});
export const scoreList = style({
  width: '100%',
});
export const scoreTableScroll = style({ overflowX: 'auto', width: '100%' });
export const scoreTable = style({
  borderCollapse: 'collapse',
  minWidth: 336,
  tableLayout: 'fixed',
  width: '100%',
});
globalStyle(`${scoreTable} th, ${scoreTable} td`, {
  borderBottom: `1px solid ${tokens.color.border.base}`,
  padding: `${tokens.spacing['2']} ${tokens.spacing['1']}`,
  textAlign: 'left',
  verticalAlign: 'middle',
});
globalStyle(`${scoreTable} th:first-child`, { width: 104 });
globalStyle(`${scoreTable} tbody th`, {
  color: tokens.color.text.primary,
  fontSize: 13,
  fontWeight: 600,
});
export const scoreMax = style({
  color: tokens.color.text.secondary,
  display: 'block',
  fontSize: 11,
  fontWeight: 400,
});
globalStyle(`${scoreList} [role='radiogroup']`, {
  display: 'grid',
  gap: 0,
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  width: '100%',
});
globalStyle(`${scoreList} [role='radiogroup'] label`, {
  whiteSpace: 'nowrap',
});
export const navigation = style({
  alignItems: 'center',
  display: 'grid',
  gap: tokens.spacing['2'],
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
});
export const navigationStatus = style({
  minWidth: 0,
  overflow: 'hidden',
  textAlign: 'center',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '@media': {
    '(max-width: 560px)': { fontSize: 12 },
  },
});
export const actionFooter = style({
  display: 'block',
  boxSizing: 'border-box',
  marginInline: 'auto',
  maxWidth: 1120,
  width: '100%',
  borderRadius: 0,
});
export const mobileEvaluationTrigger = style({
  display: 'flex',
  justifyContent: 'flex-end',
  paddingInline: tokens.spacing['2'],
  '@media': { 'screen and (min-width: 1024px)': { display: 'none' } },
});
export const stickyFooter = style({
  bottom: 0,
  left: 0,
  position: 'fixed',
  right: 0,
  zIndex: 20,
  borderTop: `1px solid ${tokens.color.border.base}`,
  background: tokens.color.background.card,
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)',
});
export const evaluationPanel = style({
  borderTop: `1px solid ${tokens.color.border.base}`,
  boxSizing: 'border-box',
  flex: '1 1 auto',
  maxHeight: 'none',
  minHeight: 0,
  order: 2,
  overflowY: 'auto',
  padding: `${tokens.spacing['3']} 0`,
  width: '100%',
});
export const mobileSheetContent = style({
  display: 'grid',
  gap: tokens.spacing['4'],
  padding: tokens.spacing['4'],
});
export const panelHeading = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'space-between',
});
export const error = style({ color: tokens.color.text.red, margin: 0 });
export const helper = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
});
export const confirmationDialog = style({
  display: 'grid',
  gap: tokens.spacing['4'],
  padding: tokens.spacing['5'],
});
export const previewTitle = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
});
export const tableScroll = style({
  overflowX: 'auto',
  width: '100%',
});
export const table = style({
  borderCollapse: 'collapse',
  fontSize: 14,
  minWidth: 320,
  width: '100%',
});
globalStyle(`${table} th, ${table} td`, {
  borderBottom: `1px solid ${tokens.color.border.base}`,
  padding: `${tokens.spacing['2']} ${tokens.spacing['3']}`,
  textAlign: 'left',
  verticalAlign: 'top',
});
globalStyle(`${table} th`, {
  color: tokens.color.text.secondary,
  fontWeight: 600,
  whiteSpace: 'nowrap',
});
globalStyle(`${table} td`, {
  color: tokens.color.text.primary,
});
