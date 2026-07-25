import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cx } from "@/lib/utils";

type Tone = "info" | "error" | "good";
interface Toast { id: number; text: string; tone: Tone }

const Ctx = createContext<(text: string, tone?: Tone) => void>(() => {});

/**
 * Ustten inen tek satirlik bildirim. Kural: ne olduğunu soyle, suclama.
 * "Pick at least 1 tag." — "You forgot the tags!" degil.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, text, tone }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3600);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              "animate-rise flex w-full max-w-md items-center gap-3 rounded-2xl border bg-ink px-5 py-4 shadow-lg shadow-black/60",
              t.tone === "error" ? "border-line" : t.tone === "good" ? "border-sand/50" : "border-line"
            )}
          >
            <span className={cx(
              "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs",
              t.tone === "error" ? "border-cream text-cream"
                : t.tone === "good" ? "border-sand text-sand" : "border-muted text-muted"
            )}>
              {t.tone === "good" ? "✓" : "!"}
            </span>
            <p className="font-medium text-cream">{t.text}</p>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
