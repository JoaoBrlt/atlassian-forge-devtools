import HttpStatus from "http-status-codes";

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
