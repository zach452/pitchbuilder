export interface PdfParseResult {
  text: string;
  metadata: Record<string, unknown>;
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  try {
    // pdf-parse v2 exports a default function
    const mod = await import("pdf-parse");
    const pdfParse = (mod as unknown as { default: (b: Buffer) => Promise<{ text: string; numpages: number }> }).default ?? (mod as unknown as (b: Buffer) => Promise<{ text: string; numpages: number }>);
    const data = await pdfParse(buffer);
    return {
      text: data.text ?? "",
      metadata: { page_count: data.numpages ?? null },
    };
  } catch (err) {
    return {
      text: "",
      metadata: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}
