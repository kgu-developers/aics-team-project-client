import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

class ResizeObserverMock implements ResizeObserver {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

// Astryx 0.4+ announces each toast in a persistent, visually hidden live
// region as well as in its visible toast. Text queries target rendered UI;
// announcement semantics can be asserted separately through role queries.
configure({ defaultIgnore: 'script, style, [data-astryx-live-region]' });

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverMock,
  });

  if (!HTMLDialogElement.prototype.showModal) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      writable: true,
      value() {
        this.open = true;
      },
    });
  }

  if (!HTMLDialogElement.prototype.close) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      writable: true,
      value() {
        this.open = false;
      },
    });
  }

  afterEach(() => {
    cleanup();
  });
}
