import { Theme } from '@astryxdesign/core/theme';
import type { ThemeMode } from '@astryxdesign/core/theme';
import type { ReactNode } from 'react';

import { oopTheme } from '../theme/oopTheme';

type AstryxThemeProviderProps = {
  children: ReactNode;
  mode?: ThemeMode;
};

export default function AstryxThemeProvider({
  children,
  mode = 'system',
}: AstryxThemeProviderProps) {
  return (
    <Theme theme={oopTheme} mode={mode}>
      {children}
    </Theme>
  );
}
