// Figma "OOP 디자인 토큰" 컬렉션 06 (Desktop 레이아웃) — OOP 전용 17개.
// Astryx에 없는 토큰이므로 여기서 값까지 선언한다.
// 출처: Figma 06-semantic-responsive-layout/Desktop.tokens.json (2026-07-31 수신).
import {
  createGlobalTheme,
  createGlobalThemeContract,
} from '@vanilla-extract/css';

export const layoutTokens = createGlobalThemeContract({
  page: {
    'padding-x': 'page-padding-x',
    'padding-y': 'page-padding-y',
    'section-gap': 'page-section-gap',
  },
  milestone: {
    'sidebar-width': 'milestone-sidebar-width',
    'collapsed-height': 'milestone-collapsed-height',
    'expanded-height': 'milestone-expanded-height',
    'collapsed-height-detailed': 'milestone-collapsed-height-detailed',
  },
  table: {
    'edge-column-width': 'table-edge-column-width',
    'header-height': 'table-header-height',
    'row-height': 'table-row-height',
  },
  layout: {
    'header-height': 'layout-header-height',
  },
  hero: {
    'action-height': 'hero-action-height',
  },
  calendar: {
    'content-height': 'calendar-content-height',
  },
  footer: {
    height: 'footer-height',
  },
  workspace: {
    'sidebar-width': 'workspace-sidebar-width',
    'content-width': 'workspace-content-width',
    'savebar-height': 'workspace-savebar-height',
  },
});

createGlobalTheme(':root', layoutTokens, {
  page: {
    'padding-x': '80px',
    'padding-y': '24px',
    'section-gap': '24px',
  },
  milestone: {
    'sidebar-width': '140px',
    'collapsed-height': '69px',
    'expanded-height': '320px',
    'collapsed-height-detailed': '87px',
  },
  table: {
    'edge-column-width': '160px',
    'header-height': '36px',
    'row-height': '44px',
  },
  layout: {
    'header-height': '48px',
  },
  hero: {
    'action-height': '68px',
  },
  calendar: {
    'content-height': '241px',
  },
  footer: {
    height: '105px',
  },
  workspace: {
    'sidebar-width': '240px',
    'content-width': '960px',
    'savebar-height': '72px',
  },
});
