import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MilestoneList from './MilestoneList';

describe('MilestoneList', () => {
  it('마일스톤이 없으면 빈 상태를 표시한다', () => {
    render(<MilestoneList milestones={[]} />);

    expect(screen.getByText('등록된 마일스톤이 없어요.')).toBeInTheDocument();
  });
});
