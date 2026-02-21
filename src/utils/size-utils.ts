const SIZE_UNITS = [
  { label: "TB", scale: 1e12 },
  { label: "GB", scale: 1e9 },
  { label: "MB", scale: 1e6 },
  { label: "kB", scale: 1e3 },
  { label: "B", scale: 1 },
] as const;

/**
 * Formats a storage size.
 * @param value the storage size to format (in bytes)
 * @param precision the number of decimal places to use (default: 2)
 * @return the storage size in a human-readable format
 */
export function formatSize(value: number, precision = 2): string {
  if (Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
    return "";
  }
  if (value === 0) {
    return "0 B";
  }

  let selectedUnit = SIZE_UNITS[SIZE_UNITS.length - 1];
  for (const unit of SIZE_UNITS) {
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
