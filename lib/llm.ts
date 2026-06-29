// Provider-agnostic LLM wrapper. Picks Anthropic or OpenAI based on env vars.
// Falls back to a deterministic mock generator if no API key is configured,
// so the app is fully demoable without any keys.

export interface CallLLMOpts {
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean; // hint that caller expects valid JSON back
}

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

export function llmProviderName(): string {
  if (ANTHROPIC_KEY) return "anthropic";
  if (OPENAI_KEY) return "openai";
  return "mock";
}

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  opts: CallLLMOpts = {}
): Promise<string> {
  const provider = llmProviderName();
  if (provider === "anthropic") {
    return callAnthropic(systemPrompt, userPrompt, opts);
  }
  if (provider === "openai") {
    return callOpenAI(systemPrompt, userPrompt, opts);
  }
  return mockGenerate(systemPrompt, userPrompt, opts);
}

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  opts: CallLLMOpts
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.4,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const text = (data.content ?? [])
    .map((block: { type: string; text?: string }) =>
      block.type === "text" ? block.text ?? "" : ""
    )
    .join("");
  return text;
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  opts: CallLLMOpts
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// --- Deterministic mock generator -----------------------------------------
// Produces clearly-labeled placeholder content shaped like what the real
// LLM would return so the rest of the app (which expects JSON in most
// cases) keeps working end-to-end without any API key configured.

function mockGenerate(
  systemPrompt: string,
  userPrompt: string,
  opts: CallLLMOpts
): string {
  const label = "[MOCK LLM OUTPUT — no ANTHROPIC_API_KEY/OPENAI_API_KEY set]";

  if (opts.jsonMode) {
    // Identify which module this is from the system prompt's H1 title line
    // (e.g. "# RFP Decoder") rather than scanning the whole prompt body —
    // scanning the full body risks false matches since prompts reference
    // other module names in their Inputs/Rules sections.
    const titleLine = systemPrompt.split("\n").find((l) => l.trim().startsWith("# "));
    const title = (titleLine ?? systemPrompt.slice(0, 80)).toLowerCase();

    if (title.includes("rfp decoder")) {
      return JSON.stringify(mockRfp(label));
    }
    if (title.includes("fireflies") || title.includes("transcript")) {
      return JSON.stringify(mockTranscript(label));
    }
    if (title.includes("business diagnosis")) {
      return JSON.stringify(mockDiagnosis(label));
    }
    if (title.includes("paid media audit")) {
      return JSON.stringify(mockPaidMedia(label));
    }
    if (title.includes("shopify")) {
      return JSON.stringify(mockShopify(label));
    }
    if (title.includes("win strategy")) {
      return JSON.stringify(mockWinStrategy(label));
    }
    if (title.includes("slide architect")) {
      return JSON.stringify(mockSlides(label));
    }
    if (title.includes("talk track")) {
      return JSON.stringify(mockTalkTracks(label));
    }
    if (title.includes("anticipated") || title.includes("q&a")) {
      return JSON.stringify(mockQA(label));
    }
    if (title.includes("measurement maturity")) {
      return JSON.stringify({
        maturity_score: 2,
        rationale: `${label} Limited evidence of cross-platform reconciliation found in uploads. Defaulting to a conservative maturity score pending real data.`,
        roadmap: [
          "Stand up a single source-of-truth KPI stack across platforms and Shopify.",
          "Reconcile platform-reported conversions against Shopify orders monthly.",
          "Introduce lightweight incrementality testing (geo holdout) once volume supports it.",
        ],
      });
    }
    if (title.includes("recommendations")) {
      return JSON.stringify(mockRecommendations(label));
    }
    if (title.includes("comms compass") || title.includes("four c") || title.includes("four_cs")) {
      return JSON.stringify({
        category: `${label} Category context not yet available from uploads.`,
        company: "Directional inference: positioning inferred from uploaded materials only.",
        competition: "Needs validation: no competitive teardown uploaded.",
        consumer: "Directional inference based on available transcript/RFP signals.",
        comms_compass: {
          truth: "Needs validation.",
          tension: "Needs validation.",
          territory: "Directional inference.",
          message: "Directional inference.",
        },
      });
    }
    if (title.includes("creative audit")) {
      return JSON.stringify({
        grade_distribution: { A: 1, B: 2, C: 2, D: 1, F: 0 },
        findings: [
          `${label} Top-performing creative pattern not yet determinable from limited sample.`,
        ],
      });
    }
    if (title.includes("critique") || title.includes("quality control")) {
      return JSON.stringify({
        overall_score: 70,
        issues: [`${label} No real LLM available — critique is a placeholder.`],
        strengths: ["Package structure is complete and internally consistent."],
      });
    }

    // generic fallback JSON
    return JSON.stringify({
      mock: true,
      note: label,
      system_prompt_excerpt: systemPrompt.slice(0, 120),
    });
  }

  return `${label}\n\nThis is placeholder narrative content generated without a configured LLM provider. Configure ANTHROPIC_API_KEY or OPENAI_API_KEY to generate real, grounded strategy content.\n\nPrompt context (truncated): ${userPrompt.slice(
    0,
    200
  )}`;
}

function mockRfp(label: string) {
  return {
    executive_summary: `${label} This prospect is seeking a performance marketing partner. Real synthesis requires an LLM key; this is a structural placeholder grounded in uploaded RFP text where available.`,
    business_objectives: ["Grow qualified pipeline / revenue", "Improve marketing efficiency"],
    required_capabilities: ["Paid social management", "Paid search management", "Measurement & reporting"],
    stated_kpis: ["ROAS", "CPA", "Revenue growth"],
    budget_parameters: "Needs validation: budget not confidently extracted.",
    timing: "Needs validation: timeline not confidently extracted.",
    channels_requested: ["Meta", "Google"],
    deliverables: ["Media plan", "Reporting cadence", "Creative strategy"],
    decision_criteria: ["Strategic fit", "Cost competitiveness", "Team chemistry"],
    stakeholder_priorities: ["CMO: growth", "CFO: efficiency"],
    explicit_questions: ["What is your approach to measurement?"],
    hidden_questions: ["Can this team operate independently with light oversight?"],
    risks: ["Limited historical data shared", "Aggressive timeline"],
    win_conditions: ["Clear, evidence-backed point of view", "Credible measurement plan"],
    lose_conditions: ["Generic, boilerplate strategy", "No grounded data references"],
    source_evidence_ids: [],
  };
}

function mockTranscript(label: string) {
  return {
    what_we_heard: [`${label} Placeholder — configure an LLM key for real synthesis.`],
    what_they_really_need: ["Directional inference: a partner who reduces reporting overhead."],
    unspoken_concerns: ["Needs validation: prior agency relationship may have ended poorly."],
    stakeholder_map: [{ name: "Unknown", role: "Decision maker", priorities: "Needs validation" }],
    language_to_reuse: ["growth", "efficiency"],
    follow_up_questions: ["What does success look like in 90 days?"],
    pitch_narrative_implications: ["Lead with measurement credibility."],
    source_evidence_ids: [],
  };
}

function mockDiagnosis(label: string) {
  return {
    diagnosis_paragraph: `${label} This is a structural placeholder business diagnosis. With a configured LLM key, this paragraph will synthesize the business model, customer, objectives, market context, and measurement reality into a single, sharp point of view, ending in the one real growth lever.`,
    business_model: "Needs validation",
    customer: "Needs validation",
    objectives: "Directional inference based on uploaded materials",
    market: "Needs validation",
    measurement_reality: "Directional inference: platform-reported metrics only, limited reconciliation observed",
    growth_levers: ["Improve full-funnel measurement", "Concentrate spend on proven channels", "Refresh creative testing cadence"],
    blockers: ["Fragmented data sources", "Limited creative testing velocity"],
    lead_with: ["Measurement rigor", "Evidence-backed media plan"],
    proof_needed: ["Case study with comparable vertical"],
    source_evidence_ids: [],
  };
}

function mockPaidMedia(label: string) {
  const mk = (i: number) => ({
    headline: `${label} Finding ${i} — placeholder pending real data synthesis`,
    severity: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
    business_impact: "Directional inference based on extracted spend data.",
    recommendation: "Consolidate budget toward top-performing campaigns and re-test underperformers.",
    slide_ready_headline: `Finding ${i}: Efficiency opportunity identified`,
    talk_track: "We found a clear opportunity to reallocate spend toward what's already working.",
    source_evidence_ids: [],
  });
  return Array.from({ length: 6 }, (_, i) => mk(i + 1));
}

function mockShopify(label: string) {
  return [
    {
      headline: `${label} Revenue concentration placeholder finding`,
      severity: "Medium",
      detail: "Directional inference: revenue likely concentrated in a small set of products.",
      recommendation: "Validate top-product concentration and align creative testing accordingly.",
      source_evidence_ids: [],
    },
  ];
}

function mockWinStrategy(label: string) {
  return {
    winning_thesis: `${label} We win by pairing measurement rigor with a credible, evidence-backed media plan.`,
    pillars: [
      {
        title: "Measurement Clarity",
        problem: "Needs validation",
        opportunity: "Directional inference",
        recommendation: "Stand up unified KPI stack",
        proof: "Needs validation",
        impact: "Directional inference",
      },
    ],
    push_into: ["Measurement rigor", "Creative testing velocity"],
    avoid: ["Generic channel-mix slides"],
    differentiation: "Needs validation",
    red_thread: "Evidence-backed growth lever carried through every slide.",
    confidence_level: "Medium",
    deal_risks: ["Limited data shared pre-pitch"],
    required_proof_points: ["Comparable case study"],
    source_evidence_ids: [],
  };
}

function mockRecommendations(label: string) {
  return [
    { title: `${label} Consolidate spend toward top performers`, rationale: "Directional inference", priority_score: 80, timeframe: "30", source_evidence_ids: [] },
    { title: "Stand up unified measurement", rationale: "Directional inference", priority_score: 75, timeframe: "60", source_evidence_ids: [] },
    { title: "Launch creative testing roadmap", rationale: "Directional inference", priority_score: 65, timeframe: "90", source_evidence_ids: [] },
  ];
}

function mockSlides(label: string) {
  const titles = [
    "Cover",
    "Agenda",
    "What We Heard",
    "Business Diagnosis",
    "The Real Growth Lever",
    "Paid Media Audit Findings",
    "Creative Audit Findings",
    "Shopify / Business Health",
    "Measurement Maturity",
    "Win Strategy",
    "30/60/90 Roadmap",
    "Why Us / Close",
  ];
  return titles.map((t, i) => ({
    slide_number: i + 1,
    slide_title: t,
    slide_type: i === 0 ? "cover" : i === titles.length - 1 ? "close" : "content",
    key_message: `${label} Placeholder key message for ${t}.`,
    supporting_points: ["Placeholder supporting point 1", "Placeholder supporting point 2"],
    recommended_visual: "Simple data chart or text block",
    data_needed: "Configure LLM key for grounded data needs",
    source_evidence_ids: [],
    talk_track: "Placeholder talk track.",
    design_notes: "Keep clean, on-brand, minimal text.",
    confidence: "Low",
    risk_or_caveat: "Generated without LLM key — replace before client use.",
  }));
}

function mockTalkTracks(label: string) {
  return Array.from({ length: 12 }, (_, i) => ({
    slide_number: i + 1,
    thirty_sec: `${label} 30-second placeholder talk track for slide ${i + 1}.`,
    sixty_sec: `${label} 60-second placeholder talk track for slide ${i + 1}, with more supporting detail and a transition line to the next slide.`,
  }));
}

function mockQA(label: string) {
  return [
    {
      question: "How will you prove ROI within the first 90 days?",
      category: "Measurement",
      suggested_answer: `${label} We'll align on a shared KPI stack in week one and report against it weekly.`,
      confidence: "Medium",
      source_evidence_ids: [],
    },
  ];
}
