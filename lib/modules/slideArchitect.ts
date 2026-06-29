import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { extractJson } from "../jsonExtract";
import { Slide, TalkTrack } from "../types";
import { saveArtifact, getAllArtifacts } from "./artifacts";

export async function generateSlides(projectId: string): Promise<Slide[]> {
  const artifacts = getAllArtifacts(projectId);
  const system = loadPrompt("slide_architect");
  const user = `All prior module outputs for this project:\n${JSON.stringify(
    artifacts,
    null,
    2
  ).slice(0, 14000)}\n\nProduce the 12-slide outline JSON array now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 4000 });
  const slides = extractJson<Slide[]>(raw);
  saveArtifact(projectId, "slides", slides);
  return slides;
}

export async function generateTalkTracks(projectId: string, slides: Slide[]): Promise<TalkTrack[]> {
  const system = loadPrompt("talk_track");
  const user = `Slide outline:\n${JSON.stringify(
    slides.map((s) => ({
      slide_number: s.slide_number,
      slide_title: s.slide_title,
      key_message: s.key_message,
      supporting_points: s.supporting_points,
    }))
  )}\n\nProduce the talk track JSON array now (30s and 60s per slide).`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 4000 });
  const talkTracks = extractJson<TalkTrack[]>(raw);
  saveArtifact(projectId, "talk_tracks", talkTracks);
  return talkTracks;
}
