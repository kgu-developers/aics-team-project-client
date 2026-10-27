import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';

type PanelPosition = { left: number; top: number };

export function useDraggableMessagePanel() {
  const panelRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef<PanelPosition | null>(null);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    const target = event.target;
    if (
      !(target instanceof HTMLElement) ||
      !target.closest('[data-panel-drag-handle]')
    ) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) return;

    const bounds = panel.getBoundingClientRect();
    dragOffsetRef.current = {
      left: event.clientX - bounds.left,
      top: event.clientY - bounds.top,
    };
    setPosition({ left: bounds.left, top: bounds.top });
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const panel = panelRef.current;
    const dragOffset = dragOffsetRef.current;
    if (!panel || !dragOffset) return;

    const bounds = panel.getBoundingClientRect();
    setPosition({
      left: Math.max(
        0,
        Math.min(
          event.clientX - dragOffset.left,
          window.innerWidth - bounds.width,
        ),
      ),
      top: Math.max(
        0,
        Math.min(
          event.clientY - dragOffset.top,
          window.innerHeight - bounds.height,
        ),
      ),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(event.pointerId) &&
      typeof event.currentTarget.releasePointerCapture === 'function'
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragOffsetRef.current = null;
  }

  const panelStyle: CSSProperties | undefined = position
    ? { bottom: 'auto', left: position.left, right: 'auto', top: position.top }
    : undefined;

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    panelRef,
    panelStyle,
  };
}
