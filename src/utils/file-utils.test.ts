import { describe, expect, it } from "vitest";
import { buildJsonFile, parseJsonFile } from "./file-utils";

describe("parseJsonFile", () => {
  it("should throw if the file is undefined", async () => {
    await expect(parseJsonFile(undefined as unknown as File)).rejects.toThrow("File is null or undefined");
  });

  it("should throw if the file is null", async () => {
    await expect(parseJsonFile(null as unknown as File)).rejects.toThrow("File is null or undefined");
  });

  it("should throw if the file content cannot be read", async () => {
    const file = { text: () => Promise.reject(new Error("read error")) } as unknown as File;
    await expect(parseJsonFile(file)).rejects.toThrow("Failed to read file");
  });

  it("should throw if the file content is an empty string", async () => {
    const file = new File([""], "test.json", { type: "application/json" });
    await expect(parseJsonFile(file)).rejects.toThrow("Failed to parse JSON");
  });

  it("should throw if the file content is not valid JSON", async () => {
    const file = new File(["not json"], "test.json", { type: "application/json" });
    await expect(parseJsonFile(file)).rejects.toThrow("Failed to parse JSON");
  });

  it("should parse if the file content is null", async () => {
    const data = null;
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });
    await expect(parseJsonFile(file)).resolves.toEqual(data);
  });

  it("should parse if the file content is a number", async () => {
    const data = 123;
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });
    await expect(parseJsonFile(file)).resolves.toEqual(data);
  });

  it("should parse if the file content is a string", async () => {
    const data = "hello, world!";
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });
    await expect(parseJsonFile(file)).resolves.toEqual(data);
  });

  it("should parse if the file content is a boolean", async () => {
    const data = true;
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });
    await expect(parseJsonFile(file)).resolves.toEqual(data);
  });

  it("should parse if the file content is an object", async () => {
    const data = { key: "value", num: 42 };
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });
    await expect(parseJsonFile(file)).resolves.toEqual(data);
  });

  it("should parse if the file content is an array", async () => {
    const data = [1, 2, 3];
    const file = new File([JSON.stringify(data)], "test.json", { type: "application/json" });
    await expect(parseJsonFile(file)).resolves.toEqual(data);
  });
});

describe("buildJsonFile", () => {
  it("should throw if the data cannot be serialized to JSON", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => buildJsonFile(circular)).toThrow("Failed to serialize JSON");
  });

  it("should build a file if the data is null", async () => {
    const data = null;
    const file = buildJsonFile(data);
    const rawFileContent = await file.text();
    const fileContent = JSON.parse(rawFileContent) as unknown;
    expect(file.name).toBe("file.json");
    expect(file.type).toBe("application/json");
    expect(fileContent).toStrictEqual(data);
  });

  it("should build a file if the data is a number", async () => {
    const data = 123;
    const file = buildJsonFile(data);
    const rawFileContent = await file.text();
    const fileContent = JSON.parse(rawFileContent) as unknown;
    expect(file.name).toBe("file.json");
    expect(file.type).toBe("application/json");
    expect(fileContent).toStrictEqual(data);
  });

  it("should build a file if the data is a string", async () => {
    const data = "hello, world!";
    const file = buildJsonFile(data);
    const rawFileContent = await file.text();
    const fileContent = JSON.parse(rawFileContent) as unknown;
    expect(file.name).toBe("file.json");
    expect(file.type).toBe("application/json");
    expect(fileContent).toStrictEqual(data);
  });

  it("should build a file if the data is a boolean", async () => {
    const data = true;
    const file = buildJsonFile(data);
    const rawFileContent = await file.text();
    const fileContent = JSON.parse(rawFileContent) as unknown;
    expect(file.name).toBe("file.json");
    expect(file.type).toBe("application/json");
    expect(fileContent).toStrictEqual(data);
  });

  it("should build a file if the data is an object", async () => {
    const data = { key: "value", num: 42 };
    const file = buildJsonFile(data);
    const rawFileContent = await file.text();
    const fileContent = JSON.parse(rawFileContent) as unknown;
    expect(file.name).toBe("file.json");
    expect(file.type).toBe("application/json");
    expect(fileContent).toStrictEqual(data);
  });

  it("should build a file if the data is an array", async () => {
    const data = [1, 2, 3];
    const file = buildJsonFile(data);
    const rawFileContent = await file.text();
    const fileContent = JSON.parse(rawFileContent) as unknown;
    expect(file.name).toBe("file.json");
    expect(file.type).toBe("application/json");
    expect(fileContent).toStrictEqual(data);
  });

  it("should build a file with a custom name", async () => {
    const data = { key: "value", num: 42 };
    const file = buildJsonFile(data, "custom.json");
    const rawFileContent = await file.text();
    const fileContent = JSON.parse(rawFileContent) as unknown;
    expect(file.name).toBe("custom.json");
    expect(file.type).toBe("application/json");
    expect(fileContent).toStrictEqual(data);
  });
});
