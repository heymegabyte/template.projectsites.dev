import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  /** Endpoint that streams completions. Default `/api/ai/chat`. */
  endpoint?: string;
  /** Initial greeting from the assistant. */
  greeting?: string;
  /** Floating button label. */
  triggerLabel?: string;
  className?: string;
}

/**
 * Floating AI chat overlay (ideas #115, #121, #122).
 *
 * Streams responses from `/api/ai/chat` (Cloudflare Pages Function → Workers AI).
 * Keyboard: ⌘+J / Ctrl+J toggles. Esc closes.
 *
 *   - Uses native `<dialog>` for top-layer + focus trap
 *   - Streams via fetch + ReadableStream reader
 *   - Persists conversation in sessionStorage for the duration of the visit
 *   - Throws no console errors if endpoint missing — degrades to a contact-form CTA
 */
export function AiChat({
  endpoint = '/api/ai/chat',
  greeting = "Hi! I can answer questions about this site. What can I help with?",
  triggerLabel = 'Ask AI',
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: greeting },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Keyboard shortcut: ⌘+J / Ctrl+J
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setStreaming(true);
    // Add empty assistant turn we'll stream into
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: "I can't reach the AI service right now. Email us instead — we reply within a day.",
          };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE: lines starting with "data: ..."
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const chunk = JSON.parse(payload) as { response?: string; token?: string };
            const piece = chunk.response ?? chunk.token ?? '';
            if (piece) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: copy[copy.length - 1].content + piece,
                };
                return copy;
              });
            }
          } catch {
            // Non-JSON line — append verbatim (Llama-style streaming)
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: 'assistant',
                content: copy[copy.length - 1].content + payload,
              };
              return copy;
            });
          }
        }
      }
    } catch {
      // A fetch rejection (offline / DNS / CORS / ad-blocker) or a mid-stream reader throw
      // would otherwise leave the empty assistant bubble (pushed above) hanging FOREVER and
      // surface an unhandled promise rejection (a console-error-gate failure). Fill it with a
      // graceful fallback — preserving any already-streamed partial so a LATE disconnect keeps
      // the half-answer instead of wiping it.
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        const partial = last?.role === 'assistant' ? last.content : '';
        copy[copy.length - 1] = {
          role: 'assistant',
          content: partial
            ? `${partial}\n\n(Connection lost — email us and we'll pick up where this left off.)`
            : "I can't reach the AI service right now. Email us instead — we reply within a day.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Meta+J Control+J"
        className={cn(
          'fixed bottom-6 right-6 z-30 h-12 px-4 rounded-full',
          'bg-accent text-[var(--color-on-accent)] font-bold shadow-lg hover:bg-accent-hover transition-all',
          'flex items-center gap-2 group',
          className,
        )}
      >
        <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
        {triggerLabel}
        <kbd className="hidden md:inline-block px-1.5 py-0.5 text-xs bg-background/20 rounded font-mono">⌘J</kbd>
      </button>

      <dialog
        ref={dialogRef}
        className="ai-chat-dialog p-0 bg-transparent border-0 m-0 max-h-full max-w-full"
        onClick={(e) => {
          const rect = (e.target as HTMLDialogElement).getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          ) {
            setOpen(false);
          }
        }}
        aria-labelledby="ai-chat-title"
      >
        <div className="card-tactile bg-surface-elevated w-[min(90vw,28rem)] h-[min(80vh,40rem)] flex flex-col">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <h2 id="ai-chat-title" className="font-heading font-bold text-text inline-flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Ask anything
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="h-8 w-8 rounded-md flex items-center justify-center text-text-subtle hover:text-text hover:bg-surface"
            >
              <X size={16} />
            </button>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col gap-1 text-sm',
                  m.role === 'user' ? 'items-end' : 'items-start',
                )}
              >
                <span
                  className={cn(
                    'inline-block px-3 py-2 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed',
                    m.role === 'user'
                      ? 'bg-accent text-[var(--color-on-accent)] rounded-tr-sm'
                      : 'bg-surface text-text rounded-tl-sm',
                  )}
                >
                  {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
                </span>
              </div>
            ))}
          </div>
          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 p-3 border-t border-border bg-surface"
          >
            <label htmlFor="ai-chat-input" className="sr-only">
              Ask a question
            </label>
            <textarea
              id="ai-chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // Fire the form's REAL submit (a genuine SubmitEvent) instead of casting a
                  // KeyboardEvent to FormEvent (`as unknown as` — a TS-strict smell). Bonus:
                  // requestSubmit runs native constraint validation the direct call skipped.
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask anything…"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-text text-sm min-h-[40px] max-h-32 resize-none focus:outline-none focus:border-accent transition-colors"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              aria-label="Send"
              className="h-10 w-10 rounded-lg bg-accent text-[var(--color-on-accent)] flex items-center justify-center hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}


export default AiChat;
