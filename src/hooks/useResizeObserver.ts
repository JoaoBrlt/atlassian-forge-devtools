import { useIsMounted } from "@/hooks/useIsMounted";
import { RefObject, useEffect, useRef, useState } from "react";

/**
 * Represents the size of an element.
 * @property width the width of the element (in pixels)
 * @property height the height of the element (in pixels)
 */
export interface Size {
  width: number | undefined;
  height: number | undefined;
}

/**
 * Represents a callback to invoke when the size of an element changes.
 */
export type ResizeHandler = (size: Size) => void;

/**
 * Represents the options of the `useResizeObserver` hook.
 */
export interface UseResizeObserverOptions<T extends HTMLElement = HTMLElement> {
  /**
   * The reference of the element to observe.
   */
  ref: RefObject<T | null>;

  /**
   * The callback to invoke when the size of the element changes.
   * If provided, the size state will not be updated to avoid unnecessary re-renders.
   */
  onResize?: ResizeHandler;
}

/**
 * Custom hook that observes the size of an element using a ResizeObserver.
 */
export function useResizeObserver<T extends HTMLElement = HTMLElement>({
  ref,
  onResize,
}: UseResizeObserverOptions<T>): Size {
  const isMounted = useIsMounted();

  const [size, setSize] = useState<Size>({ width: undefined, height: undefined });
  const previousSize = useRef<Size>({ width: undefined, height: undefined });

  const onResizeRef = useRef<ResizeHandler>(undefined);
  onResizeRef.current = onResize;

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const newWidth = entry.contentRect.width;
      const newHeight = entry.contentRect.height;

      const hasChanged = previousSize.current.width !== newWidth || previousSize.current.height !== newHeight;

      if (hasChanged) {
        const newSize: Size = { width: newWidth, height: newHeight };
        previousSize.current.width = newWidth;
        previousSize.current.height = newHeight;

        if (onResizeRef.current) {
          onResizeRef.current(newSize);
        } else {
          if (isMounted()) {
            setSize(newSize);
          }
        }
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, isMounted]);

  return size;
}
