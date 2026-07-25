import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Wordmark from "@/components/Wordmark";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function submit() {
    setBusy(true); setError(null);
    const fn = mode === "in" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await fn({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    nav("/");
  }

  async function google() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-10 text-center">
        <Wordmark size="lg" />
        <p className="mt-4 font-display text-2xl italic text-cream">
          {mode === "in" ? "Welcome back." : "Start sharing."}
        </p>
        <p className="mt-3 text-muted">You're never the only one — sign in to find out.</p>
      </div>

      <div className="card space-y-5">
        <button onClick={google} className="w-full rounded-full border border-line bg-ink py-4 font-semibold text-cream">
          Continue with Google
        </button>

        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-line" />
          <span className="label">or email</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="field"
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"}
                 className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="text-sm text-rare">{error}</p>}

        <button onClick={submit} disabled={busy || !email || !password} className="btn-primary w-full py-4">
          {mode === "in" ? "Sign in" : "Create account"}
        </button>

        <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(null); }}
                className="w-full text-center text-sm text-muted">
          {mode === "in" ? "New here? Create an account." : "Have an account? Sign in."}
        </button>
      </div>
    </main>
  );
}
