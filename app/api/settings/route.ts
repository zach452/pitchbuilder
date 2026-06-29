import { NextResponse } from "next/server";
import { llmProviderName } from "@/lib/llm";

export async function GET() {
  return NextResponse.json({
    provider: llmProviderName(),
    anthropic_key_set: Boolean(process.env.ANTHROPIC_API_KEY),
    openai_key_set: Boolean(process.env.OPENAI_API_KEY),
  });
}
