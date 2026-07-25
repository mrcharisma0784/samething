import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { cx } from "@/lib/utils";
import type { Profile } from "@/lib/types";

type Key = keyof Pick<
  Profile,
  "notify_same" | "notify_nah" | "notify_comment" | "notify_reply" |
  "notify_mention" | "notify_only_one" | "notify_marketing"
>;

const GROUPS: { heading: string; rows: { key: Key; title: string; hint: string }[] }[] = [
  {
    heading: "Votes",
    rows: [
      { key: "notify_same", title: "Someone said Same", hint: "When a person relates to one of your things." },
      { key: "notify_nah", title: "Someone said Nah", hint: "When a person doesn't." },
      { key: "notify_only_one", title: "You're the only one", hint: "When one of your things turns out to be a Rare Thing." },
    ],
  },
  {
    heading: "Conversation",
    rows: [
      { key: "notify_comment", title: "New comments", hint: "When someone comments on your thing." },
      { key: "notify_reply", title: "Replies to you", hint: "When someone answers your comment." },
      { key: "notify_mention", title: "Mentions", hint: "When someone tags you with @." },
    ],
  },
  {
    heading: "Email",
    rows: [
      { key: "notify_marketing", title: "News from us", hint: "Occasional emails about what's new. Critical service emails always come through." },
    ],
  },
];

export default function NotificationSettings() {
  const { profile, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [state, setState] = useState<Record<Key, boolean> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!profile) nav("/auth"); }, [profile, nav]);

  useEffect(() => {
    if (!profile) return;
    setState({
      notify_same: profile.notify_same,
      notify_nah: profile.notify_nah,
      notify_comment: profile.notify_comment,
      notify_reply: profile.notify_reply,
      notify_mention: profile.notify_mention,
      notify_only_one: profile.notify_only_one,
      notify_marketing: profile.notify_marketing,
    });
  }, [profile]);

  async function toggle(key: Key) {
    if (!profile || !state) return;
    const next = !state[key];
    setState({ ...state, [key]: next });
    setSaving(true);
    await supabase.from("profiles").update({ [key]: next }).eq("id", profile.id);
    await refreshProfile();
    setSaving(false);
  }

  if (!state) return null;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <Link to="/settings" className="label">‹ Settings</Link>
      <h1 className="mt-3 font-display text-5xl leading-none tracking-tight dot">Notifications</h1>
      <p className="mt-3 text-muted">
        {saving ? "Saving…" : "What you want to hear about. Changes save as you flip them."}
      </p>

      <div className="mt-8 space-y-8">
        {GROUPS.map((g) => (
          <section key={g.heading}>
            <p className="label">{g.heading}</p>
            <div className="card mt-3 divide-y divide-line py-0">
              {g.rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-4 py-5">
                  <div className="min-w-0">
                    <p className="font-medium text-cream">{r.title}</p>
                    <p className="text-sm text-muted">{r.hint}</p>
                  </div>
                  <button
                    role="switch" aria-checked={state[r.key]} aria-label={r.title}
                    onClick={() => toggle(r.key)}
                    className={cx("h-7 w-12 shrink-0 rounded-full p-1 transition-colors",
                                  state[r.key] ? "bg-sand" : "bg-raised")}
                  >
                    <span className={cx("block h-5 w-5 rounded-full bg-ink transition-transform",
                                        state[r.key] && "translate-x-5")} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
