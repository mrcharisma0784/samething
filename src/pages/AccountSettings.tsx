import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cx } from "@/lib/utils";

export default function AccountSettings() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!session) nav("/auth"); }, [session, nav]);

  const provider = session?.user.app_metadata?.provider ?? "email";
  const viaOAuth = provider !== "email";

  async function set(key: "allow_mentions" | "open_to_chat", value: boolean) {
    if (!profile) return;
    await supabase.from("profiles").update({ [key]: value }).eq("id", profile.id);
    await refreshProfile();
  }

  async function destroy() {
    setDeleting(true); setError(null);
    const { error } = await supabase.rpc("delete_account");
    if (error) { setDeleting(false); return setError(error.message); }
    await signOut();
    nav("/");
  }

  if (!profile || !session) return null;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <Link to="/settings" className="label">‹ Settings</Link>
      <h1 className="mt-3 font-display text-5xl leading-none tracking-tight dot">Account</h1>
      <p className="mt-3 label">Signed in via {provider}</p>

      <div className="card mt-8 divide-y divide-line py-0">
        <Row
          icon="@" title="Allow @mentions" hint="Let others tag you in comments and notify you."
          on={profile.allow_mentions} onChange={(v) => set("allow_mentions", v)}
        />
        <Row
          icon="💬" title="Messages — open to chat" soon
          hint="Let people who said Same DM you on your things."
          on={profile.open_to_chat} onChange={(v) => set("open_to_chat", v)}
        />
      </div>

      <div className="card mt-6">
        {viaOAuth ? (
          <p className="text-muted">
            You signed in with {provider}. Manage your email and password through your {provider} account.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-muted">{session.user.email}</p>
            <button
              onClick={async () => {
                await supabase.auth.resetPasswordForEmail(session.user.email!, {
                  redirectTo: `${window.location.origin}/auth`,
                });
                toast("Password reset link sent to your email.", "good");
              }}
              className="btn"
            >
              Change password
            </button>
          </div>
        )}
      </div>

      <button onClick={async () => { await signOut(); nav("/"); }}
              className="mt-6 w-full rounded-full border border-line py-4 text-cream">
        Sign out
      </button>

      <section className="mt-8 rounded-[26px] border border-rare/40 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-rare">Danger zone</p>
        <p className="mt-3 text-muted">
          Delete your account and all your things, comments and votes. This is permanent.
        </p>

        {confirm === "" ? (
          <button onClick={() => setConfirm("armed")}
                  className="mt-5 w-full rounded-full border border-rare/50 py-4 text-rare">
            🗑 Delete account
          </button>
        ) : (
          <div className="mt-5 space-y-4">
            <label className="label" htmlFor="c">Type your username to confirm</label>
            <input id="c" className="field" placeholder={profile.username}
                   value={confirm === "armed" ? "" : confirm}
                   onChange={(e) => setConfirm(e.target.value || "armed")} />
            {error && <p className="text-sm text-rare">{error}</p>}
            <div className="flex gap-3">
              <button onClick={destroy} disabled={confirm !== profile.username || deleting}
                      className={cx("flex-1 rounded-full py-4 font-semibold transition-colors",
                                    confirm === profile.username ? "bg-rare text-ink" : "bg-raised text-muted")}>
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
              <button onClick={() => { setConfirm(""); setError(null); }} className="btn">Cancel</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Row({ icon, title, hint, on, onChange, soon }: {
  icon: string; title: string; hint: string;
  on: boolean; onChange: (v: boolean) => void; soon?: boolean;
}) {
  return (
    <div className={cx("flex items-start gap-4 py-5", soon && "opacity-60")}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-ink text-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium text-cream">
          {title}
          {soon && <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] tracking-[0.14em] text-muted">SOON</span>}
        </p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <button
        role="switch" aria-checked={on} aria-label={title} disabled={soon}
        onClick={() => onChange(!on)}
        className={cx("mt-1 h-7 w-12 shrink-0 rounded-full p-1 transition-colors",
                      on ? "bg-sand" : "bg-raised", soon && "cursor-not-allowed")}
      >
        <span className={cx("block h-5 w-5 rounded-full bg-ink transition-transform", on && "translate-x-5")} />
      </button>
    </div>
  );
}
