import { describe, expect, it } from "vitest";
import { formatSize } from "./size-utils";

describe("formatSize", () => {
  it("should return an empty string if the size is not a number", () => {
    expect(formatSize(NaN)).toBe("");
  });

  it("should return an empty string if the size is infinite", () => {
    expect(formatSize(Infinity)).toBe("");
  });

  it("should return an empty string if the size is negative", () => {
    expect(formatSize(-1)).toBe("");
  });

  it("should format zero bytes as '0 B'", () => {
    expect(formatSize(0)).toBe("0 B");
  });

  it("should format whole bytes using the bytes unit", () => {
    expect(formatSize(10)).toBe("10 B");
  });

  it("should format decimal bytes by rounding to the nearest whole number", () => {
    expect(formatSize(10.78)).toBe("11 B");
  });

  it("should format exactly 1 kilobyte as '1 kB'", () => {
    expect(formatSize(1000)).toBe("1 kB");
  });

  it("should format kilobytes with decimal precision when over 1 kilobyte", () => {
    expect(formatSize(2333)).toBe("2.33 kB");
  });

  it("should format exactly 1 megabyte as '1 MB'", () => {
    expect(formatSize(1000000)).toBe("1 MB");
  });

  it("should format megabytes with decimal precision when over 1 megabyte", () => {
    expect(formatSize(4666666)).toBe("4.67 MB");
  });

  it("should format exactly 1 gigabyte as '1 GB'", () => {
    expect(formatSize(1000000000)).toBe("1 GB");
  });

  it("should format gigabytes with decimal precision when over 1 gigabyte", () => {
    expect(formatSize(3222222222)).toBe("3.22 GB");
  });

  it("should format exactly 1 terabyte as '1 TB'", () => {
    expect(formatSize(1000000000000)).toBe("1 TB");
  });

  it("should format terabytes with decimal precision when over 1 terabyte", () => {
    expect(formatSize(7888888888888)).toBe("7.89 TB");
  });
});
