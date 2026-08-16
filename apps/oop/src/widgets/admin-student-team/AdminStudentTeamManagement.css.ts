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
  gap: 8,
});

globalStyle(`${heading} p`, {
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
});

export const sectionTabs = style({
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
});

const tabBase = {
  background: 'transparent',
  border: 0,
  borderBottom: '2px solid transparent',
  color: tokens.color.text.secondary,
  cursor: 'pointer',
  font: 'inherit',
  padding: '10px 12px',
  whiteSpace: 'nowrap' as const,
};

export const tab = style(tabBase);

export const activeTab = style({
  ...tabBase,
  borderBottomColor: tokens.color.accent,
  color: tokens.color.text.accent,
  fontWeight: 600,
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
  background: tokens.color.background.gray,
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
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  '@media': {
    '(max-width: 960px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    '(max-width: 640px)': { gridTemplateColumns: '1fr' },
  },
});

export const teamCard = style({
  background: tokens.color.background.surface,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  padding: 20,
});

export const teamName = style({
  fontSize: 16,
  margin: 0,
});

export const memberList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  listStyle: 'none',
  margin: '16px 0 0',
  padding: 0,
});

export const member = style({
  alignItems: 'center',
  color: tokens.color.text.secondary,
  display: 'flex',
  fontSize: 14,
  justifyContent: 'space-between',
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
