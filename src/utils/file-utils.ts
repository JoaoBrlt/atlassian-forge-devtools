/**
 * Parses a JSON file.
 * @param file the JSON file to parse
 * @return the JSON content of the file
 */
export async function parseJsonFile<T = unknown>(file: File): Promise<T> {
  if (file == null) {
    throw new Error("File is null or undefined");
  }

  let text: string;
  try {
    text = await file.text();
  } catch (error) {
    throw new Error("Failed to read file", { cause: error });
  }

  let raw: T;
  try {
    raw = JSON.parse(text) as T;
  } catch (error) {
    throw new Error("Failed to parse JSON", { cause: error });
  }

  return raw;
}

/**
 * Builds a JSON file.
 * @param data the JSON content of the file
 * @param fileName the name of the file (defaults to "file.json")
 * @return the JSON file
 */
export function buildJsonFile<T = unknown>(data: T, fileName: string = "file.json"): File {
  let content: string;
  try {
    content = JSON.stringify(data, null, 2);
  } catch (error) {
    throw new Error("Failed to serialize JSON", { cause: error });
  }

  return new File([content], fileName, { type: "application/json" });
}
