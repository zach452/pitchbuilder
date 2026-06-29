import { NextRequest, NextResponse } from "next/server";
import { generateCreativeAudit } from "@/lib/modules/creativeAudit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await generateCreativeAudit(id);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
