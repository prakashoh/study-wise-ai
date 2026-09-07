import React, { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../lib/api";
import {
  Award,
  Flame,
  LogOut,
  CheckCircle2,
  Lock,
  Edit3,
  Shield,
  BookOpen,
  Layers,
  Sparkles,
  Calendar,
  Download,
  X,
  GraduationCap,
  Briefcase,
  Target,
  Sliders,
  Database,
  BarChart3,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Avatar presets
const AVATAR_OPTIONS = [
  { emoji: "🎓", label: "Scholar" },
  { emoji: "💻", label: "Developer" },
  { emoji: "🚀", label: "Innovator" },
  { emoji: "🦉", label: "Night Owl" },
  { emoji: "🔬", label: "Scientist" },
  { emoji: "🎨", label: "Creative" },
  { emoji: "⚡", label: "Dynamo" },
  { emoji: "🦁", label: "Leader" },
];

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "analytics" | "badges" | "preferences" | "data"
  >("analytics");

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editFieldOfStudy, setEditFieldOfStudy] = useState("");
  const [editStudyGoal, setEditStudyGoal] = useState("30 mins / day");
  const [editPreferredTone, setEditPreferredTone] = useState("balanced");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Badge Filter
  const [badgeFilter, setBadgeFilter] = useState<"all" | "unlocked" | "locked">(
    "all",
  );

  const navigate = useNavigate();

  const fetchProfileData = () => {
    setLoading(true);
    api
      .getProfile()
      .then((data) => {
        setProfile(data);
        setEditName(data.name || "");
        setEditBio(data.bio || "");
        setEditAvatar(data.avatar || "");
        setEditInstitution(data.institution || "");
        setEditFieldOfStudy(data.fieldOfStudy || "");
        setEditStudyGoal(data.studyGoal || "30 mins / day");
        setEditPreferredTone(data.preferredTone || "balanced");
      })
      .catch(() => {
        toast.error("Failed to load profile data.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleLogout = () => {
    api.logout();
    toast.success("Successfully logged out.");
    navigate("/");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile({
        name: editName,
        bio: editBio,
        avatar: editAvatar,
        institution: editInstitution,
        fieldOfStudy: editFieldOfStudy,
        studyGoal: editStudyGoal,
        preferredTone: editPreferredTone,
      });
      setProfile((prev: any) => ({ ...prev, ...updated }));
      setShowEditModal(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error((err as Error).message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error((err as Error).message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      const updated = await api.updateProfile({
        studyGoal: editStudyGoal,
        preferredTone: editPreferredTone,
      });
      setProfile((prev: any) => ({ ...prev, ...updated }));
      toast.success("Study preferences saved!");
    } catch (err) {
      toast.error((err as Error).message || "Failed to save preferences.");
    }
  };

  // Export User Study Data Backup
  const handleExportData = () => {
    const exportPayload = {
      user: {
        name: profile?.name,
        email: profile?.email,
        xp: profile?.xp,
        streak: profile?.streak,
        institution: profile?.institution,
        fieldOfStudy: profile?.fieldOfStudy,
      },
      stats: profile?.stats,
      exportedAt: new Date().toISOString(),
      note: "StudyMate AI Student Data Archive",
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StudyMate_Profile_${profile?.name?.replace(/\s+/g, "_") || "Backup"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Study archive exported successfully!");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">
              Loading profile panel...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentLevel = profile ? Math.floor(profile.xp / 100) + 1 : 1;
  const xpNeeded = profile ? currentLevel * 100 : 100;
  const xpProgress = profile ? profile.xp % 100 : 0;

  // Level Tier Titles
  const getLevelTitle = (lvl: number) => {
    if (lvl >= 10) return "Grandmaster Scholar 👑";
    if (lvl >= 7) return "Master Academic 💎";
    if (lvl >= 5) return "Senior Researcher 🌟";
    if (lvl >= 3) return "Active Scholar 🚀";
    return "Apprentice Learner ⚡";
  };

  // Expanded Gamified Badges
  const allBadges = [
    {
      id: "fast_learner",
      name: "Fast Learner",
      category: "Milestone",
      rarity: "Common",
      description: "Earn 100 XP or more across your study sessions.",
      condition: (profile?.xp || 0) >= 100,
      progress: `${Math.min(profile?.xp || 0, 100)} / 100 XP`,
      icon: "⚡",
    },
    {
      id: "first_upload",
      name: "Knowledge Pioneer",
      category: "Documents",
      rarity: "Common",
      description: "Upload your first study notes PDF or document.",
      condition: (profile?.stats?.totalDocuments || 0) >= 1,
      progress: `${Math.min(profile?.stats?.totalDocuments || 0, 1)} / 1 Upload`,
      icon: "🚀",
    },
    {
      id: "bookworm",
      name: "Study Archivist",
      category: "Documents",
      rarity: "Rare",
      description: "Build your library by uploading 3 or more documents.",
      condition: (profile?.stats?.totalDocuments || 0) >= 3,
      progress: `${Math.min(profile?.stats?.totalDocuments || 0, 3)} / 3 Documents`,
      icon: "📚",
    },
    {
      id: "quiz_master",
      name: "Quiz Champion",
      category: "Quizzes",
      rarity: "Epic",
      description: "Generate and test your knowledge with AI Quizzes.",
      condition: (profile?.stats?.totalQuizzes || 0) >= 1,
      progress: `${Math.min(profile?.stats?.totalQuizzes || 0, 1)} / 1 Quiz`,
      icon: "🎯",
    },
    {
      id: "flashcard_master",
      name: "Recall Virtuoso",
      category: "Flashcards",
      rarity: "Rare",
      description: "Master 5 or more flashcard terms in your study sets.",
      condition: (profile?.stats?.totalCardsMastered || 0) >= 5,
      progress: `${Math.min(profile?.stats?.totalCardsMastered || 0, 5)} / 5 Mastered`,
      icon: "🎴",
    },
    {
      id: "streak_warrior",
      name: "Dedicated Student",
      category: "Consistency",
      rarity: "Rare",
      description: "Maintain an active study streak of 3 days or more.",
      condition: (profile?.streak || 0) >= 3,
      progress: `${Math.min(profile?.streak || 0, 3)} / 3 Days`,
      icon: "🔥",
    },
    {
      id: "century_club",
      name: "Century Scholar",
      category: "Milestone",
      rarity: "Epic",
      description: "Reach 500 XP through active learning and mastery.",
      condition: (profile?.xp || 0) >= 500,
      progress: `${Math.min(profile?.xp || 0, 500)} / 500 XP`,
      icon: "🌟",
    },
    {
      id: "level_5",
      name: "Level 5 Vanguard",
      category: "Milestone",
      rarity: "Legendary",
      description: "Ascend to Workspace Level 5 in StudyMate AI.",
      condition: currentLevel >= 5,
      progress: `Level ${currentLevel} / 5`,
      icon: "👑",
    },
  ];

  const filteredBadges = allBadges.filter((b) => {
    if (badgeFilter === "unlocked") return b.condition;
    if (badgeFilter === "locked") return !b.condition;
    return true;
  });

  const unlockedCount = allBadges.filter((b) => b.condition).length;

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in pb-16">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              My Student Profile
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              Manage your academic identity, monitor learning analytics, and
              customize your AI tutor experience.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-glow hover:opacity-90 transition-all cursor-pointer"
            >
              <Edit3 className="size-3.5" /> Edit Profile
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-secondary font-bold text-xs text-foreground transition-all cursor-pointer"
            >
              <Lock className="size-3.5 text-muted-foreground" /> Security
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LEFT COLUMN: STUDENT IDENTITY & LEVEL PANEL --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Avatar & Personal Details */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="size-24 rounded-full bg-gradient-brand flex items-center justify-center text-white text-4xl font-black shadow-glow ring-4 ring-primary/20">
                    {profile?.avatar ? (
                      <span>{profile.avatar}</span>
                    ) : (
                      <span>{profile?.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="absolute bottom-0 right-0 p-1.5 bg-card border border-border rounded-full shadow-md text-primary hover:scale-110 transition-transform cursor-pointer"
                    title="Change avatar"
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="font-extrabold text-xl text-foreground">
                      {profile?.name}
                    </h3>
                    <span title="Verified Student">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {profile?.email}
                  </p>
                  <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                    {getLevelTitle(currentLevel)}
                  </span>
                </div>

                {/* Bio Quote */}
                {profile?.bio && (
                  <p className="text-xs text-muted-foreground italic bg-secondary/30 border border-border/50 rounded-2xl p-3 max-w-xs leading-relaxed">
                    "{profile.bio}"
                  </p>
                )}

                {/* Academic Metadata Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {profile?.institution && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-foreground bg-secondary/60 px-2.5 py-1 rounded-xl border border-border/80">
                      <GraduationCap className="size-3.5 text-primary" />
                      {profile.institution}
                    </span>
                  )}
                  {profile?.fieldOfStudy && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-foreground bg-secondary/60 px-2.5 py-1 rounded-xl border border-border/80">
                      <Briefcase className="size-3.5 text-primary" />
                      {profile.fieldOfStudy}
                    </span>
                  )}
                </div>

                {/* Streak Badge */}
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm">
                  <Flame className="size-4 fill-amber-500 text-amber-500" />
                  <span>{profile?.streak || 1} Day Active Streak</span>
                </div>
              </div>

              {/* Workspace Level Progression */}
              <div className="border-t border-border/80 pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Workspace Level
                  </span>
                  <span className="text-sm font-extrabold text-primary">
                    Level {currentLevel}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                    <span>{xpProgress} XP</span>
                    <span>{xpNeeded} XP to Next Level</span>
                  </div>
                  <div className="w-full bg-secondary border border-border/40 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-brand h-full rounded-full transition-all duration-500 shadow-glow"
                      style={{
                        width: `${Math.min(
                          (xpProgress / xpNeeded) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold pt-1">
                  <span>Total XP: {profile?.xp || 0}</span>
                  <span className="text-emerald-600 font-bold">
                    +50 XP per Note Upload
                  </span>
                </div>
              </div>

              {/* Study Goal Preview */}
              <div className="border-t border-border/80 pt-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                    <Target className="size-3.5 text-primary" /> Daily Target:
                  </span>
                  <span className="font-extrabold text-foreground">
                    {profile?.studyGoal || "30 mins / day"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                    <Sliders className="size-3.5 text-primary" /> AI Tone:
                  </span>
                  <span className="font-extrabold text-foreground capitalize">
                    {profile?.preferredTone || "Balanced"}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive py-3 text-xs font-bold hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut className="size-4" />
                Log Out of Account
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN: TABBED SUITE --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation Pill Bar */}
            <div className="flex items-center gap-2 p-1.5 bg-secondary/50 border border-border/80 rounded-2xl overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <BarChart3 className="size-4" /> Learning Analytics
              </button>

              <button
                onClick={() => setActiveTab("badges")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "badges"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Award className="size-4" /> Achievements ({unlockedCount}/
                {allBadges.length})
              </button>

              <button
                onClick={() => setActiveTab("preferences")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "preferences"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Sliders className="size-4" /> Study Preferences
              </button>

              <button
                onClick={() => setActiveTab("data")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "data"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Database className="size-4" /> Data & Export
              </button>
            </div>

            {/* --- TAB 1: LEARNING ANALYTICS & STATS --- */}
            {activeTab === "analytics" && (
              <div className="space-y-6 animate-fade-in">
                {/* 4 Stat Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm space-y-2">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <BookOpen className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">
                        {profile?.stats?.totalDocuments || 0}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground">
                        Notes in Library
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm space-y-2">
                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Layers className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">
                        {profile?.stats?.totalCardsMastered || 0}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground">
                        Flashcards Mastered
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm space-y-2">
                    <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Target className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">
                        {profile?.stats?.totalQuizzes || 0}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground">
                        Quizzes Generated
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm space-y-2">
                    <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <Zap className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">
                        {profile?.xp || 0}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground">
                        Total XP Earned
                      </p>
                    </div>
                  </div>
                </div>

                {/* Weekly Study Activity Matrix */}
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2 font-bold text-base text-foreground">
                      <Calendar className="size-4.5 text-primary" />
                      Weekly Study Activity Tracker
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Past 7 Days
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-2 pt-2">
                    {[
                      { day: "Mon", active: true, xp: "+35 XP", time: "40m" },
                      { day: "Tue", active: true, xp: "+50 XP", time: "55m" },
                      { day: "Wed", active: true, xp: "+25 XP", time: "30m" },
                      { day: "Thu", active: true, xp: "+60 XP", time: "60m" },
                      { day: "Fri", active: true, xp: "+45 XP", time: "45m" },
                      { day: "Sat", active: true, xp: "+30 XP", time: "35m" },
                      { day: "Sun", active: true, xp: "+40 XP", time: "45m" },
                    ].map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center p-3 rounded-2xl border border-border bg-secondary/20 hover:border-primary/40 hover:bg-secondary/40 transition-all text-center space-y-1.5"
                      >
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                          {slot.day}
                        </span>
                        <div className="size-3.5 rounded-full bg-emerald-500 shadow-xs" />
                        <span className="text-[10px] font-extrabold text-primary">
                          {slot.xp}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {slot.time}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    🔥 You have an active study consistency rating of{" "}
                    <strong className="text-emerald-600 font-bold">100%</strong>{" "}
                    this week!
                  </p>
                </div>

                {/* Milestone XP Breakdown */}
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" /> XP Earning
                    Breakdown
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-secondary/30 border border-border">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        📄 Upload Study Notes (PDF / TXT)
                      </span>
                      <span className="font-extrabold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        +50 XP
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-secondary/30 border border-border">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        🏅 Complete an AI Generated MCQ Quiz
                      </span>
                      <span className="font-extrabold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        +20 XP
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-secondary/30 border border-border">
                      <span className="font-bold text-foreground flex items-center gap-2">
                        🎴 Master a Flashcard Term (Active Recall)
                      </span>
                      <span className="font-extrabold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        +10 XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: GAMIFIED BADGES & ACHIEVEMENTS --- */}
            {activeTab === "badges" && (
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                      <Award className="size-5 text-amber-500" />
                      Achievements & Badges
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Unlock badges as you study, upload notes, and master active
                      recall.
                    </p>
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border text-xs font-bold">
                    <button
                      onClick={() => setBadgeFilter("all")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        badgeFilter === "all"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All ({allBadges.length})
                    </button>
                    <button
                      onClick={() => setBadgeFilter("unlocked")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        badgeFilter === "unlocked"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Unlocked ({unlockedCount})
                    </button>
                    <button
                      onClick={() => setBadgeFilter("locked")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        badgeFilter === "locked"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Locked ({allBadges.length - unlockedCount})
                    </button>
                  </div>
                </div>

                {/* Badge Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`border rounded-2xl p-5 flex items-start gap-4 transition-all ${
                        badge.condition
                          ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 shadow-sm"
                          : "bg-secondary/10 border-border/50 opacity-60"
                      }`}
                    >
                      <div
                        className={`text-2xl p-3 rounded-2xl border flex items-center justify-center shrink-0 ${
                          badge.condition
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-secondary/40 border-border grayscale"
                        }`}
                      >
                        {badge.icon}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-foreground">
                            {badge.name}
                          </h4>
                          {badge.condition ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 rounded-full px-2.5 py-0.5 border border-amber-500/20">
                              <CheckCircle2 className="size-3 text-amber-500" />
                              Unlocked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-secondary rounded-full px-2.5 py-0.5 border border-border">
                              <Lock className="size-3 text-muted-foreground" />
                              Locked
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {badge.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground pt-1">
                          <span className="bg-secondary px-2 py-0.5 rounded-md border border-border">
                            {badge.rarity}
                          </span>
                          <span className="text-primary font-extrabold">
                            {badge.progress}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TAB 3: ACADEMIC PREFERENCES & AI SETTINGS --- */}
            {activeTab === "preferences" && (
              <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
                <div className="border-b border-border/80 pb-4">
                  <h3 className="font-extrabold text-lg text-foreground">
                    Academic Preferences & AI Configuration
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure how your AI Study Tutor responds and set daily
                    learning targets.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* AI Tutor Explanation Tone */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      AI Tutor Explanation Tone
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: "balanced",
                          title: "⚡ Balanced & Fast",
                          desc: "Concise summaries with key high-yield takeaways.",
                        },
                        {
                          id: "academic",
                          title: "🎓 Academic In-Depth",
                          desc: "Rigorous explanations, code snippets, and citations.",
                        },
                        {
                          id: "eli5",
                          title: "🐣 Explain Like I'm 5",
                          desc: "Simple analogies and beginner-friendly clarity.",
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditPreferredTone(t.id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            editPreferredTone === t.id
                              ? "bg-primary/10 border-primary text-foreground shadow-sm"
                              : "bg-secondary/20 border-border hover:bg-secondary/50 text-muted-foreground"
                          }`}
                        >
                          <p className="font-bold text-xs text-foreground mb-1">
                            {t.title}
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            {t.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Study Target */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Daily Study Target
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        "15 mins / day",
                        "30 mins / day",
                        "45 mins / day",
                        "60 mins / day",
                      ].map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => setEditStudyGoal(goal)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                            editStudyGoal === goal
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-secondary/20 border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={handleSavePreferences}
                      className="px-6 py-2.5 bg-gradient-brand text-primary-foreground font-bold text-xs rounded-xl shadow-glow cursor-pointer hover:opacity-90 transition-all"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 4: DATA MANAGEMENT & BACKUP --- */}
            {activeTab === "data" && (
              <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
                <div className="border-b border-border/80 pb-4">
                  <h3 className="font-extrabold text-lg text-foreground">
                    Data Management & Privacy
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Export your notes and study stats or manage your local
                    storage archive.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-border bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <Download className="size-4 text-primary" />
                        Export Study Archive (.JSON)
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Download a complete backup copy of your profile, study
                        stats, and academic achievements.
                      </p>
                    </div>

                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Download className="size-3.5" /> Download Archive
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl border border-border bg-secondary/20 space-y-2">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Shield className="size-4 text-emerald-500" />
                      Session & Data Privacy
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your uploaded documents, quizzes, and chat messages are
                      stored securely on your local server. AI grounding queries
                      are processed via Google Gemini with strict privacy.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- MODAL: EDIT PROFILE --- */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Edit3 className="size-5 text-primary" /> Edit Student Profile
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Choose Avatar Preset */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Choose Avatar Icon
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av.emoji}
                        type="button"
                        onClick={() => setEditAvatar(av.emoji)}
                        className={`size-11 rounded-2xl text-xl flex items-center justify-center border transition-all cursor-pointer ${
                          editAvatar === av.emoji
                            ? "bg-primary/20 border-primary scale-110 shadow-sm"
                            : "bg-secondary/40 border-border hover:bg-secondary"
                        }`}
                        title={av.label}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Academic Bio & Focus
                  </label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="e.g. Computer Science undergrad preparing for software roles"
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      University / School
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GM University"
                      value={editInstitution}
                      onChange={(e) => setEditInstitution(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AI & Machine Learning"
                      value={editFieldOfStudy}
                      onChange={(e) => setEditFieldOfStudy(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 text-xs font-bold bg-gradient-brand text-primary-foreground rounded-xl shadow-glow cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL: CHANGE PASSWORD --- */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Lock className="size-4 text-primary" /> Change Password
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-glow cursor-pointer disabled:opacity-50"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
