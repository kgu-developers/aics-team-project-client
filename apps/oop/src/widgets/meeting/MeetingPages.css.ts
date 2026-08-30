import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  boxSizing: 'border-box',
  display: 'grid',
  gap: 'var(--spacing-5)',
  margin: '0 auto',
  maxWidth: 960,
  minWidth: 0,
  padding: 'var(--spacing-5) 0',
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      gap: 'var(--spacing-4)',
      padding: 'var(--spacing-5) var(--spacing-4) var(--spacing-8)',
    },
  },
});
export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
  justifyContent: 'space-between',
});
export const routeHeader = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'nowrap',
  gap: 'var(--spacing-3)',
  justifyContent: 'space-between',
  minWidth: 0,
});
export const breadcrumb = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
});

globalStyle(`${breadcrumb} ol`, {
  flexWrap: 'nowrap',
  minWidth: 0,
  overflow: 'hidden',
});

globalStyle(`${breadcrumb} li`, {
  minWidth: 0,
  whiteSpace: 'nowrap',
});

globalStyle(`${breadcrumb} li:last-child`, {
  flex: '1 1 auto',
  overflow: 'hidden',
});

globalStyle(`${breadcrumb} li:last-child > span:last-child`, {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const listTableCard = style({
  height: 'auto',
  minWidth: 0,
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      border: 0,
      borderRadius: 0,
      boxShadow: 'none',
      padding: 0,
    },
  },
});

export const responsiveListTable = style({
  height: 'auto',
  minWidth: 0,
  width: '100%',
});

globalStyle(`${responsiveListTable} table`, {
  '@media': {
    'screen and (max-width: 767px)': {
      minWidth: '0 !important',
      tableLayout: 'fixed',
      width: '100%',
    },
  },
});

globalStyle(`${responsiveListTable} th, ${responsiveListTable} td`, {
  '@media': {
    'screen and (max-width: 767px)': {
      minWidth: '0 !important',
      overflowWrap: 'anywhere',
      paddingInline: `${tokens.spacing[2]} !important`,
    },
  },
});

globalStyle(
  `${responsiveListTable} th:nth-child(3), ${responsiveListTable} td:nth-child(3)`,
  {
    '@media': {
      'screen and (max-width: 767px)': {
        display: 'none',
      },
    },
  },
);
export const listTitleCell = style({
  display: 'grid',
  gap: 'var(--spacing-1)',
  minWidth: 0,
});
export const listTitleLink = style({
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  display: 'block',
  overflowWrap: 'anywhere',
  textDecoration: 'none',
  ':focus-visible': {
    outline: '2px solid currentColor',
    outlineOffset: 2,
  },
});

globalStyle(`${responsiveListTable} [data-student-meeting-row]`, {
  cursor: 'pointer',
  transitionDuration: 'var(--duration-fast)',
  transitionProperty: 'background-color, box-shadow',
  transitionTimingFunction: 'var(--ease-standard)',
});
globalStyle(`${responsiveListTable} [data-student-meeting-row]:hover`, {
  backgroundColor: tokens.color.background.muted,
  boxShadow: `inset 0 0 0 1px ${tokens.color.border.base}`,
});
export const emptyTableCell = style({
  color: 'var(--color-text-secondary)',
  padding: 'var(--spacing-8) var(--spacing-4)',
  textAlign: 'center',
});
export const meta = style({
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-sm)',
  margin: 0,
});
export const detailCard = style({
  display: 'grid',
  gap: 'var(--spacing-5)',
  minWidth: 0,
  padding: 'var(--spacing-6)',
  '@media': {
    'screen and (max-width: 767px)': {
      border: 0,
      borderRadius: 0,
      boxShadow: 'none',
      padding: 'var(--spacing-4) 0',
    },
  },
});
export const editorCard = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
  height: 'auto',
  maxHeight: 'none',
  minWidth: 0,
  padding: 'var(--spacing-6)',
  '@media': {
    'screen and (max-width: 767px)': {
      border: 0,
      borderRadius: 0,
      boxShadow: 'none',
      padding: 'var(--spacing-4) 0',
    },
  },
});
export const documentTitle = style({
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--spacing-5)',
});
export const properties = style({
  display: 'grid',
  gap: 'var(--spacing-3)',
});
export const fields = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
  minWidth: 0,
});
export const participantList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
});
export const participant = style({
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-full)',
  padding: 'var(--spacing-2) var(--spacing-3)',
});
export const content = style({
  color: 'var(--color-text-primary)',
  lineHeight: 1.7,
  minHeight: 80,
  overflowWrap: 'anywhere',
});
globalStyle(`${content} h2`, {
  fontSize: 'var(--font-size-lg)',
  margin: '0 0 var(--spacing-3)',
});
globalStyle(`${content} p`, { margin: '0 0 var(--spacing-3)' });
globalStyle(`${content} ul, ${content} ol`, {
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-5)',
});
globalStyle(`${content} ul`, { listStyleType: 'disc' });
globalStyle(`${content} ol`, { listStyleType: 'decimal' });
globalStyle(`${content} blockquote`, {
  borderLeft: '3px solid var(--color-border-emphasized)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-3)',
});
export const editor = style({
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  minHeight: 180,
  padding: 'var(--spacing-3)',
});
globalStyle(`${editor} .ProseMirror`, { minHeight: 152, outline: 'none' });
globalStyle(`${editor} .ProseMirror h2`, {
  fontSize: 'var(--font-size-lg)',
  margin: '0 0 var(--spacing-3)',
});
globalStyle(`${editor} .ProseMirror p`, { margin: '0 0 var(--spacing-3)' });
globalStyle(`${editor} .ProseMirror ul, ${editor} .ProseMirror ol`, {
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-5)',
});
globalStyle(`${editor} .ProseMirror ul`, { listStyleType: 'disc' });
globalStyle(`${editor} .ProseMirror ol`, { listStyleType: 'decimal' });
globalStyle(`${editor} .ProseMirror blockquote`, {
  borderLeft: '3px solid var(--color-border-emphasized)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-3)',
});
globalStyle(`${editor} .ProseMirror pre`, {
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-sm)',
  margin: '0 0 var(--spacing-3)',
  padding: 'var(--spacing-3)',
});
export const toolbar = style({
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
  paddingBottom: 'var(--spacing-3)',
});
export const tableFrame = style({
  height: 'auto',
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
});
export const responsiveActionTable = style({ minWidth: 0, width: '100%' });

export const responsiveActionCell = style({
  minWidth: 0,
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'grid',
      gap: tokens.spacing[2],
    },
  },
});

export const mobileActionLabel = style({
  display: 'none',
  '@media': {
    'screen and (max-width: 767px)': {
      color: tokens.color.text.secondary,
      display: 'block',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 500,
    },
  },
});

globalStyle(`${responsiveActionTable} [data-aics-table-scroll-wrapper]`, {
  '@media': {
    'screen and (max-width: 767px)': {
      overflowX: 'visible',
    },
  },
});

globalStyle(`${responsiveActionTable} table`, {
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'block',
      minWidth: '0 !important',
      width: '100%',
    },
  },
});

globalStyle(`${responsiveActionTable} thead`, {
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'none',
    },
  },
});

globalStyle(`${responsiveActionTable} tbody`, {
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'grid',
      gap: tokens.spacing[3],
      width: '100%',
    },
  },
});

globalStyle(`${responsiveActionTable} tbody tr`, {
  '@media': {
    'screen and (max-width: 767px)': {
      border: `1px solid ${tokens.color.border.base}`,
      borderRadius: tokens.radius.container,
      display: 'grid !important',
      gap: tokens.spacing[3],
      padding: tokens.spacing[4],
      width: '100%',
    },
  },
});

globalStyle(`${responsiveActionTable} tbody td`, {
  '@media': {
    'screen and (max-width: 767px)': {
      border: '0 !important',
      display: 'block',
      maxWidth: 'none !important',
      minWidth: '0 !important',
      overflow: 'visible !important',
      padding: '0 !important',
      width: '100% !important',
    },
  },
});
export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
  justifyContent: 'flex-end',
});
export const detailActions = style({
  marginLeft: 'auto',
});
export const backLink = style({
  color: 'var(--color-text-accent)',
  flex: 'none',
  fontSize: 'var(--font-size-sm)',
  textDecoration: 'none',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
  ':hover': {
    textDecoration: 'underline',
  },
});
export const notice = style({
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  padding: 'var(--spacing-3)',
});
export const detailFooter = style({
  alignItems: 'center',
  borderTop: '1px solid var(--color-border)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
  justifyContent: 'space-between',
  paddingTop: 'var(--spacing-3)',
});
export const meetingContent = style({
  borderTop: '1px solid var(--color-border)',
  display: 'grid',
  gap: 'var(--spacing-4)',
  paddingTop: 'var(--spacing-4)',
});
export const error = style({ color: 'var(--color-text-error)', margin: 0 });
export const deleteDialogContent = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
});
export const deletePreview = style({
  display: 'grid',
  gap: 'var(--spacing-2)',
  padding: 'var(--spacing-4)',
});
export const dialogActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
  justifyContent: 'flex-end',
});
export const deleteButton = style({
  background: 'var(--color-background-error-inverted)',
  color: 'var(--color-on-error)',
});
