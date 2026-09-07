import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  MessageSquare,
  FileText,
  ClipboardList,
  Layers,
  FileEdit,
  Calendar,
  Clock,
  Settings,
  Sparkles,
  Crown,
  ArrowRight,
  LogOut,
  Menu,
  X,
  Flame,
} from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate("/login");
      return;
    }

    api
      .getProfile()
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        if (err.message.includes("Token") || err.message.includes("auth")) {
          api.logout();
          navigate("/login");
        }
      });
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    api.logout();
    toast.success("Successfully logged out.");
    navigate("/");
  };

  const navLinks = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Documents", href: "/library", icon: FileText },
    { label: "Quizzes", href: "/quizzes", icon: ClipboardList },
    { label: "Flashcards", href: "/flashcards", icon: Layers },
    { label: "Notes", href: "/summarizer", icon: FileEdit },
    { label: "Study Plan", href: "/study-plan", icon: Calendar },
    { label: "History", href: "/history", icon: Clock },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 sticky top-0 h-screen p-5 justify-between select-none z-30 shrink-0">
        <div className="space-y-6">
          {/* Logo Header */}
          <Link to="/dashboard" className="flex items-center gap-3 px-1.5 py-1 group">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="size-5.5 fill-indigo-200 text-indigo-600" />
            </span>
            <div>
              <div className="font-bold text-lg text-slate-900 tracking-tight leading-tight">
                StudyBuddy <span className="text-indigo-600">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                Your AI Study Assistant
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1 pt-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-indigo-50/90 text-indigo-600 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`size-4.5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings & Upgrade to Pro */}
        <div className="space-y-4 mt-auto pt-4 border-t border-slate-100">
          {/* Settings Link */}
          <Link
            to="/profile"
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              location.pathname === "/profile"
                ? "bg-indigo-50/90 text-indigo-600 font-semibold shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings className={`size-4.5 ${location.pathname === "/profile" ? "text-indigo-600" : "text-slate-400"}`} />
            Settings
          </Link>

          {/* Upgrade to Pro Gradient Card */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 text-white shadow-md relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="size-4 text-amber-300 fill-amber-300" />
              <span className="text-xs font-bold tracking-wide">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-indigo-100 leading-relaxed font-normal pr-7">
              Unlock unlimited chats, advanced and more AI models,
            </p>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => toast.info("Pro Plan features are already unlocked for this session!")}
                className="size-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
                title="Upgrade"
              >
                <ArrowRight className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAV & SHELL --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex h-16 items-center justify-between px-5 border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Sparkles className="size-4.5 fill-indigo-200" />
            </span>
            <span className="font-bold text-base text-slate-900">
              StudyBuddy <span className="text-indigo-600">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-2.5 py-1 text-xs font-semibold">
              <Flame className="size-3.5 fill-amber-500 text-amber-500" />
              {profile?.streak || 7}
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex flex-col w-64 bg-white h-full p-5 justify-between shadow-2xl z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                      <Sparkles className="size-4.5 fill-indigo-200" />
                    </span>
                    <span className="font-bold text-base text-slate-900">
                      StudyBuddy <span className="text-indigo-600">AI</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-lg border border-slate-200"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.label}
                        to={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? "bg-indigo-50 text-indigo-600 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon className={`size-4.5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                        {link.label}
                      </Link>
                    );
                  })}
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === "/profile"
                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Settings className="size-4.5 text-slate-400" />
                    Settings
                  </Link>
                </nav>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Content Shell */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
