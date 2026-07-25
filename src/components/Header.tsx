import { Link } from "react-router-dom";
import Wordmark from "./Wordmark";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

export default function Header() {
  const { session, profile } = useAuth();
  const { unread } = useNotifications();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
        <Wordmark />

        <div className="flex items-center gap-4">
          <Link to="/inbox" aria-label="Inbox" className="relative p-2 text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sand" />}
          </Link>

          {session ? (
            <Link
              to="/me"
              aria-label="Your profile"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-lg text-cream"
            >
              {profile?.emoji ?? "✦"}
            </Link>
          ) : (
            <Link to="/auth" className="text-sm font-semibold text-cream">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
