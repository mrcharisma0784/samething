import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { EMOJIS } from "@/lib/constants";
import { cx } from "@/lib/utils";

export default function EditProfile() {
  const { profile, refreshProfile } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [emoji, setEmoji] = useState("✦");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setEmoji(profile.emoji);
    setBio(profile.bio ?? "");
  }, [profile]);

  async function save() {
    if (!profile) return;
    setBusy(true); setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim().toLowerCase(), emoji, bio: bio.trim() || null })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      setError(error.message.includes("duplicate")
        ? "That username is taken. Try another."
        : "Username must be 3–20 characters: lowercase letters, numbers, underscore.");
      return;
    }
    await refreshProfile();
    nav("/me");
  }

  if (!profile) return null;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <h1 className="font-display text-5xl leading-none tracking-tight dot">Edit profile</h1>

      <div className="card mt-8 space-y-7">
        <div className="space-y-3">
          <label className="label" htmlFor="u">Username</label>
          <input id="u" className="field" maxLength={20} value={username}
                 onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="space-y-3">
          <p className="label">Emoji</p>
          <div className="grid grid-cols-7 gap-2">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)} aria-label={`Choose ${e}`} aria-pressed={emoji === e}
                      className={cx("grid aspect-square place-items-center rounded-full border text-lg",
                                    emoji === e ? "border-sand bg-sand/10 text-cream" : "border-line text-muted")}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="label" htmlFor="b">Bio</label>
          <textarea id="b" rows={3} maxLength={160} className="field resize-none"
                    value={bio} onChange={(e) => setBio(e.target.value)} />
          <p className="text-sm text-muted">{bio.length}/160</p>
        </div>

        {error && <p className="text-sm text-rare">{error}</p>}

        <div className="flex items-center gap-4">
          <button onClick={save} disabled={busy || !username} className="btn-primary px-10">Save</button>
          <button onClick={() => nav("/me")} className="text-sm text-cream">Cancel</button>
        </div>
      </div>
    </main>
  );
}
