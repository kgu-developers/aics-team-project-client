import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const profileTrigger = style({
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.08)',
  borderRadius: tokens.radius.container,
  color: tokens.color.background.surface,
  display: 'flex',
  gap: tokens.spacing['3'],
  justifyContent: 'flex-start',
  minHeight: 64,
  marginTop: 'auto',
  padding: tokens.spacing['3'],
  textAlign: 'left',
});

globalStyle(`${profileTrigger}:hover`, {
  background: 'rgba(255, 255, 255, 0.14)',
});

export const profileTriggerCopy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
  minWidth: 0,
});

globalStyle(`${profileTriggerCopy} strong`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

globalStyle(`${profileTriggerCopy} span`, {
  color: tokens.color.text.disabled,
  fontSize: tokens['font-size'].xs,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const profilePopover = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
  maxHeight: 'calc(100dvh - 96px)',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
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
  gridTemplateColumns: '64px minmax(0, 1fr)',
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
