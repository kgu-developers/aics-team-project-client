import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
});

export const sectionTabs = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

const tabBase = {
  background: tokens.color.background.muted,
  border: 0,
  borderRadius: tokens.radius.full,
  color: tokens.color.text.primary,
  cursor: 'pointer',
  font: 'inherit',
  padding: '7px 12px',
  whiteSpace: 'nowrap' as const,
};

export const tab = style(tabBase);

export const activeTab = style({
  ...tabBase,
  background: tokens.color.text.primary,
  color: tokens.color.background.surface,
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minWidth: 0,
});

export const tableWrap = style({
  background: tokens.color.background.surface,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  overflowX: 'auto',
});

export const table = style({
  borderCollapse: 'collapse',
  minWidth: 640,
  tableLayout: 'fixed',
  width: '100%',
});

globalStyle(`${table} th`, {
  background: tokens.color.background.card,
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 500,
  padding: '12px 16px',
  textAlign: 'left',
});

globalStyle(`${table} td`, {
  borderTop: `1px solid ${tokens.color.border.base}`,
  fontSize: 14,
  padding: '14px 16px',
});

export const teamGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const teamCard = style({
  alignItems: 'flex-start',
  background: tokens.color.background.surface,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '72px minmax(0, 1fr)',
  padding: 16,
  '@media': {
    '(max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const teamName = style({
  fontSize: 16,
  margin: 0,
  paddingTop: 8,
});

export const memberList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const member = style({
  alignItems: 'flex-start',
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  color: tokens.color.text.primary,
  display: 'flex',
  flex: '1 1 132px',
  flexDirection: 'column',
  fontSize: 14,
  gap: 4,
  padding: '12px 14px',
});

export const memberButton = style({
  background: 'transparent',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textAlign: 'left',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

globalStyle(`${member} span:last-child`, {
  color: tokens.color.text.secondary,
  fontSize: 13,
});

export const statePanel = style({
  alignItems: 'center',
  background: tokens.color.background.surface,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  color: tokens.color.text.secondary,
  display: 'flex',
  justifyContent: 'center',
  minHeight: 180,
  padding: 24,
});

export const emptyTeamPanel = style({
  background: tokens.color.background.surface,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  color: tokens.color.text.secondary,
  padding: 24,
});

globalStyle(`${statePanel} p, ${emptyTeamPanel} p`, {
  margin: 0,
});
