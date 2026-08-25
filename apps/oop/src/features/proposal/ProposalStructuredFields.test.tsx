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
});
