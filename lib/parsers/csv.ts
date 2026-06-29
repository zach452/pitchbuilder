import { parseXlsxBuffer, XlsxParseResult } from "./xlsx";

// SheetJS can parse CSV directly via XLSX.read with type 'buffer'; this is a
// thin semantic wrapper so call sites are clear about intent.
export function parseCsvBuffer(buffer: Buffer): XlsxParseResult {
  return parseXlsxBuffer(buffer, true);
}
