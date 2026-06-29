import { llmProviderName } from "@/lib/llm";

export default function SettingsPage() {
  const provider = llmProviderName();
  const anthropicSet = Boolean(process.env.ANTHROPIC_API_KEY);
  const openaiSet = Boolean(process.env.OPENAI_API_KEY);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        <h2 className="font-semibold text-slate-900">LLM Provider</h2>
        <p className="text-sm text-slate-600">
          Active provider: <span className="font-medium">{provider}</span>
        </p>
        <p className="text-sm text-slate-600">
          ANTHROPIC_API_KEY set: <span className="font-medium">{anthropicSet ? "yes" : "no"}</span>
        </p>
        <p className="text-sm text-slate-600">
          OPENAI_API_KEY set: <span className="font-medium">{openaiSet ? "yes" : "no"}</span>
        </p>
        <p className="text-xs text-slate-500">
          Set ANTHROPIC_API_KEY or OPENAI_API_KEY as environment variables (e.g. in a local .env
          file) and restart the server to enable real LLM generation. Without a key, the app runs
          in mock mode and clearly labels all generated content as mock output.
        </p>
      </div>
    </div>
  );
}
