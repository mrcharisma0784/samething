import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import Feed from "./pages/Feed";
import Search from "./pages/Search";
import Drop from "./pages/Drop";
import Inbox from "./pages/Inbox";
import Me from "./pages/Me";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import NotificationSettings from "./pages/NotificationSettings";
import AccountSettings from "./pages/AccountSettings";
import { Terms, Privacy } from "./pages/Legal";
import FAQPage from "./pages/FAQPage";
import ThingDetail from "./pages/ThingDetail";
import PublicProfile from "./pages/PublicProfile";
import Auth from "./pages/Auth";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { session, loading } = useAuth();
  const { pathname } = useLocation();
  
  // Eger oturum yoksa ve auth sayfasinda degilsek, auth'a gonder.
  const isAuthPage = pathname === "/auth";

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p className="font-display text-3xl tracking-tight dot text-cream/40">SameThing</p>
      </div>
    );
  }

  // OAuth donusu sirasinda URL'de token varsa beklemeye devam et
  if (window.location.hash.includes("access_token")) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p className="font-display text-3xl tracking-tight dot text-cream/40">Authenticating...</p>
      </div>
    );
  }

  if (!session || isAuthPage) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-dvh">
      <Header />
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/search" element={<Search />} />
        <Route path="/drop" element={<Drop />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/me" element={<Me />} />
        <Route path="/me/edit" element={<EditProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/notifications" element={<NotificationSettings />} />
        <Route path="/settings/account" element={<AccountSettings />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/t/:id" element={<ThingDetail />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="font-display text-4xl italic text-cream">Nothing here.</p>
      <p className="mt-3 text-muted">This page doesn't exist — try the feed.</p>
    </main>
  );
}
