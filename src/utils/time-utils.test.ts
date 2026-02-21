import { describe, expect, it } from "vitest";
import { formatDuration } from "./time-utils";

describe("formatDuration", () => {
  it("should return an empty string if the duration is not a number", () => {
    expect(formatDuration(NaN)).toBe("");
  });

  it("should return an empty string if the duration is infinite", () => {
    expect(formatDuration(Infinity)).toBe("");
  });

  it("should return an empty string if the duration is negative", () => {
    expect(formatDuration(-1)).toBe("");
  });

  it("should format zero milliseconds as '0 ms'", () => {
    expect(formatDuration(0)).toBe("0 ms");
  });

  it("should format whole milliseconds using the milliseconds unit", () => {
    expect(formatDuration(10)).toBe("10 ms");
  });

  it("should format decimal milliseconds by rounding to the nearest whole number", () => {
    expect(formatDuration(10.78)).toBe("11 ms");
  });

  it("should format exactly 1 second as '1 s'", () => {
    expect(formatDuration(1000)).toBe("1 s");
  });

  it("should format seconds with decimal precision when over 1 second", () => {
    expect(formatDuration(2333)).toBe("2.33 s");
  });

  it("should format exactly 1 minute as '1 m'", () => {
    expect(formatDuration(60000)).toBe("1 m");
  });

  it("should format minutes with decimal precision when over 1 minute", () => {
    expect(formatDuration(279996)).toBe("4.67 m");
  });

  it("should format exactly 1 hour as '1 h'", () => {
    expect(formatDuration(3600000)).toBe("1 h");
  });

  it("should format hours with decimal precision when over 1 hour", () => {
    expect(formatDuration(11599920)).toBe("3.22 h");
  });

  it("should format exactly 1 day as '1 d'", () => {
    expect(formatDuration(86400000)).toBe("1 d");
  });

  it("should format days with decimal precision when over 1 day", () => {
    expect(formatDuration(681592320)).toBe("7.89 d");
  });
});
