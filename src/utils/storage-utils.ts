import { storage } from "#imports";
import type { ColumnVisibilityState } from "@tanstack/react-table";

/**
 * Storage item for the visible columns of the request list.
 */
export const requestListColumnVisibility = storage.defineItem<ColumnVisibilityState>(
  "local:requestListColumnVisibility",
  {
    version: 1,
  },
);
