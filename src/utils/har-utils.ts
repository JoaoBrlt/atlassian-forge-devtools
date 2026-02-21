import { MinimalHarSchema } from "@/schemas/har";
import { buildJsonFile, parseJsonFile } from "@/utils/file-utils";
import { Entry, Har } from "har-format";

/**
 * Parses a HAR file.
 * @param file the HAR file to parse
 * @return the HAR content of the file
 */
export async function parseHarFile(file: File): Promise<Har> {
  const json = await parseJsonFile(file);

  try {
    MinimalHarSchema.parse(json);
  } catch (error) {
    throw new Error("Invalid HAR file", { cause: error });
  }

  return json as Har;
}

/**
 * Builds a HAR file.
 * @param entries the HAR entries to include
 * @param fileName the name of the file (defaults to "file.har")
 * @return the HAR file
 */
export function buildHarFile(entries: Entry[], fileName: string = "file.har"): File {
  const data = {
    log: {
      version: "1.2",
      creator: {
        name: import.meta.env.PACKAGE_NAME ?? "unknown",
        version: import.meta.env.PACKAGE_VERSION ?? "unknown",
      },
      entries,
    },
  };

  return buildJsonFile(data, fileName);
}
