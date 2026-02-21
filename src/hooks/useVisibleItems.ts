import { Size, useResizeObserver } from "@/hooks/useResizeObserver";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseVisibleItemsOptions {
  /**
   * The total number of items.
   */
  totalItems: number;

  /**
   * The width of the container that is not usable for the items (in pixels).
   */
  reservedWidth?: number;

  /**
   * The width of the ellipsis that is displayed when at least one item does not fit in the container (in pixels).
   */
  ellipsisWidth?: number;
}

/**
 * Computes the number of visible items in a container.
 * @param availableWidth the available width for the items
 * @param itemWidths the widths of the items (in pixels)
 * @param ellipsisWidth the width of the ellipsis (in pixels)
 * @return the number of visible items
 */
export function computeVisibleCount(availableWidth: number, itemWidths: number[], ellipsisWidth: number) {
  const totalWidth = itemWidths.reduce((result, itemWidth) => result + itemWidth, 0);

  // Check if all items fit in the available width
  if (totalWidth <= availableWidth) {
    return itemWidths.length;
  }

  // Otherwise, compute the number of items that fit in the available width (accounting for the width of the ellipsis)
  const remainingWidth = Math.max(0, availableWidth - ellipsisWidth);
  let usedWidth = 0;

  for (let i = 0; i < itemWidths.length; i++) {
    usedWidth += itemWidths[i];
    if (usedWidth > remainingWidth) {
      return i;
    }
  }

  return itemWidths.length;
}

/**
 * Custom hook that computes the number of items that fit in a container.
 */
export function useVisibleItems<
  ContainerElement extends HTMLElement = HTMLElement,
  ItemElement extends HTMLElement = HTMLElement,
>({ totalItems, reservedWidth = 0, ellipsisWidth = 70 }: UseVisibleItemsOptions) {
  const containerRef = useRef<ContainerElement>(null);
  const itemRefs = useRef<(ItemElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(totalItems);

  // Synchronize the item references with the number of items
  if (itemRefs.current.length > totalItems) {
    itemRefs.current = itemRefs.current.slice(0, totalItems);
  }

  // Reusable callback to compute the number of visible items
  const compute = useCallback(
    (containerWidth: number) => {
      const availableWidth = Math.max(0, containerWidth - reservedWidth);
      const itemWidths: number[] = [];
      for (let i = 0; i < totalItems; i++) {
        const itemElement = itemRefs.current[i];
        itemWidths.push(itemElement ? itemElement.offsetWidth : 0);
      }
      const newVisibleCount = computeVisibleCount(availableWidth, itemWidths, ellipsisWidth);
      setVisibleCount(newVisibleCount);
    },
    [totalItems, reservedWidth, ellipsisWidth],
  );

  // Compute the number of visible items when the container size changes
  const handleResize = useCallback(
    (size: Size) => {
      const containerWidth = size.width ?? Number.MAX_SAFE_INTEGER;
      compute(containerWidth);
    },
    [compute],
  );

  // Compute the number of visible items when the properties change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const containerWidth = container.offsetWidth;
    compute(containerWidth);
  }, [compute]);

  useResizeObserver<ContainerElement>({ ref: containerRef, onResize: handleResize });

  return { containerRef, itemRefs, visibleCount };
}
