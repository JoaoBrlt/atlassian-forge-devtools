/**
 * Indicates whether a string is null, empty, or white-space only.
 * @param text the string to check
 */
export function isBlank(text: string | null | undefined): text is null | undefined | "" {
  return text == null || text.trim().length === 0;
}

/**
 * Indicates whether a string is not null, not empty, and not white-space only.
 * @param text the string to check
 */
export function isNotBlank(text: string | null | undefined): text is string {
  return !isBlank(text);
}

/**
 * Decodes a base64-encoded string.
 * @param base64 the base64-encoded string
 * @return the decoded string
 */
export function base64ToString(base64: string): string {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
