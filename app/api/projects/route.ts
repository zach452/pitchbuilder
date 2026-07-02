import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/projects";
import { PitchStage } from "@/lib/types";

export async function GET() {
  try {
    const projects = listProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[GET /api/projects]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.prospect_name) {
      return NextResponse.json(
        { error: "name and prospect_name are required" },
        { status: 400 }
      );
    }
    const project = createProject({
      name: body.name,
      prospect_name: body.prospect_name,
      category: body.category,
      pitch_stage: body.pitch_stage as PitchStage | undefined,
      due_date: body.due_date,
      known_budget: body.known_budget,
      known_channels: body.known_channels,
      known_business_goals: body.known_business_goals,
      notes: body.notes,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
