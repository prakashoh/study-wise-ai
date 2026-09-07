import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await api.login(email, password);
      toast.success("Successfully logged in!");
      navigate("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      try {
        await api.login("alex@studybuddy.ai", "password123");
      } catch {
        await api.register("Alex", "alex@studybuddy.ai", "password123");
      }
      toast.success("Welcome, Alex!");
      navigate("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Failed demo login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12 relative overflow-hidden bg-background">
      {/* Background Glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[600px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
              <GraduationCap className="size-6 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl font-bold">StudyMate AI</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight mt-2 text-foreground">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Log in to access your notes, quizzes, and AI tutor.
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/70 border border-border/70 backdrop-blur-xl rounded-2xl p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200/80 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100/70 transition-all cursor-pointer"
            >
              <Sparkles className="size-4 fill-indigo-200 text-indigo-600" />
              Instant Demo Sign-In (Alex)
            </button>
          </form>

          <div className="border-t border-border mt-6 pt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Create account free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
