import { ResizeObserver } from "@juggle/resize-observer";

// Polyfill the ResizeObserver API
globalThis.ResizeObserver = ResizeObserver;
