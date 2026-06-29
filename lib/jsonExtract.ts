// Best-effort extraction of a JSON value from an LLM text response that may
// include markdown code fences or surrounding prose.
export function extractJson<T = unknown>(text: string): T {
  let candidate = text.trim();

  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    candidate = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Try to find the first { or [ and last } or ] to salvage embedded JSON
    const firstBrace = Math.min(
      ...["{", "["]
        .map((c) => candidate.indexOf(c))
        .filter((i) => i !== -1)
    );
    const lastBrace = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
    if (firstBrace !== Infinity && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = candidate.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced) as T;
    }
    throw new Error("Could not extract JSON from LLM response");
  }
}
