import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { DocumentEditorField } from '~/features/editor/documentEditor';

import ProposalStructuredFields from './ProposalStructuredFields';

function Wrapper({ children }: PropsWithChildren) {
  return <AstryxThemeProvider>{children}</AstryxThemeProvider>;
}

const validFields: DocumentEditorField[] = [
  {
    key: 'wireframeImageNames',
    label: '와이어프레임 이미지',
    value: JSON.stringify(['wireframe.png']),
  },
  {
    key: 'screenDescription',
    label: '화면 구성 설명',
    value: '메인 화면 설명',
    multiline: true,
  },
];

const dataCompositionFields: DocumentEditorField[] = [
  {
    key: 'dataRows',
    label: '데이터 구성',
    value: JSON.stringify([
      {
        id: 'row-1',
        name: '사용자',
        description: '서비스 사용자 데이터',
        count: 100,
      },
    ]),
  },
];

describe('ProposalStructuredFields', () => {
  it('valid schema에서 필드가 빠진 schema로 바뀌어도 hook 순서 오류 없이 사라진다', () => {
    const view = render(
      <ProposalStructuredFields
        blockKey='screen-composition'
        fields={validFields}
        isLocked={false}
        onFieldsChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByLabelText('화면 구성 설명')).toBeInTheDocument();

    view.rerender(
      <ProposalStructuredFields
        blockKey='screen-composition'
        fields={[validFields[0]!]}
        isLocked={false}
        onFieldsChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('화면 구성 설명')).not.toBeInTheDocument();
  });

  it('데이터 구성은 화면 크기와 무관하게 하나의 반응형 표를 사용한다', () => {
    render(
      <ProposalStructuredFields
        blockKey='data-composition'
        fields={dataCompositionFields}
        isLocked={false}
        onFieldsChange={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: /데이터 이름/ })).toHaveValue(
      '사용자',
    );
    expect(screen.getByRole('textbox', { name: /데이터 설명/ })).toHaveValue(
      '서비스 사용자 데이터',
    );
    expect(screen.getByRole('textbox', { name: /예상 개수/ })).toHaveValue(
      '100',
    );
    expect(screen.getByRole('button', { name: '삭제' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
