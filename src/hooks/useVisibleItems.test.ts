import { describe, expect, it } from "vitest";
import { computeVisibleCount } from "./useVisibleItems";

describe("computeVisibleCount", () => {
  it("should return 0 when there are no items", () => {
    // available = 100
    // total = no items, so no items to fit
    expect(computeVisibleCount(100, [], 10)).toBe(0);
  });

  it("should return 0 when there is no available width", () => {
    // available = 0, ellipsis = 10, so remaining = 0
    // total = 20 > 0, so no items fit
    expect(computeVisibleCount(0, [20, 20], 10)).toBe(0);
  });

  it("should return 0 when ellipsis consumes all available width", () => {
    // available = 20, ellipsis = 50, so remaining = 0
    // total = 10 > 0, so no items fit
    expect(computeVisibleCount(20, [20, 20, 20], 50)).toBe(0);
  });

  it("should return all items when all items have no width", () => {
    // available = 100
    // total = 0+0+0 <= 100, so all items fit
    expect(computeVisibleCount(100, [0, 0, 0], 10)).toBe(3);
  });

  it("should return all items when total width is less than available width", () => {
    // available = 100
    // total = 20+20 = 40 <= 100, so all items fit
    expect(computeVisibleCount(100, [20, 20], 10)).toBe(2);
  });

  it("should return all items when total width exactly equals available width", () => {
    // available = 100
    // total = 50+50 = 100 <= 100, so all items fit
    expect(computeVisibleCount(100, [50, 50], 10)).toBe(2);
  });

  it("should return all items when there is a single item that fits", () => {
    // available = 100
    // total = 50 <= 100, so all items fit
    expect(computeVisibleCount(100, [50], 10)).toBe(1);
  });

  it("should return all items when there is a single item that barely fits", () => {
    // available = 100
    // total = 99 <= 100, so all items fit
    expect(computeVisibleCount(100, [99], 10)).toBe(1);
  });

  it("should return only items that fit within available width minus ellipsis", () => {
    // available = 100, ellipsis = 10, so remaining = 90
    // total = 50 <= 90, so 1 item fits
    // total = 50+50 = 100 > 90, so only 1 item fits
    expect(computeVisibleCount(100, [50, 50, 50], 10)).toBe(1);
  });

  it("should use all available width when the ellipse has no width", () => {
    // available = 100, ellipsis=0, so remaining = 100
    // total = 50+50 <= 100, so 2 item fit
    // total = 50+50+50 = 150 > 100, so only 2 items fit
    expect(computeVisibleCount(100, [50, 50, 50], 0)).toBe(2);
  });

  it("should handle items with variable widths", () => {
    // available = 100, ellipsis = 10, so remaining = 90
    // total = 30+40+20 = 90 <= 90, so 3 items fit
    // total = 30+40+20+50 > 90, so only 3 items fit
    expect(computeVisibleCount(100, [30, 40, 20, 50], 10)).toBe(3);
  });

  it("should include items whose cumulative width exactly equals the remaining width", () => {
    // available = 100, ellipsis = 20, so remaining = 80
    // total = 40+40 = 80 <= 80, so 2 items fit
    // total = 40+40+40 = 120 > 80, so only 2 items fit
    expect(computeVisibleCount(100, [40, 40, 40], 20)).toBe(2);
  });

  it("should include an item whose width exactly equals the remaining width", () => {
    // available=100, ellipsis=10, so remaining = 90
    // total = 90 <= 90, so 1 item fits
    // total = 90+90=180 > 90, so only 1 item fits
    expect(computeVisibleCount(100, [90, 90, 90], 10)).toBe(1);
  });

  it("should exclude an item when adding it would exceed the remaining width", () => {
    // available = 100, ellipsis = 10, so remaining = 90
    // total = 50 <= 90, so 1 item fits
    // total = 50+51 = 101 > 90, so only 1 item fits
    expect(computeVisibleCount(100, [50, 51], 10)).toBe(1);
  });

  it("should return 0 when the first item exceeds the remaining width", () => {
    // available = 100, ellipsis = 10, so remaining = 90
    // total = 100 > 90, so no items fit
    expect(computeVisibleCount(100, [100, 100, 100], 10)).toBe(0);
  });

  it("should return 0 when a single item exceeds the remaining width", () => {
    // available = 100, ellipsis = 10, so remaining = 90
    // total = 200 > 90, so no items fit
    expect(computeVisibleCount(100, [200], 10)).toBe(0);
  });
});
