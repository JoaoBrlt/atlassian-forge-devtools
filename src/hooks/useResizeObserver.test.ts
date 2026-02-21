import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useResizeObserver } from "./useResizeObserver";

let observerCallback: ResizeObserverCallback | undefined;

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    observerCallback = callback;
  }
  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
}

function simulateResize(entries: Partial<ResizeObserverEntry>[]) {
  if (!observerCallback) {
    throw new Error("ResizeObserver was not instantiated before simulateResize was called");
  }
  observerCallback(entries as ResizeObserverEntry[], {} as ResizeObserver);
}

describe("useResizeObserver", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  afterEach(() => {
    observerCallback = undefined;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("should not observe if the target element is null", () => {
    const ref = { current: null };

    const { result } = renderHook(() => useResizeObserver({ ref }));

    expect(mockObserve).not.toHaveBeenCalled();
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it("should observe the target element and return initial undefined sizes", () => {
    const element = document.createElement("div");
    const ref = { current: element };

    const { result } = renderHook(() => useResizeObserver({ ref }));

    expect(mockObserve).toHaveBeenCalledTimes(1);
    expect(mockObserve).toHaveBeenCalledWith(element);
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it("should update the size when the target element is resized", () => {
    const element = document.createElement("div");
    const ref = { current: element };
    const { result } = renderHook(() => useResizeObserver({ ref }));

    act(() =>
      simulateResize([
        {
          target: ref.current,
          contentRect: { width: 100, height: 200 } as DOMRectReadOnly,
        },
      ]),
    );

    expect(result.current.width).toBe(100);
    expect(result.current.height).toBe(200);
  });

  it("should update the size when the target element is resized multiple times", () => {
    const element = document.createElement("div");
    const ref = { current: element };
    const { result } = renderHook(() => useResizeObserver({ ref }));

    act(() =>
      simulateResize([
        {
          target: element,
          contentRect: { width: 100, height: 200 } as DOMRectReadOnly,
        },
      ]),
    );

    expect(result.current.width).toBe(100);
    expect(result.current.height).toBe(200);

    act(() =>
      simulateResize([
        {
          target: element,
          contentRect: { width: 300, height: 400 } as DOMRectReadOnly,
        },
      ]),
    );

    expect(result.current.width).toBe(300);
    expect(result.current.height).toBe(400);
  });

  it("should delegate to onResize callback and not update internal state", () => {
    const element = document.createElement("div");
    const ref = { current: element };
    const onResize = vi.fn();
    const { result } = renderHook(() => useResizeObserver({ ref, onResize }));

    act(() =>
      simulateResize([
        {
          target: ref.current,
          contentRect: { width: 100, height: 200 } as DOMRectReadOnly,
        },
      ]),
    );

    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledWith({ width: 100, height: 200 });
  });

  it("should always use the latest onResize callback", () => {
    const element = document.createElement("div");
    const ref = { current: element };
    const onResizeFirst = vi.fn();
    const onResizeSecond = vi.fn();

    const { rerender } = renderHook(({ onResize }) => useResizeObserver({ ref, onResize }), {
      initialProps: { onResize: onResizeFirst },
    });

    rerender({ onResize: onResizeSecond });

    act(() =>
      simulateResize([
        {
          target: element,
          contentRect: { width: 100, height: 200 } as DOMRectReadOnly,
        },
      ]),
    );

    expect(onResizeFirst).not.toHaveBeenCalled();
    expect(onResizeSecond).toHaveBeenCalledTimes(1);
    expect(onResizeSecond).toHaveBeenCalledWith({ width: 100, height: 200 });
  });

  it("should disconnect the observer on unmount", () => {
    const element = document.createElement("div");
    const ref = { current: element };
    const { unmount } = renderHook(() => useResizeObserver({ ref }));

    unmount();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
