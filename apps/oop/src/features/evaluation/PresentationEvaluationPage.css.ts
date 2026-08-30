import { tokens } from '@aics/design-system';
import { globalStyle, keyframes, style } from '@vanilla-extract/css';

const revealTeamContent = keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const root = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['6'],
  minWidth: 0,
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      paddingInline: tokens.spacing['4'],
    },
  },
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
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});
export const teamHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  padding: `0 ${tokens.spacing['2']}`,
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
globalStyle(`${scoreList} [role='radiogroup']`, {
  '@media': {
    'screen and (max-width: 560px)': {
      gap: tokens.spacing['1'],
      justifyContent: 'space-between',
    },
  },
});
globalStyle(`${scoreList} [role='radiogroup'] label`, {
  '@media': {
    'screen and (max-width: 560px)': {
      whiteSpace: 'nowrap',
    },
  },
});
export const navigation = style({
  alignItems: 'center',
  display: 'grid',
  gap: tokens.spacing['2'],
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  '@media': {
    '(max-width: 560px)': { gridTemplateColumns: '1fr 1fr' },
  },
});
export const navigationStatus = style({
  textAlign: 'center',
  '@media': {
    '(max-width: 560px)': {
      gridColumn: '1 / -1',
      gridRow: 1,
    },
  },
});
export const actionFooter = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
  width: '100%',
});
export const error = style({ color: tokens.color.text.red, margin: 0 });
export const helper = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
});
