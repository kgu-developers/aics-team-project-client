import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import { Theme } from '@astryxdesign/core/theme';
import type { ThemeMode } from '@astryxdesign/core/theme';
import type { ReactNode } from 'react';

import { oopTheme } from '../theme/oopTheme';

type AstryxThemeProviderProps = {
  children: ReactNode;
  mode?: ThemeMode;
};

/**
 * Astryx ships only an `en` catalog. OOP renders Korean UI, so the strings
 * Astryx components speak on their own (currently `Pagination`) are
 * overridden here; anything not listed falls back to the shipped `en` text.
 */
const koreanMessageOverrides = {
  ko: {
    '@astryx.pagination.count': '{from, number}–{to, number} / {total, number}',
    '@astryx.pagination.goToPage': '{page, number}페이지로 이동',
    '@astryx.pagination.itemsPerPage': '페이지당 항목 수',
    '@astryx.pagination.label': '페이지 이동',
    '@astryx.pagination.next': '다음 페이지',
    '@astryx.pagination.pageAnnounce': '{current, number}페이지',
    '@astryx.pagination.pageIndicators': '페이지 표시',
    '@astryx.pagination.pageOfTotal': '{current, number} / {total, number} 페이지',
    '@astryx.pagination.previous': '이전 페이지',
    '@astryx.table.pagination.label': '표 페이지 이동',
  },
};

export default function AstryxThemeProvider({
  children,
  mode = 'system',
}: AstryxThemeProviderProps) {
  return (
    <InternationalizationProvider
      locale='ko'
      overrides={koreanMessageOverrides}
    >
      <Theme theme={oopTheme} mode={mode}>
        {children}
      </Theme>
    </InternationalizationProvider>
  );
}
