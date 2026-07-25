import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";

const REASONS = [
  { key: "harmful", label: "Harmful / violence" },
  { key: "spam", label: "Spam" },
  { key: "hate", label: "Hate speech" },
  { key: "sexual", label: "Sexual content" },
  { key: "self_harm", label: "Self-harm risk" },
  { key: "other", label: "Other" },
] as const;

/** ··· menüsünden açılan sabit listeli rapor. Serbest metin yalnızca "Other" için. */
export default function ReportMenu({
  thingId, commentId, onClose,
}: { thingId?: string; commentId?: string; onClose: () => void }) {
  const toast = useToast();
  const [detail, setDetail] = useState<string | null>(null);

  async function send(reason: string, text?: string) {
    const { error } = await supabase.from("reports").insert({
      thing_id: thingId ?? null,
      comment_id: commentId ?? null,
      reason,
      detail: text ?? null,
    });
    onClose();
    toast(error ? "Couldn't send that report. Try again." : "Reported. We'll look at it.",
          error ? "error" : "good");
  }

  if (detail !== null) {
    return (
      <div className="absolute right-0 top-8 z-20 w-72 space-y-3 rounded-2xl border border-line bg-ink p-4">
        <p className="label">What's wrong?</p>
        <textarea
          rows={3} maxLength={500} autoFocus
          className="field resize-none text-sm"
          value={detail} onChange={(e) => setDetail(e.target.value)}
        />
        <div className="flex justify-end gap-4 text-sm">
          <button onClick={onClose} className="text-muted">Cancel</button>
          <button onClick={() => send("other", detail.trim())}
                  disabled={detail.trim().length < 3} className="text-sand disabled:opacity-40">
            Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-8 z-20 w-56 overflow-hidden rounded-2xl border border-line bg-ink">
      <p className="label px-4 pt-4 pb-2">Report</p>
      {REASONS.map((r) => (
        <button
          key={r.key}
          onClick={() => (r.key === "other" ? setDetail("") : send(r.key))}
          className="w-full px-4 py-3 text-left text-cream active:bg-raised"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
