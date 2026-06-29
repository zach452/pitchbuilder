import { NextRequest, NextResponse } from "next/server";
import { generateSlides, generateTalkTracks } from "@/lib/modules/slideArchitect";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const slides = await generateSlides(id);
    const talkTracks = await generateTalkTracks(id, slides);
    return NextResponse.json({ slides, talk_tracks: talkTracks });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
