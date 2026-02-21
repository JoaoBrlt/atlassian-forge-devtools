import { storage } from "#imports";
import { VisibilityState } from "@tanstack/react-table";

/**
 * Storage item for the visible columns of the request list.
 */
export const requestListColumnVisibility = storage.defineItem<VisibilityState>("local:requestListColumnVisibility", {
  version: 1,
});
