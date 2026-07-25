/** "3 days", "4 weeks" — feed'deki kisa yas etiketi. */
export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"], [3600, "min"], [86400, "hour"], [604800, "day"], [2592000, "week"], [31536000, "month"],
  ];
  if (s < 60) return "just now";
  if (s < 3600) return plural(Math.floor(s / 60), "min");
  if (s < 86400) return plural(Math.floor(s / 3600), "hour");
  if (s < 604800) return plural(Math.floor(s / 86400), "day");
  if (s < 2592000) return plural(Math.floor(s / 604800), "week");
  if (s < 31536000) return plural(Math.floor(s / 2592000), "month");
  return plural(Math.floor(s / 31536000), "year");
  function plural(n: number, u: string) { return `${n} ${u}${n === 1 ? "" : "s"}`; }
}

/** "1 vote", "no votes yet" */
export function voteLabel(total: number): string {
  if (total === 0) return "no votes yet";
  return `${total} vote${total === 1 ? "" : "s"}`;
}

/** Similarity = same / total. Kartta "Similarity: 62% (13/21)" olarak gorunur. */
export function similarityLabel(same: number, total: number): string | null {
  if (total === 0) return null;
  return `Similarity: ${Math.round((same / total) * 100)}% (${same}/${total})`;
}

/** Yuzde bandinin altindaki tek satirlik yorum. */
export function similarityVerdict(same: number, total: number): string {
  if (total === 0) return "No votes yet — wait and see what other people feel.";
  const p = same / total;
  if (p >= 0.9) return "Almost everyone has felt this.";
  if (p >= 0.6) return "Most people are with you.";
  if (p >= 0.3) return "It splits the room.";
  if (p > 0.01) return "Only a few carry this.";
  return "You're the only one. This is a Rare Thing.";
}

/** Metindeki @username'leri parcalara ayirir — MentionText bunu render eder. */
export function splitMentions(text: string): { type: "text" | "mention"; value: string }[] {
  const out: { type: "text" | "mention"; value: string }[] = [];
  const re = /@([a-zA-Z0-9_]{3,20})/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: "text", value: text.slice(last, m.index) });
    out.push({ type: "mention", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

/** Baslik bos birakildiysa govdeden bir tane sec. */
export function titleFromBody(body: string): string {
  const first = body.trim().split(/(?<=[.!?])\s|\n/)[0] ?? body;
  return first.length > 60 ? first.slice(0, 57).trimEnd() + "…" : first;
}

export function cx(...v: (string | false | null | undefined)[]) {
  return v.filter(Boolean).join(" ");
}
