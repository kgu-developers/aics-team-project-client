import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const embeddedPage = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: '100%',
});

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minWidth: 0,
});

export const studentListHeader = style({
  alignItems: 'flex-end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const studentListControls = style({
  alignItems: 'flex-end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});

export const teamSectionHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
  minWidth: 0,
});

export const teamSectionHeading = style({
  flex: '1 1 320px',
  minWidth: 0,
});

export const teamSectionTitle = style({
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
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
  gridTemplateColumns: 'minmax(0, 160px) minmax(0, 1fr)',
  padding: 16,
  '@media': {
    '(max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const dragOverTeamCard = style({
  borderColor: tokens.color.accent,
  boxShadow: `0 0 0 2px ${tokens.color.background.blue}`,
});

export const teamName = style({
  fontSize: 18,
  fontWeight: 600,
  margin: 0,
  minWidth: 0,
  paddingTop: 4,
});

export const teamHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[2],
});

export const teamActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[2],
});

export const teamDashboardLink = style({
  color: tokens.color.text.accent,
  display: 'block',
  overflowWrap: 'anywhere',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const memberList = style({
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))',
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const teamContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minWidth: 0,
});

export const member = style({
  alignItems: 'flex-start',
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  color: tokens.color.text.primary,
  display: 'flex',
  flexDirection: 'column',
  fontSize: 14,
  gap: 4,
  minWidth: 0,
  padding: '12px 14px',
});

export const teamLeaderMember = style({
  background: tokens.color.background.muted,
  borderColor: tokens.color.border.base,
});

export const draggableMember = style({
  cursor: 'grab',
});

export const draggingMember = style({
  cursor: 'grabbing',
  opacity: 0.5,
});

export const memberButton = style({
  background: 'transparent',
  border: 0,
  color: tokens.color.text.accent,
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textAlign: 'left',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const memberName = style({
  alignItems: 'center',
  display: 'inline-flex',
  flexWrap: 'wrap',
  gap: 6,
});

export const leaderBadge = style({
  background: tokens.color.background.gray,
  borderRadius: tokens.radius.full,
  color: tokens.color.text.secondary,
  fontSize: 12,
  lineHeight: 1,
  padding: '4px 6px',
  textDecoration: 'none',
});

globalStyle(`${member} > span`, {
  color: tokens.color.text.secondary,
  fontSize: 13,
});

export const actionMenu = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
  padding: tokens.spacing['1'],
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

export const withdrawDialogContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const assistantDialogContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  maxHeight: 'calc(100vh - 64px)',
  overflowY: 'auto',
});

export const assistantDialogActions = style({
  background: tokens.color.background.surface,
  bottom: 0,
  paddingTop: tokens.spacing['1'],
  position: 'sticky',
});

globalStyle(`${statePanel} p, ${emptyTeamPanel} p`, {
  margin: 0,
});
