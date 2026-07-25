import { similarityLabel, similarityVerdict } from "@/lib/utils";

/**
 * Uygulamanin imzasi: cevabin kendisi. Yuzde, bant ve tek cumlelik hukum.
 * Sadece kendi thing'lerinde (MyThings) ve detay ekraninda gorunur.
 */
export default function SimilarityBar({ same, total, myVote }: {
  same: number; total: number; myVote?: "same" | "nah";
}) {
  const label = similarityLabel(same, total);
  if (!label) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-3 text-center text-sm text-muted">
        No votes yet — wait and see what other people feel.
      </div>
    );
  }

  const pct = (same / total) * 100;
  const rare = pct <= 1;

  return (
    <div className="space-y-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(pct, 1.5)}%`, backgroundColor: rare ? "#E08A2E" : "#DCC9A6" }}
        />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">{same} Same · {total - same} Nah</span>
        <span className="font-display text-sm italic text-cream/80">
          {Math.round(pct)}% · {similarityVerdict(same, total)}
        </span>
      </div>
      {myVote && (
        <p className="label">Your vote: {myVote === "same" ? "Same" : "Nah"}</p>
      )}
    </div>
  );
}
