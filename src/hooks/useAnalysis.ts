import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Verdict {
  ok: boolean;
  blocked_reason: string | null;
  crisis: boolean;
  suggested_tags: string[];
  suggested_new_tag: string | null;
  lang: string;
  simplified: string | null;
}

export type Phase = "idle" | "reading" | "ready" | "failed";

/**
 * Yazarken calisan anlik analiz. Yazma bitince (800ms sessizlik) tetiklenir.
 * Anahtar istemcide degil — is Edge Function'da (supabase/functions/analyze-thing).
 */
export function useAnalysis(text: string) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const seq = useRef(0);

  useEffect(() => {
    const t = text.trim();
    if (t.length < 3) { setVerdict(null); setPhase("idle"); return; }

    setPhase("reading");
    const mine = ++seq.current;

    const id = setTimeout(async () => {
      const { data, error } = await supabase.functions.invoke("analyze-thing", { body: { text: t } });
      if (mine !== seq.current) return;          // daha yeni bir tur var, bunu at

      if (error || (data as any)?.error) { setPhase("failed"); setVerdict(null); return; }
      setVerdict(data as Verdict);
      setPhase("ready");
    }, 800);

    return () => clearTimeout(id);
  }, [text]);

  return { verdict, phase };
}
