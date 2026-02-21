import { getSafeStatusText } from "./http-utils";
import { describe, expect, it } from "vitest";

describe("getSafeStatusText", () => {
  it("should return 'Unknown' for an invalid number", () => {
    expect(getSafeStatusText(NaN)).toBe("Unknown");
  });

  it("should return 'Unknown' for a negative number", () => {
    expect(getSafeStatusText(-1)).toBe("Unknown");
  });

  it("should return 'Unknown' for an unknown status code", () => {
    expect(getSafeStatusText(42)).toBe("Unknown");
  });

  it("should return 'Continue' for 100", () => {
    expect(getSafeStatusText(100)).toBe("Continue");
  });

  it("should return 'OK' for 200", () => {
    expect(getSafeStatusText(200)).toBe("OK");
  });

  it("should return 'Moved Permanently' for 301", () => {
    expect(getSafeStatusText(301)).toBe("Moved Permanently");
  });

  it("should return 'Bad Request' for 400", () => {
    expect(getSafeStatusText(400)).toBe("Bad Request");
  });

  it("should return 'Internal Server Error' for 500", () => {
    expect(getSafeStatusText(500)).toBe("Internal Server Error");
  });
});
