export interface TextParseResult {
  text: string;
  metadata: Record<string, unknown>;
}

export function parseText(buffer: Buffer): TextParseResult {
  const text = buffer.toString("utf-8");
  const lineCount = text.split(/\r?\n/).length;
  return {
    text,
    metadata: { line_count: lineCount, char_count: text.length },
  };
}
