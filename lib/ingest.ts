import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { getAdapter, uploadsDir } from "./db";
import { put as blobPut } from "@vercel/blob";
import { classifyFile } from "./classify";
import { parseText } from "./parsers/text";
import { parsePdf } from "./parsers/pdf";
import { parseDocx } from "./parsers/docx";
import { parseXlsxBuffer } from "./parsers/xlsx";
import { parseCsvBuffer } from "./parsers/csv";
import { createEvidence } from "./evidence";
import { ImageTags, SourceType, UploadedFile } from "./types";

const SPREADSHEET_EXTS = [".csv", ".xlsx", ".xls"];
const TEXT_EXTS = [".txt", ".md"];
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];

export async function ingestFile(
  projectId: string,
  originalName: string,
  buffer: Buffer
): Promise<UploadedFile> {
  const db = await getAdapter();
  const id = randomUUID();
  const ext = path.extname(originalName).toLowerCase();
  let storedPath: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await blobPut(`uploads/${projectId}/${id}${ext}`, buffer, { access: "public" });
    storedPath = blob.url;
  } else {
    const dir = uploadsDir(projectId);
    storedPath = path.join(dir, `${id}${ext}`);
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
      for (const sheet of result.sheets) {
        await createEvidence({
          project_id: projectId,
          source_file: originalName,
          source_type: sourceType,
          page_or_sheet: sheet.sheet_name,
          row_or_section: `${sheet.row_count} rows`,
          extracted_text: `Sheet "${sheet.sheet_name}" with columns: ${sheet.headers.join(", ")}. ${sheet.row_count} rows.`,
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
        await createEvidence({
          project_id: projectId, source_file: originalName, source_type: sourceType,
          page_or_sheet: "full document", extracted_text: extractedText.slice(0, 4000),
          confidence: "Medium", tags: ["pdf", sourceType],
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
        await createEvidence({
          project_id: projectId, source_file: originalName, source_type: sourceType,
          page_or_sheet: "full document", extracted_text: extractedText.slice(0, 4000),
          confidence: "Medium", tags: ["docx", sourceType],
        });
      }
    } else if (TEXT_EXTS.includes(ext)) {
      const result = parseText(buffer);
      extractedText = result.text;
      metadata = result.metadata;
      sourceType = classifyFile({ filename: originalName, ext, textSample: extractedText });
      extractionStatus = "done";
      if (extractedText) {
        await createEvidence({
          project_id: projectId, source_file: originalName, source_type: sourceType,
          page_or_sheet: "full document", extracted_text: extractedText.slice(0, 4000),
          confidence: "Medium", tags: ["text", sourceType],
        });
      }
    } else if (IMAGE_EXTS.includes(ext)) {
      sourceType = "screenshot";
      extractionStatus = "done";
      metadata = { note: "Image file — no automatic text extraction. Manual tagging available." };
      await createEvidence({
        project_id: projectId, source_file: originalName, source_type: sourceType,
        extracted_text: `Screenshot uploaded: ${originalName}. Manual tagging recommended.`,
        confidence: "Low", tags: ["screenshot"],
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
    id, project_id: projectId, original_name: originalName, stored_path: storedPath,
    ext, size_bytes: buffer.length, source_type: sourceType, source_type_user_override: 0,
    detected_metadata: JSON.stringify(metadata), extracted_text: extractedText || null,
    image_tags: null, extraction_status: extractionStatus, extraction_error: extractionError,
    created_at: now,
  };

  await db.run(
    `INSERT INTO uploaded_files (id, project_id, original_name, stored_path, ext, size_bytes, source_type, source_type_user_override, detected_metadata, extracted_text, image_tags, extraction_status, extraction_error, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [fileRow.id, fileRow.project_id, fileRow.original_name, fileRow.stored_path, fileRow.ext,
     fileRow.size_bytes, fileRow.source_type, fileRow.source_type_user_override,
     fileRow.detected_metadata, fileRow.extracted_text, fileRow.image_tags,
     fileRow.extraction_status, fileRow.extraction_error, fileRow.created_at]
  );

  return fileRow;
}

export async function updateFileSourceType(fileId: string, sourceType: SourceType): Promise<void> {
  const db = await getAdapter();
  await db.run(
    `UPDATE uploaded_files SET source_type = $1, source_type_user_override = 1 WHERE id = $2`,
    [sourceType, fileId]
  );
}

export async function updateFileImageTags(fileId: string, tags: ImageTags): Promise<void> {
  const db = await getAdapter();
  await db.run(`UPDATE uploaded_files SET image_tags = $1 WHERE id = $2`, [JSON.stringify(tags), fileId]);
}
