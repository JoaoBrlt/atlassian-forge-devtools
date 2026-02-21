const TIME_UNITS = [
  { label: "d", scale: 86_400_000 },
  { label: "h", scale: 3_600_000 },
  { label: "m", scale: 60_000 },
  { label: "s", scale: 1_000 },
  { label: "ms", scale: 1 },
] as const;

/**
 * Formats a duration.
 * @param value the duration to format (in milliseconds)
 * @param precision the number of decimal places to use (default: 2)
 * @return the duration in a human-readable format
 */
export function formatDuration(value: number, precision = 2): string {
  if (Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
    return "";
  }
  if (value === 0) {
    return "0 ms";
  }

  let selectedUnit = TIME_UNITS[TIME_UNITS.length - 1];
  for (const unit of TIME_UNITS) {
    if (value >= unit.scale) {
      selectedUnit = unit;
      break;
    }
  }

  const convertedValue = value / selectedUnit.scale;

  if (selectedUnit.scale === 1) {
    return `${Math.round(convertedValue)} ${selectedUnit.label}`;
  }
  return `${Number.parseFloat(convertedValue.toFixed(precision))} ${selectedUnit.label}`;
}
