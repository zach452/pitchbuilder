import { describe, it, expect } from "vitest";
import { classifyFile } from "../lib/classify";

describe("classifyFile", () => {
  it("classifies Meta export by headers", () => {
    const result = classifyFile({
      filename: "export.csv",
      ext: ".csv",
      headers: ["Campaign name", "Amount spent", "Reach", "Frequency", "Impressions"],
    });
    expect(result).toBe("platform_meta");
  });

  it("classifies Google export by headers", () => {
    const result = classifyFile({
      filename: "export.csv",
      ext: ".csv",
      headers: ["Campaign", "Cost", "Impr.", "Clicks", "Conv."],
    });
    expect(result).toBe("platform_google");
  });

  it("classifies Shopify export by headers", () => {
    const result = classifyFile({
      filename: "export.csv",
      ext: ".csv",
      headers: ["Order ID", "Net Sales", "Product"],
    });
    expect(result).toBe("shopify");
  });

  it("classifies RFP by filename", () => {
    const result = classifyFile({ filename: "Client_RFP_2024.pdf", ext: ".pdf" });
    expect(result).toBe("rfp");
  });

  it("classifies transcript by filename", () => {
    const result = classifyFile({ filename: "discovery_call_transcript.txt", ext: ".txt" });
    expect(result).toBe("transcript");
  });

  it("classifies screenshot by extension", () => {
    const result = classifyFile({ filename: "ad_screenshot.png", ext: ".png" });
    expect(result).toBe("screenshot");
  });

  it("falls back to unknown when nothing matches", () => {
    const result = classifyFile({ filename: "random_file.txt", ext: ".txt", textSample: "lorem ipsum" });
    expect(result).toBe("unknown");
  });
});
