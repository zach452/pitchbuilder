export interface DocxParseResult {
  text: string;
  metadata: Record<string, unknown>;
}

export async function parseDocx(buffer: Buffer): Promise<DocxParseResult> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value ?? "",
      metadata: { messages_count: result.messages?.length ?? 0 },
    };
  } catch (err) {
    return {
      text: "",
      metadata: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}
