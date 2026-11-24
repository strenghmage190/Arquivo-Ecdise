/// <reference types="jest" />
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useDirtyGuard, UseDirtyGuardOptions, UseDirtyGuardResult } from '../useDirtyGuard';

function renderDirtyHook(initialProps: UseDirtyGuardOptions) {
  const result: { current: UseDirtyGuardResult } = {
    current: null as unknown as UseDirtyGuardResult,
  };
  let currentProps = initialProps;
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root;

  function TestComponent({ hookProps }: { hookProps: UseDirtyGuardOptions }) {
    result.current = useDirtyGuard(hookProps);
    return null;
  }

  act(() => {
    root = createRoot(container);
    root.render(React.createElement(TestComponent, { hookProps: currentProps }));
  });

  return {
    result,
    rerender: (nextProps: UseDirtyGuardOptions) => {
      currentProps = nextProps;
      act(() => {
        root.render(React.createElement(TestComponent, { hookProps: currentProps }));
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useDirtyGuard', () => {
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('closes immediately without confirmation when not dirty', () => {
    const onClose = jest.fn();
    const { result, unmount } = renderDirtyHook({ isDirty: false, onClose });

    let closed = false;
    act(() => {
      closed = result.current.guardClose();
    });

    expect(closed).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('prompts confirmation when dirty and blocks close if cancelled', () => {
    confirmSpy.mockReturnValue(false);
    const onClose = jest.fn();
    const { result, unmount } = renderDirtyHook({
      isDirty: true,
      onClose,
      message: 'Descartar?',
    });

    let closed = true;
    act(() => {
      closed = result.current.guardClose();
    });

    expect(closed).toBe(false);
    expect(confirmSpy).toHaveBeenCalledWith('Descartar?');
    expect(onClose).not.toHaveBeenCalled();
    unmount();
  });

  it('prompts confirmation when dirty and closes if confirmed', () => {
    confirmSpy.mockReturnValue(true);
    const onClose = jest.fn();
    const { result, unmount } = renderDirtyHook({ isDirty: true, onClose });

    let closed = false;
    act(() => {
      closed = result.current.guardClose();
    });

    expect(closed).toBe(true);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('handles Escape key when enabled', () => {
    confirmSpy.mockReturnValue(false);
    const onClose = jest.fn();
    const { unmount } = renderDirtyHook({ isDirty: true, onClose });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    unmount();
  });

  it('does not trigger Escape when disabled', () => {
    const onClose = jest.fn();
    const { unmount } = renderDirtyHook({ isDirty: true, enabled: false, onClose });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    unmount();
  });

  it('only triggers backdrop click when target === currentTarget', () => {
    confirmSpy.mockReturnValue(true);
    const onClose = jest.fn();
    const { result, unmount } = renderDirtyHook({ isDirty: true, onClose });

    const el = document.createElement('div');
    const child = document.createElement('span');

    act(() => {
      result.current.handleBackdropClick({
        target: child,
        currentTarget: el,
      } as unknown as React.MouseEvent<HTMLElement>);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.handleBackdropClick({
        target: el,
        currentTarget: el,
      } as unknown as React.MouseEvent<HTMLElement>);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('supports inline confirmation mode', () => {
    const onClose = jest.fn();
    const { result, unmount } = renderDirtyHook({
      isDirty: true,
      onClose,
      useInlineConfirm: true,
    });

    act(() => {
      result.current.guardClose();
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(result.current.isConfirmOpen).toBe(true);
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.cancelDiscard();
    });
    expect(result.current.isConfirmOpen).toBe(false);
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.guardClose();
    });
    act(() => {
      result.current.confirmDiscard();
    });
    expect(result.current.isConfirmOpen).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('registers beforeunload when dirty and warnOnBeforeUnload is true', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderDirtyHook({
      isDirty: true,
      warnOnBeforeUnload: true,
    });

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });
});
