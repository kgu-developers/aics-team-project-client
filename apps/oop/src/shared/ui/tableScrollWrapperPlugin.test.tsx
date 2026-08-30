import { AstryxThemeProvider, Table } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { tableScrollWrapperPlugin } from './tableScrollWrapperPlugin';

describe('tableScrollWrapperPlugin', () => {
  it('Astryx 스크롤 wrapper에 앱 소유 표식과 contained 레이아웃을 적용한다', () => {
    render(
      <AstryxThemeProvider>
        <Table
          columns={[{ header: '이름', key: 'name' }]}
          data={[{ id: 'row-1', name: '테스트' }]}
          idKey='id'
          plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
        />
      </AstryxThemeProvider>,
    );

    const wrapper = screen.getByRole('group', { name: 'Table' });
    expect(wrapper).toHaveAttribute('data-aics-table-scroll-wrapper');
    expect(wrapper).toHaveStyle({
      height: 'auto',
      marginBlock: '0',
      marginInline: '0',
      maxWidth: '100%',
      minHeight: '0',
      width: '100%',
    });
  });
});
