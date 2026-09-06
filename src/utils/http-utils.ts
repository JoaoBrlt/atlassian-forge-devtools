import HttpStatus from "http-status-codes";

const RELATIVE_URL_BASE = "http://localhost";

/**
 * Returns the reason phrase for the given status code.
 * @param status the status code
 * @return the corresponding reason phrase, or "Unknown" if the status code is not recognized
 */
export function getSafeStatusText(status: number) {
  try {
    return HttpStatus.getStatusText(status);
  } catch {
    return "Unknown";
  }
}

export interface UrlSearchParam {
  name: string;
  value: string;
}

export interface ParsedUrl {
  protocol?: string;
  host?: string;
  pathname: string;
  searchParams?: UrlSearchParam[];
  hash?: string;
}

export function parseUrl(url: string): ParsedUrl {
  const absoluteUrl = URL.parse(url);
  if (absoluteUrl != null) {
    return {
      protocol: parseProtocol(absoluteUrl.protocol),
      host: parseHost(absoluteUrl.host),
      pathname: absoluteUrl.pathname,
      searchParams: parseSearchParams(absoluteUrl.searchParams),
      hash: parseHash(absoluteUrl.hash),
    };
  }

  const relativeUrl = URL.parse(url, RELATIVE_URL_BASE);
  if (relativeUrl != null) {
    return {
      pathname: relativeUrl.pathname,
      searchParams: parseSearchParams(relativeUrl.searchParams),
      hash: parseHash(relativeUrl.hash),
    };
  }

  return { pathname: url };
}

function parseProtocol(protocol: string | undefined | null): string | undefined {
  if (protocol == null || protocol.length === 0) {
    return undefined;
  }
  return protocol.replace(":", "");
}

function parseHost(host: string | undefined | null): string | undefined {
  if (host == null || host.length === 0) {
    return undefined;
  }
  return host;
}

function parseSearchParams(searchParams: URLSearchParams | undefined | null): UrlSearchParam[] | undefined {
  if (searchParams == null) {
    return undefined;
  }
  return Array.from(searchParams, ([name, value]) => ({ name, value }));
}

function parseHash(hash: string | undefined | null): string | undefined {
  if (hash == null || hash.length === 0) {
    return undefined;
  }
  return hash.slice(1);
}
