import fs from "fs";
import path from "path";

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

const cache = new Map<string, string>();

export function loadPrompt(name: string): string {
  if (cache.has(name)) return cache.get(name) as string;
  const filePath = path.join(PROMPTS_DIR, `${name}.md`);
  const content = fs.readFileSync(filePath, "utf-8");
  cache.set(name, content);
  return content;
}
