import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const milestone = style({
  background: tokens.color.background.card,
  borderRadius: 12,
  display: 'flex',
  scrollMarginTop: 96,
  '@media': {
    'screen and (max-width: 767px)': {
      borderRadius: 0,
      flexDirection: 'column',
    },
  },
});

globalStyle(`${milestone} .astryx-collapsible-trigger`, {
  borderBottom: `1px solid ${tokens.color.border.base}`,
  gap: 16,
  minHeight: 44,
  padding: '12px 16px',
});

globalStyle(`${milestone} .astryx-collapsible-trigger > span:first-child`, {
  alignItems: 'center',
  display: 'flex',
  flex: 1,
  gap: 16,
  minWidth: 0,
});

globalStyle(`${milestone} .astryx-collapsible-trigger > span:last-child`, {
  color: tokens.color.icon.primary,
  fontSize: 24,
});

globalStyle(`${milestone} .astryx-collapsible-content`, {
  paddingBlockStart: 0,
});

export const milestoneStatus = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color['border-emphasized']}`,
  borderRadius: '12px 0 0 12px',
  display: 'flex',
  flex: 'none',
  flexDirection: 'column',
  gap: 4,
  padding: '16px 12px',
  width: 140,
  '@media': {
    'screen and (max-width: 767px)': {
      alignItems: 'flex-start',
      borderInline: 0,
      borderRadius: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      width: '100%',
    },
  },
});

export const milestoneStatusOpen = style({
  gap: 8,
});

export const statusIndicator = style({
  alignItems: 'center',
  display: 'flex',
  gap: 7,
  '@media': {
    'screen and (max-width: 767px)': {
      width: '100%',
    },
  },
});

export const statusLabel = style({
  color: tokens.color.text.primary,
  fontFamily: `Inter, ${tokens['font-family'].body}`,
  fontSize: 13,
  fontWeight: 400,
  margin: 0,
});

export const statusDue = style({
  color: tokens.color.text.disabled,
  fontSize: 12,
  fontWeight: 500,
  margin: 0,
});

export const statusTitle = style({
  color: tokens.color.text.primary,
  fontSize: 12,
  fontWeight: 600,
  margin: 0,
});

export const statusTeam = style({
  color: tokens.color.text.primary,
  fontSize: 12,
  fontWeight: 400,
  margin: 0,
});

export const milestoneContent = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderLeft: 0,
  borderRadius: '0 12px 12px 0',
  flex: 1,
  minWidth: 0,
  '@media': {
    'screen and (max-width: 767px)': {
      borderInline: 0,
      borderRadius: 0,
    },
  },
});

export const milestoneHeader = style({
  alignItems: 'center',
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  gap: 16,
  minHeight: 44,
  padding: '12px 16px',
});

export const milestoneTitle = style({
  color: tokens.color.text.primary,
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
});

export const milestonePeriod = style({
  color: tokens.color.text.disabled,
  fontSize: 12,
  fontWeight: 600,
  margin: '0 0 0 auto',
  maxWidth: '65%',
  textAlign: 'right',
  whiteSpace: 'normal',
});

export const milestoneRows = style({
  display: 'flex',
  flexDirection: 'column',
});

export const milestoneRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  '@media': {
    'screen and (max-width: 767px)': {
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
    },
  },
});

export const rowCell = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: 43,
  padding: 10,
});

export const rowLabel = style({
  color: tokens.color.text.primary,
  fontSize: 14,
  fontWeight: 500,
  margin: 0,
});

export const rowValue = style({
  fontSize: 14,
  fontWeight: 500,
  margin: 0,
});

export const rowValuePrimary = style({
  color: tokens.color.text.accent,
});

export const rowValueDefault = style({
  color: tokens.color.text.primary,
});

export const rowValueMuted = style({
  color: tokens.color.text.disabled,
});

export const rowAction = style({
  background: tokens.color.accent,
  borderRadius: 8,
  fontFamily: `Inter, ${tokens['font-family'].body}`,
  fontSize: 14,
  fontWeight: 500,
  minWidth: 84,
  paddingInline: 12,
  ':hover': {
    background: tokens.color.accent,
  },
  ':focus-visible': {
    background: tokens.color.accent,
  },
});
