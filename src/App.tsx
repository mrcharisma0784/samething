import { Route, Routes, useLocation, Navigate } from "react-router-dom";
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
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const { session, loading } = useAuth();
  const { pathname } = useLocation();
  
  // Yükleme ekranı
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink">
        <div className="text-center space-y-4">
          <p className="font-display text-3xl tracking-tight dot text-cream animate-pulse">SameThing</p>
          <p className="text-xs text-muted uppercase tracking-widest">Loading session...</p>
        </div>
      </div>
    );
  }

  // Giriş yapmamış kullanıcıyı sadece /auth sayfasına izin ver
  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        {/* Diğer tüm yolları /auth sayfasına yönlendir */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Giriş yapmış kullanıcı /auth sayfasına gitmeye çalışırsa Feed'e gönder
  if (pathname === "/auth") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-dvh bg-ink text-cream">
      <Header />
      <div className="pb-20"> {/* BottomNav için boşluk */}
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
      </div>
      <BottomNav />
      <Analytics />
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
