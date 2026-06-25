import type { Message } from "@/lib/agent/compressor";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
}

export interface OpenRouterConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OpenRouterChoice {
  message: {
    content: string | null;
    role: string;
  };
  finish_reason: string;
}

interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
  error?: { message: string };
}

export async function callOpenRouter(
  messages: Message[],
  config: OpenRouterConfig = {}
): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key not configured. Set NEXT_PUBLIC_OPENROUTER_API_KEY in your environment."
    );
  }

  const body = {
    model: config.model || "owl-alpha",
    messages,
    temperature: config.temperature ?? 0.3,
    max_tokens: config.maxTokens ?? 256,
  };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
  }

  const data: OpenRouterResponse = await res.json();

  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  const choice = data.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error("OpenRouter returned empty response");
  }

  return choice.message.content;
}
