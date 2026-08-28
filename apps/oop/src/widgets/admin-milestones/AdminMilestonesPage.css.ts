import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
});

export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 13,
  textDecoration: 'none',
});

export const description = style({
  color: tokens.color.text.secondary,
  marginTop: -12,
});

export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const filterRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'space-between',
});

const filterBase = {
  background: tokens.color.background.gray,
  border: 0,
  borderRadius: tokens.radius.full,
  color: tokens.color.text.primary,
  cursor: 'pointer',
  font: 'inherit',
  padding: '7px 12px',
};

export const filter = style(filterBase);

export const filterActive = style({
  ...filterBase,
  background: tokens.color.text.primary,
  color: tokens.color.background.surface,
});

export const tableCard = style({
  overflowX: 'auto',
  padding: 0,
});

export const table = style({
  borderCollapse: 'collapse',
  minWidth: 620,
  width: '100%',
});

globalStyle(table + ' th', {
  background: tokens.color.background.gray,
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 500,
  padding: '12px 16px',
  textAlign: 'left',
});

globalStyle(table + ' td', {
  borderTop: `1px solid ${tokens.color.border.base}`,
  fontSize: 14,
  padding: '14px 16px',
});
