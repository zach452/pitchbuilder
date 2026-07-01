import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { getDb, uploadsDir } from "./db";
import { put as blobPut } from "@vercel/blob";
import { classifyFile } from "./classify";
import { parseText } from "./parsers/text";
import { parsePdf } from "./parsers/pdf";
import { parseDocx } from "./parsers/docx";
import { parseXlsxBuffer } from "./parsers/xlsx";
import { parseCsvBuffer } from "./parsers/csv";
import { createEvidence } from "./evidence";
import { SourceType, UploadedFile } from "./types";

const SPREADSHEET_EXTS = [".csv", ".xlsx", ".xls"];
const TEXT_EXTS = [".txt", ".md"];
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];

export async function ingestFile(
  projectId: string,
  originalName: string,
  buffer: Buffer
): Promise<UploadedFile> {
  const db = getDb();
  const id = randomUUID();
  const ext = path.extname(originalName).toLowerCase();
  let storedPath: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Vercel Blob: upload at upload-time; store the blob URL as stored_path
    const blob = await blobPut(`uploads/${projectId}/${id}${ext}`, buffer, {
      access: "public",
    });
    storedPath = blob.url;
  } else {
    // Local filesystem fallback
    const dir = uploadsDir(projectId);
    const storedName = `${id}${ext}`;
    storedPath = path.join(dir, storedName);
    fs.writeFileSync(storedPath, buffer);
  }

  const now = new Date().toISOString();

  let extractedText = "";
  let metadata: Record<string, unknown> = {};
  let sourceType: SourceType = "unknown";
  let extractionStatus: "pending" | "done" | "error" = "pending";
  let extractionError: string | null = null;

  try {
    if (SPREADSHEET_EXTS.includes(ext)) {
      const result = ext === ".csv" ? parseCsvBuffer(buffer) : parseXlsxBuffer(buffer);
      extractedText = result.text;
      metadata = result.metadata;
      const headers = result.sheets.flatMap((s) => s.headers);
      sourceType = classifyFile({ filename: originalName, ext, headers });
      extractionStatus = "done";

      // create evidence per sheet
      for (const sheet of result.sheets) {
        createEvidence({
          project_id: projectId,
          source_file: originalName,
          source_type: sourceType,
          page_or_sheet: sheet.sheet_name,
          row_or_section: `${sheet.row_count} rows`,
          extracted_text: `Sheet "${sheet.sheet_name}" with columns: ${sheet.headers.join(
            ", "
          )}. ${sheet.row_count} rows.`,
          metric_name: "row_count",
          metric_value: String(sheet.row_count),
          confidence: sheet.row_count > 0 ? "High" : "Low",
          tags: ["spreadsheet", sourceType],
        });
      }
    } else if (ext === ".pdf") {
      const result = await parsePdf(buffer);
      extractedText = result.text;
      metadata = result.metadata;
      sourceType = classifyFile({ filename: originalName, ext, textSample: extractedText });
      extractionStatus = result.text ? "done" : "error";
      if (!result.text) extractionError = (metadata.error as string) ?? "No text extracted";
      if (extractedText) {
        createEvidence({
          project_id: projectId,
          source_file: originalName,
          source_type: sourceType,
          page_or_sheet: "full document",
          extracted_text: extractedText.slice(0, 4000),
          confidence: "Medium",
          tags: ["pdf", sourceType],
        });
      }
    } else if (ext === ".docx") {
      const result = await parseDocx(buffer);
      extractedText = result.text;
      metadata = result.metadata;
      sourceType = classifyFile({ filename: originalName, ext, textSample: extractedText });
      extractionStatus = result.text ? "done" : "error";
      if (!result.text) extractionError = (metadata.error as string) ?? "No text extracted";
      if (extractedText) {
        createEvidence({
          project_id: projectId,
          source_file: originalName,
          source_type: sourceType,
          page_or_sheet: "full document",
          extracted_text: extractedText.slice(0, 4000),
          confidence: "Medium",
          tags: ["docx", sourceType],
        });
      }
    } else if (TEXT_EXTS.includes(ext)) {
      const result = parseText(buffer);
      extractedText = result.text;
      metadata = result.metadata;
      sourceType = classifyFile({ filename: originalName, ext, textSample: extractedText });
      extractionStatus = "done";
      if (extractedText) {
        createEvidence({
          project_id: projectId,
          source_file: originalName,
          source_type: sourceType,
          page_or_sheet: "full document",
          extracted_text: extractedText.slice(0, 4000),
          confidence: "Medium",
          tags: ["text", sourceType],
        });
      }
    } else if (IMAGE_EXTS.includes(ext)) {
      sourceType = "screenshot";
      extractionStatus = "done";
      metadata = { note: "Image file — no automatic text extraction. Manual tagging available." };
      createEvidence({
        project_id: projectId,
        source_file: originalName,
        source_type: sourceType,
        extracted_text: `Screenshot uploaded: ${originalName}. Manual tagging recommended (format, creative type, hook, product, CTA, offer, funnel role).`,
        confidence: "Low",
        tags: ["screenshot"],
      });
    } else {
      sourceType = "unknown";
      extractionStatus = "error";
      extractionError = `Unsupported file extension: ${ext}`;
    }
  } catch (err) {
    extractionStatus = "error";
    extractionError = err instanceof Error ? err.message : String(err);
  }

  const fileRow: UploadedFile = {
    id,
    project_id: projectId,
    original_name: originalName,
    stored_path: storedPath,
    ext,
    size_bytes: buffer.length,
    source_type: sourceType,
    source_type_user_override: 0,
    detected_metadata: JSON.stringify(metadata),
    extracted_text: extractedText || null,
    image_tags: null,
    extraction_status: extractionStatus,
    extraction_error: extractionError,
    created_at: now,
  };

  db.prepare(
    `INSERT INTO uploaded_files (id, project_id, original_name, stored_path, ext, size_bytes, source_type, source_type_user_override, detected_metadata, extracted_text, image_tags, extraction_status, extraction_error, created_at)
     VALUES (@id, @project_id, @original_name, @stored_path, @ext, @size_bytes, @source_type, @source_type_user_override, @detected_metadata, @extracted_text, @image_tags, @extraction_status, @extraction_error, @created_at)`
  ).run(fileRow);

  return fileRow;
}

export function updateFileSourceType(fileId: string, sourceType: SourceType): void {
  const db = getDb();
  db.prepare(
    `UPDATE uploaded_files SET source_type = ?, source_type_user_override = 1 WHERE id = ?`
  ).run(sourceType, fileId);
}

export function updateFileImageTags(fileId: string, tags: import("./types").ImageTags): void {
  const db = getDb();
  db.prepare(
    `UPDATE uploaded_files SET image_tags = ? WHERE id = ?`
  ).run(JSON.stringify(tags), fileId);
}
