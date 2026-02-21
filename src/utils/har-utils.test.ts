import { Entry, Har, Log } from "har-format";
import { describe, expect, it } from "vitest";
import { buildHarFile, parseHarFile } from "./har-utils";

function buildHarFileContent(overrides?: Partial<Log>): string {
  return JSON.stringify({
    log: {
      version: "1.2",
      creator: {
        name: "Browser",
        version: "1.0.0",
      },
      entries: [],
      ...overrides,
    },
  });
}

function buildHarEntry(overrides?: Partial<Entry>): Entry {
  return {
    startedDateTime: "2024-01-01T00:00:00.000Z",
    time: 100,
    request: {
      method: "POST",
      url: "https://example.atlassian.net/gateway/api/graphql",
      httpVersion: "HTTP/2.0",
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: 0,
      bodySize: 0,
    },
    response: {
      status: 200,
      statusText: "OK",
      httpVersion: "HTTP/2.0",
      headers: [],
      cookies: [],
      content: { size: 0, mimeType: "application/json" },
      redirectURL: "",
      headersSize: 0,
      bodySize: 0,
      _transferSize: 0,
    },
    cache: {},
    timings: { send: 0, wait: 100, receive: 0 },
    ...overrides,
  };
}

describe("parseHarFile", () => {
  it("should throw if the file is undefined", async () => {
    await expect(parseHarFile(undefined as unknown as File)).rejects.toThrow("File is null or undefined");
  });

  it("should throw if the file is null", async () => {
    await expect(parseHarFile(null as unknown as File)).rejects.toThrow("File is null or undefined");
  });

  it("should throw if the file content is not valid JSON", async () => {
    const file = new File(["not json"], "file.har", { type: "application/json" });
    await expect(parseHarFile(file)).rejects.toThrow("Failed to parse JSON");
  });

  it("should throw if the file content is not a valid HAR (missing log)", async () => {
    const file = new File([JSON.stringify({ foo: "bar" })], "file.har", { type: "application/json" });
    await expect(parseHarFile(file)).rejects.toThrow("Invalid HAR file");
  });

  it("should throw if the file content is not a valid HAR (missing log.entries)", async () => {
    const file = new File([JSON.stringify({ log: {} })], "file.har", { type: "application/json" });
    await expect(parseHarFile(file)).rejects.toThrow("Invalid HAR file");
  });

  it("should throw if the file content is not a valid HAR (invalid log.entries)", async () => {
    const file = new File([JSON.stringify({ log: { entries: "not-an-array" } })], "capture.har", {
      type: "application/json",
    });
    await expect(parseHarFile(file)).rejects.toThrow("Invalid HAR file");
  });

  it("should parse a valid HAR file with no entries", async () => {
    const file = new File([buildHarFileContent()], "file.har", { type: "application/json" });
    const result = await parseHarFile(file);
    expect(result.log.entries).toEqual([]);
  });

  it("should parse a valid HAR file with entries", async () => {
    const entries = [buildHarEntry()];
    const file = new File([buildHarFileContent({ entries })], "file.har", { type: "application/json" });
    const result = await parseHarFile(file);
    expect(result.log.entries).toHaveLength(1);
  });
});

describe("buildHarFile", () => {
  it("should build a file with the default name", () => {
    const file = buildHarFile([]);
    expect(file.name).toBe("file.har");
  });

  it("should build a file with a custom name", () => {
    const file = buildHarFile([], "export.har");
    expect(file.name).toBe("export.har");
  });

  it("should build a file with the correct MIME type", () => {
    const file = buildHarFile([]);
    expect(file.type).toBe("application/json");
  });

  it("should include the correct HAR version", async () => {
    const file = buildHarFile([]);
    const content = JSON.parse(await file.text()) as Har;
    expect(content.log.version).toBe("1.2");
  });

  it("should include the provided entries", async () => {
    const entries = [buildHarEntry(), buildHarEntry()];
    const file = buildHarFile(entries);
    const content = JSON.parse(await file.text()) as Har;
    expect(content.log.entries).toHaveLength(2);
    expect(content.log.entries).toEqual(entries);
  });
});
