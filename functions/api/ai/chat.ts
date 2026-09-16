/**
 * POST /api/ai/chat — streaming Workers AI route (idea #115, #121).
 *
 * Streams chat completions back to the client using Workers AI. Defaults to
 * Llama 3.1 8B (fp8) — a REAL, fast, edge-cheap model. (There is NO Llama 3.3 8B:
 * Llama 3.3 ships only in 70B; the 8B is Llama 3.1. The old default
 * `@cf/meta/llama-3.3-8b-instruct-fp8-fast` did not exist, so `env.AI.run` threw and
 * EVERY concierge call 502'd — proven live 2026-09-16.) Override per-request via
 * `body.model` or per-deploy via the `AI_CHAT_MODEL` env var (hot-patch, no rebuild).
 *
 * Bindings required (in `wrangler.jsonc` or Pages dashboard):
 *   AI           — the Workers AI binding (automatic on Cloudflare Pages)
 *   AI_GATEWAY   — optional AI Gateway slug for logging + caching + fallback
 *   AI_CHAT_MODEL — optional model-alias override (defaults to the valid 8B below)
 *
 * Request body: { messages: [{ role: 'user'|'assistant'|'system', content: string }] }
 *
 * Response: text/event-stream with `data: {token}` lines, followed by `data: [DONE]`.
 *
 * Client consumes via `new EventSource('/api/ai/chat')` or `fetch` + reader.
 */

interface Env {
  AI: Ai;
  AI_GATEWAY?: string;
  /** Optional model-alias override (hot-patch a bad default without a rebuild). */
  AI_CHAT_MODEL?: string;
}

interface ChatBody {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** Override the default model. */
  model?: string;
  /** Sampling temperature 0-1. */
  temperature?: number;
}

// Llama 3.1 8B (fp8) — a REAL Workers AI alias (the worker uses it 31×). NOT
// `llama-3.3-8b-*`, which does not exist (Llama 3.3 = 70B only) and 502'd every call.
const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';
const MAX_TOKENS = 2048;

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: ChatBody;
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages[] required' }), { status: 400 });
  }

  // Prepend a system prompt that anchors the brand voice
  const systemPrompt = `You are a helpful AI assistant for a business website. Answer questions accurately based on the page context. Refuse to discuss anything off-topic from the business. Keep replies concise — 1-3 sentences. Use Markdown sparingly. Never invent product features or pricing.`;
  const messages = body.messages[0]?.role === 'system' ? body.messages : [{ role: 'system' as const, content: systemPrompt }, ...body.messages];

  const model = body.model ?? ctx.env.AI_CHAT_MODEL ?? DEFAULT_MODEL;

  const gateway = ctx.env.AI_GATEWAY
    ? { id: ctx.env.AI_GATEWAY, skipCache: false, cacheTtl: 60 * 60 * 24 }
    : undefined;

  try {
    const stream = await ctx.env.AI.run(
      model as Parameters<Ai['run']>[0],
      {
        messages,
        stream: true,
        max_tokens: MAX_TOKENS,
        temperature: body.temperature ?? 0.7,
      },
      gateway ? { gateway } : undefined,
    );

    return new Response(stream as ReadableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[ai:chat-error]', err);
    return new Response(JSON.stringify({ error: 'AI inference failed' }), { status: 502 });
  }
};
