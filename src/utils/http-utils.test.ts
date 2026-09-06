import { getSafeStatusText, parseUrl } from "./http-utils";
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

describe("parseUrl", () => {
  it("should parse an absolute URL", () => {
    expect(parseUrl("https://www.google.com/foo/bar")).toEqual({
      protocol: "https",
      host: "www.google.com",
      pathname: "/foo/bar",
      searchParams: [],
    });
  });

  it("should parse an absolute URL with a port", () => {
    expect(parseUrl("http://localhost:8080/foo/bar")).toEqual({
      protocol: "http",
      host: "localhost:8080",
      pathname: "/foo/bar",
      searchParams: [],
    });
  });

  it("should parse an absolute URL without a path", () => {
    expect(parseUrl("https://www.google.com")).toEqual({
      protocol: "https",
      host: "www.google.com",
      pathname: "/",
      searchParams: [],
    });
  });

  it("should parse an absolute URL with query parameters", () => {
    expect(parseUrl("https://www.google.com/foo/bar?foo=bar&foo2=bar2")).toEqual({
      protocol: "https",
      host: "www.google.com",
      pathname: "/foo/bar",
      searchParams: [
        { name: "foo", value: "bar" },
        { name: "foo2", value: "bar2" },
      ],
    });
  });

  it("should parse a relative URL", () => {
    expect(parseUrl("/rest/api/3/issue")).toEqual({
      pathname: "/rest/api/3/issue",
      searchParams: [],
    });
  });

  it("should parse a relative URL with query parameters", () => {
    expect(parseUrl("/rest/api/3/search?jql=project%20%3D%20PROJ&maxResults=50")).toEqual({
      pathname: "/rest/api/3/search",
      searchParams: [
        { name: "jql", value: "project = PROJ" },
        { name: "maxResults", value: "50" },
      ],
    });
  });

  it("should parse repeated query parameters", () => {
    expect(parseUrl("/rest/api/3/issue?fields=summary&fields=status")).toEqual({
      pathname: "/rest/api/3/issue",
      searchParams: [
        { name: "fields", value: "summary" },
        { name: "fields", value: "status" },
      ],
    });
  });

  it("should parse a query parameter without a value", () => {
    expect(parseUrl("/rest/api/3/issue?expand")).toEqual({
      pathname: "/rest/api/3/issue",
      searchParams: [{ name: "expand", value: "" }],
    });
  });

  it("should parse an absolute URL with a hash", () => {
    expect(parseUrl("https://www.google.com/foo/bar#section")).toEqual({
      protocol: "https",
      host: "www.google.com",
      pathname: "/foo/bar",
      searchParams: [],
      hash: "section",
    });
  });

  it("should parse a relative URL with a hash", () => {
    expect(parseUrl("/rest/api/3/issue#comments")).toEqual({
      pathname: "/rest/api/3/issue",
      searchParams: [],
      hash: "comments",
    });
  });

  it("should parse a URL with query parameters and a hash", () => {
    expect(parseUrl("/rest/api/3/issue?fields=summary#comments")).toEqual({
      pathname: "/rest/api/3/issue",
      searchParams: [{ name: "fields", value: "summary" }],
      hash: "comments",
    });
  });

  it("should parse a hash containing separators", () => {
    expect(parseUrl("/foo#/bar?baz=1")).toEqual({
      pathname: "/foo",
      searchParams: [],
      hash: "/bar?baz=1",
    });
  });

  it("should ignore an empty hash", () => {
    expect(parseUrl("/rest/api/3/issue#")).toEqual({
      pathname: "/rest/api/3/issue",
      searchParams: [],
      hash: undefined,
    });
  });

  it("should return the raw URL when it cannot be parsed", () => {
    expect(parseUrl("http://")).toEqual({
      pathname: "http://",
    });
  });
});
