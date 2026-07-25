import { Link } from "react-router-dom";
import { splitMentions } from "@/lib/utils";

/** @username'leri profile link'ine cevirir; kalanini oldugu gibi birakir. */
export default function MentionText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {splitMentions(text).map((p, i) =>
        p.type === "mention" ? (
          <Link
            key={i}
            to={`/u/${p.value}`}
            className="rounded bg-raised px-1.5 py-0.5 text-sand"
            onClick={(e) => e.stopPropagation()}
          >
            @{p.value}
          </Link>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </span>
  );
}
