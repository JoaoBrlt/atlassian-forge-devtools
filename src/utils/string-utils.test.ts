import { base64ToString, isBlank, isNotBlank } from "@/utils/string-utils";
import { describe, expect, it } from "vitest";

describe("isBlank", () => {
  it("should return true for undefined", () => {
    expect(isBlank(undefined)).toBe(true);
  });

  it("should return true for null", () => {
    expect(isBlank(null)).toBe(true);
  });

  it("should return true for an empty string", () => {
    expect(isBlank("")).toBe(true);
  });

  it("should return false for a non-empty string", () => {
    expect(isBlank("abc")).toBe(false);
  });
});

describe("isNotBlank", () => {
  it("should return false for undefined", () => {
    expect(isNotBlank(undefined)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isNotBlank(null)).toBe(false);
  });

  it("should return false for an empty string", () => {
    expect(isNotBlank("")).toBe(false);
  });

  it("should return true for a non-empty string", () => {
    expect(isNotBlank("abc")).toBe(true);
  });
});

describe("base64ToString", () => {
  it("should decode an empty string", () => {
    expect(base64ToString("")).toBe("");
  });

  it("should decode a simple ASCII string", () => {
    expect(base64ToString("aGVsbG8=")).toBe("hello");
  });

  it("should decode a string with spaces", () => {
    expect(base64ToString("aGVsbG8gd29ybGQ=")).toBe("hello world");
  });

  it("should decode a string with non-ASCII characters", () => {
    expect(base64ToString("w6nDqMOo")).toBe("éèè");
  });

  it("should decode a JSON payload", () => {
    expect(base64ToString("eyJrZXkiOiJ2YWx1ZSJ9")).toBe('{"key":"value"}');
  });
});
