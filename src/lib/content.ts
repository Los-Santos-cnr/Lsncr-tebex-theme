import { readFile } from "fs/promises";
import path from "path";

export async function getMarkdownContent(filename: string) {
  const filePath = path.join(process.cwd(), "content", filename);
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}
