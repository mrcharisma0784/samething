import { useState } from "react";
import { FAQ } from "@/lib/constants";
import { cx } from "@/lib/utils";

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <h1 className="font-display text-5xl leading-none tracking-tight dot">FAQ</h1>
      <p className="mt-3 text-muted">Answers to the things people ask most.</p>

      <div className="mt-8 space-y-3">
        {FAQ.map((item, i) => (
          <div key={item.q} className="overflow-hidden rounded-[26px] border border-line bg-surface">
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}
                    className="flex w-full items-center gap-3 px-5 py-5 text-left">
              <span className={cx("text-muted transition-transform", open === i && "rotate-90")}>›</span>
              <span className="text-cream">{item.q}</span>
            </button>
            {open === i && (
              <p className="animate-rise px-5 pb-5 pl-11 leading-relaxed text-muted">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
