import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1160,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const profileCard = style({
  width: '100%',
});

export const uploadSection = style({
  width: '100%',
});

export const sectionHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const profileForm = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: '1fr',
});

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const uploadGrid = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const uploadCard = style({
  minWidth: 0,
});

export const sectionStatusList = style({
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  listStyle: 'none',
  margin: '12px 0 0',
  padding: 0,
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const statusGroups = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

globalStyle(`${sectionStatusList} li`, {
  alignItems: 'center',
  background: tokens.color.background.gray,
  borderRadius: tokens.radius.element,
  display: 'flex',
  fontSize: 13,
  gap: 8,
  justifyContent: 'space-between',
  padding: '10px 12px',
});

globalStyle(`${sectionStatusList} span`, {
  color: tokens.color.text.secondary,
});
