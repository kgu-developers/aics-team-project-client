import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const hero = style({
  background: tokens.color.background.body,
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: '32px 32px',
  '@media': {
    'screen and (max-width: 767px)': {
      gap: 24,
      padding: '24px 20px',
    },
  },
});

export const heroBody = style({
  alignItems: 'stretch',
  display: 'flex',
  gap: 24,
  '@media': {
    'screen and (max-width: 767px)': {
      flexDirection: 'column',
    },
  },
});

export const heroCopy = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
});

export const heroDate = style({
  color: tokens.color.text.disabled,
  fontSize: 18,
  fontWeight: 500,
  margin: 0,
});

export const heroHeading = style({
  color: tokens.color.text.primary,
  fontSize: 28,
  fontWeight: 600,
  margin: 0,
  whiteSpace: 'pre-line',
  '@media': {
    'screen and (max-width: 767px)': {
      fontSize: 24,
    },
  },
});

export const heroDesc = style({
  color: tokens.color.text.disabled,
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.4,
  margin: 0,
  whiteSpace: 'pre-line',
  '@media': {
    'screen and (max-width: 767px)': {
      fontSize: 16,
    },
  },
});

export const heroSpacer = style({
  flex: 1,
});

export const cta = style({
  alignSelf: 'flex-start',
  background: tokens.color.accent,
  borderRadius: 12,
  flex: 'none',
  fontSize: 20,
  fontWeight: 500,
  height: 'auto',
  padding: '20px 24px',
  ':hover': {
    background: tokens.color.accent,
  },
  ':focus-visible': {
    background: tokens.color.accent,
  },
  '@media': {
    'screen and (max-width: 767px)': {
      alignSelf: 'stretch',
    },
  },
});

export const shortcut = style({
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 12,
  display: 'flex',
  flex: 'none',
  flexDirection: 'column',
  overflow: 'hidden',
  width: 566,
  '@media': {
    'screen and (max-width: 767px)': {
      width: '100%',
    },
  },
});

export const tabs = style({
  display: 'flex',
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      minWidth: 0,
    },
  },
});

export const tab = style({
  alignItems: 'center',
  background: tokens.color.background.body,
  border: 0,
  color: tokens.color.text.primary,
  cursor: 'pointer',
  display: 'flex',
  flex: 1,
  fontFamily: 'inherit',
  fontSize: 20,
  fontWeight: 500,
  gap: 16,
  justifyContent: 'center',
  padding: '16.5px 24px',
  '@media': {
    'screen and (max-width: 767px)': {
      flexDirection: 'column',
      fontSize: 12,
      gap: 4,
      minWidth: 0,
      padding: '12px 8px',
    },
  },
});

globalStyle(`${tab} svg`, {
  color: tokens.color.icon.accent,
  '@media': {
    'screen and (max-width: 767px)': {
      height: 24,
      width: 24,
    },
  },
});

export const tabActive = style({
  background: tokens.color.background.card,
});

export const noticeList = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '12px 16px',
});

export const notice = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '6px 0',
});

export const noticeMeta = style({
  alignItems: 'baseline',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
  '@media': {
    'screen and (max-width: 767px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      gap: 4,
    },
  },
});

export const noticeTitle = style({
  color: tokens.color.text.primary,
  fontFamily: `Inter, ${tokens['font-family'].body}`,
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.21,
  margin: 0,
});

export const noticeContent = style({
  color: tokens.color.text.secondary,
  flex: 1,
  fontFamily: `Inter, ${tokens['font-family'].body}`,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.21,
  margin: 0,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const noticeDate = style({
  color: tokens.color.text.secondary,
  flex: 'none',
  fontFamily: `Inter, ${tokens['font-family'].body}`,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.21,
  margin: 0,
});

export const divider = style({
  background: tokens.color.border.base,
  borderColor: tokens.color.border.base,
});

export const more = style({
  alignSelf: 'flex-start',
  color: tokens.color.text.secondary,
  fontFamily: `Inter, ${tokens['font-family'].body}`,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.21,
  margin: '8px 0 0',
  padding: 0,
});

export const emptyTab = style({
  padding: '24px 16px',
});

export const meetingRow = style({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const meetingCta = style({
  background: tokens.color.accent,
  borderRadius: 8,
  fontFamily: `Inter, ${tokens['font-family'].body}`,
  fontSize: 14,
  fontWeight: 500,
  paddingInline: 16,
  ':hover': {
    background: tokens.color.accent,
  },
  ':focus-visible': {
    background: tokens.color.accent,
  },
  '@media': {
    'screen and (max-width: 767px)': {
      width: '100%',
    },
  },
});
