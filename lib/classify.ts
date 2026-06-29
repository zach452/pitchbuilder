import { SourceType } from "./types";
import { detectPlatformFromHeaders } from "./parsers/xlsx";

export interface ClassifyInput {
  filename: string;
  ext: string;
  headers?: string[]; // for spreadsheet-like files
  textSample?: string; // for text/pdf/docx files
}

export function classifyFile(input: ClassifyInput): SourceType {
  const name = input.filename.toLowerCase();
  const ext = input.ext.toLowerCase();

  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"].includes(ext)) {
    return "screenshot";
  }

  // Spreadsheet-like: try header-based platform detection first
  if ([".csv", ".xlsx", ".xls"].includes(ext) && input.headers && input.headers.length) {
    const platform = detectPlatformFromHeaders(input.headers);
    if (platform === "meta") return "platform_meta";
    if (platform === "google") return "platform_google";
    if (platform === "tiktok") return "platform_tiktok";
    if (platform === "youtube") return "platform_youtube";
    if (platform === "applovin") return "platform_applovin";
    if (platform === "shopify") return "shopify";

    const headerStr = input.headers.join(" ").toLowerCase();
    if (headerStr.includes("grade") || headerStr.includes("hook") || headerStr.includes("creative")) {
      return "creative_scorecard";
    }
  }

  // Filename-based heuristics
  if (name.includes("rfp") || name.includes("request for proposal")) return "rfp";
  if (name.includes("transcript") || name.includes("fireflies") || name.includes("call notes") || name.includes("discovery")) {
    return "transcript";
  }
  if (name.includes("meta") || name.includes("facebook") || name.includes("fb_ads")) return "platform_meta";
  if (name.includes("google") || name.includes("gads") || name.includes("adwords")) return "platform_google";
  if (name.includes("tiktok")) return "platform_tiktok";
  if (name.includes("youtube") || name.includes("yt_")) return "platform_youtube";
  if (name.includes("applovin")) return "platform_applovin";
  if (name.includes("shopify") || name.includes("orders_export") || name.includes("sales")) return "shopify";
  if (name.includes("creative") && (name.includes("scorecard") || name.includes("audit") || name.includes("grading"))) {
    return "creative_scorecard";
  }
  if (name.includes("case study") || name.includes("prior pitch") || name.includes("deck")) return "prior_pitch";
  if (name.includes("brand") || name.includes("audience") || name.includes("research") || name.includes("persona")) {
    return "brand_research";
  }

  // Text-content based fallback (for txt/pdf/docx where filename is ambiguous)
  if (input.textSample) {
    const sample = input.textSample.toLowerCase().slice(0, 3000);
    if (sample.includes("request for proposal") || sample.includes("rfp") || (sample.includes("scope of work") && sample.includes("submission"))) {
      return "rfp";
    }
    if (sample.includes("speaker") || sample.includes("[inaudible]") || /\d{1,2}:\d{2}/.test(sample)) {
      return "transcript";
    }
  }

  return "unknown";
}
