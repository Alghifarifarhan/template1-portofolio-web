"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, updatePassword, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, Timestamp, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAdmin, SiteContent, ServiceItem, ExperienceItem, PortfolioItem, BlogItem, SiteColors, defaultContent } from "@/context/AdminContext";
import { formatGoogleDriveUrl, isValidUrlString, sortBlogsByDate } from "@/lib/utils";
import {
  LogOut,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Layout,
  Palette,
  UserCheck,
  FolderKanban,
  FileText,
  CheckCircle,
  ExternalLink,
  FileCode,
  Lock,
  KeyRound,
  BarChart3,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  HardDrive,
  Upload,
  Download,
  Database,
  Star,
  MessageSquare,
  Search,
  AlertTriangle,
  Check,
  ArrowUpDown,
  Award
} from "lucide-react";
import Link from "next/link";

interface ColorPreset {
  id: string;
  name: string;
  subtitle: string;
  colors: SiteColors;
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "preset-1",
    name: "Sunset Orange",
    subtitle: "Orange & Dark Slate",
    colors: {
      primary: "#FD853A",
      dark: "#171717",
      light: "#F2F4F7",
      textDark: "#344054",
      textMid: "#1D2939",
      textLight: "#98A2B3",
    },
  },
  {
    id: "preset-2",
    name: "Ocean Blue",
    subtitle: "Blue & Navy Night",
    colors: {
      primary: "#3B82F6",
      dark: "#0F172A",
      light: "#F8FAFC",
      textDark: "#1E293B",
      textMid: "#0F172A",
      textLight: "#64748B",
    },
  },
  {
    id: "preset-3",
    name: "Royal Purple",
    subtitle: "Violet & Deep Indigo",
    colors: {
      primary: "#8B5CF6",
      dark: "#180A2E",
      light: "#F3E8FF",
      textDark: "#3B0764",
      textMid: "#2E1065",
      textLight: "#A855F7",
    },
  },
  {
    id: "preset-4",
    name: "Emerald Green",
    subtitle: "Emerald & Forest Green",
    colors: {
      primary: "#10B981",
      dark: "#064E3B",
      light: "#ECFDF5",
      textDark: "#065F46",
      textMid: "#047857",
      textLight: "#6EE7B7",
    },
  },
  {
    id: "preset-5",
    name: "Golden Amber",
    subtitle: "Gold & Dark Obsidian",
    colors: {
      primary: "#EAB308",
      dark: "#0A0A0A",
      light: "#FEFCE8",
      textDark: "#171717",
      textMid: "#262626",
      textLight: "#A1A1AA",
    },
  },
];

export interface AdminComment {
  id: string;
  blogId: string;
  blogTitle?: string;
  name: string;
  email?: string;
  content: string;
  createdAt: string | number | Timestamp | null;
}

type TabType = "stats" | "header-footer" | "colors" | "hero-hire" | "services" | "experience" | "portfolio" | "blogs" | "comments" | "password";

export default function AdminDashboard() {
  const router = useRouter();
  const { content, stats, updateContent, updateContentLive, syncStatus, cleanAllSampleData, fetchStats, loading: contextLoading } = useAdmin();

  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [formContent, setFormContent] = useState<SiteContent | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("stats");

  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [isCleaningSample, setIsCleaningSample] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Database Backup & Restore state
  const [isExportingDb, setIsExportingDb] = useState(false);
  const [isImportingDb, setIsImportingDb] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

  // Comments state
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentSearch, setCommentSearch] = useState("");
  const [selectedBlogFilter, setSelectedBlogFilter] = useState("all");
  const [commentToDelete, setCommentToDelete] = useState<AdminComment | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [commentActionMsg, setCommentActionMsg] = useState("");

  // Auth protection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/admin/login");
      } else {
        setUser(currentUser);
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Sync initial state from context on load
  useEffect(() => {
    if (content && !formContent) {
      setFormContent(JSON.parse(JSON.stringify(content)));
    }
  }, [content, formContent]);

  // Realtime comments listener
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "blogComments"),
        (snapshot) => {
          const fetched: AdminComment[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetched.push({
              id: docSnap.id,
              blogId: data.blogId || "",
              blogTitle: data.blogTitle || "",
              name: data.name || "Anonim",
              email: data.email || "",
              content: data.content || "",
              createdAt: data.createdAt,
            });
          });

          // Sort in-memory descending by date
          fetched.sort((a, b) => {
            const getTime = (val: unknown) => {
              if (!val) return 0;
              if (typeof val === "number") return val;
              if (typeof val === "object" && val !== null && "toMillis" in val && typeof (val as Timestamp).toMillis === "function") {
                return (val as Timestamp).toMillis();
              }
              if (typeof val === "object" && val !== null && "seconds" in val) {
                return (val as { seconds: number }).seconds * 1000;
              }
              const parsed = new Date(String(val)).getTime();
              return isNaN(parsed) ? 0 : parsed;
            };
            return getTime(b.createdAt) - getTime(a.createdAt);
          });

          setComments(fetched);
          setLoadingComments(false);
        },
        (err) => {
          console.warn("Error fetching comments:", err);
          setLoadingComments(false);
        }
      );
      return () => unsubscribe();
    } catch {
      setLoadingComments(false);
    }
  }, []);

  // Dynamic Theme Colors (Requirement 1: color edits in theme affect admin & login page)
  const primaryColor = formContent?.colors?.primary || content?.colors?.primary || "#FD853A";
  const darkBg = formContent?.colors?.dark || content?.colors?.dark || "#141414";
  const textLight = formContent?.colors?.textLight || content?.colors?.textLight || "#98A2B3";
  const logoText = formContent?.navbar?.logoText || formContent?.hero?.name || content?.navbar?.logoText || "JC";
  const logoInitials = logoText ? logoText.substring(0, 2).toUpperCase() : "JC";

  if (authChecking || contextLoading || !formContent) {
    return <div className="min-h-screen bg-white w-full" />;
  }

  const compressImage = (file: File, maxWidth = 1000, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const imageObj = new window.Image();
        imageObj.onload = () => {
          const canvas = document.createElement("canvas");
          let width = imageObj.width;
          let height = imageObj.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(imageObj, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        imageObj.src = src;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (base64Str: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 10MB.");
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      onSuccess(compressedBase64);
    } catch {
      alert("Gagal memproses gambar.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus({ type: "", message: "" });
    try {
      await updateContent(formContent);
      setSaveStatus({ type: "success", message: "Seluruh perubahan berhasil disimpan ke Cloud Firestore!" });
      setTimeout(() => setSaveStatus({ type: "", message: "" }), 4000);
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: "error", message: "Gagal menyimpan perubahan. Silakan coba lagi." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshStats = async () => {
    setIsRefreshingStats(true);
    await fetchStats();
    setTimeout(() => setIsRefreshingStats(false), 500);
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsDeletingComment(true);
    try {
      await deleteDoc(doc(db, "blogComments", commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentActionMsg("Komentar berhasil dihapus!");
      setCommentToDelete(null);
      setTimeout(() => setCommentActionMsg(""), 3000);
    } catch (err) {
      console.error("Error deleting comment:", err);
      setCommentActionMsg("Gagal menghapus komentar dari database.");
      setTimeout(() => setCommentActionMsg(""), 3000);
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: "", message: "" });

    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "Password minimal 6 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Konfirmasi password tidak cocok." });
      return;
    }

    if (!user) return;
    setIsChangingPassword(true);

    try {
      await updatePassword(user, newPassword);
      setPasswordStatus({ type: "success", message: "Password admin berhasil diubah!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("requires-recent-login")) {
        setPasswordStatus({
          type: "error",
          message: "Sesi login sudah terlalu lama. Silakan Keluar dan Login kembali terlebih dahulu untuk mengubah password."
        });
      } else {
        setPasswordStatus({ type: "error", message: "Gagal mengubah password. Silakan coba lagi." });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCleanAllSampleData = async () => {
    setIsCleaningSample(true);
    try {
      await cleanAllSampleData();
      setFormContent({
        isSampleCleaned: true,
        colors: formContent?.colors || defaultContent.colors,
        navbar: {
          logoText: "",
          menuItems: [],
          menuTargets: [],
        },
        hero: {
          greeting: "",
          name: "",
          title: "",
          quote: "",
          yearsExperience: "",
          heroImage: "",
          resumeUrl: "",
          ratingStars: 0,
        },
        sectionTitles: {
          services: "",
          experience: "",
          portfolio: "",
          blogs: "",
        },
        servicesTitle: "",
        experiencesTitle: "",
        portfolioTitle: "",
        blogsTitle: "",
        services: [],
        experiences: [],
        portfolio: [],
        blogs: [],
        hireMe: {
          title: "",
          description: "",
          stat1Value: "",
          stat1Label: "",
          stat2Value: "",
          stat2Label: "",
          heroImage: "",
        },
        contact: {
          title: "",
          subtitle: "",
          email: "",
        },
        footer: {
          logoText: "",
          tagline: "",
          description: "",
          address: "",
          email: "",
          website: "",
          copyright: "",
          socialLinks: {
            facebook: "",
            youtube: "",
            whatsapp: "",
            instagram: "",
            twitter: "",
            github: "",
            pinterest: "",
            linkedin: "",
          },
        },
      });
      setSaveStatus({
        type: "success",
        message: "Semua data contoh awal web hosting berhasil dibersihkan! Seluruh teks bawaan (termasuk menu navbar) dan data contoh telah dikosongkan. Aset Frame 68.svg, Frame 77.svg, serta teks copyright ber-hyperlink tetap dipertahankan.",
      });
      setShowCleanModal(false);
      setTimeout(() => setSaveStatus({ type: "", message: "" }), 6000);
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: "error", message: "Gagal membersihkan data contoh. Silakan coba lagi." });
    } finally {
      setIsCleaningSample(false);
    }
  };

  const handleAddMenuItem = () => {
    const currentItems = formContent?.navbar?.menuItems || [];
    const currentTargets = formContent?.navbar?.menuTargets || [];
    updateNestedField(["navbar", "menuItems"], ["Menu Baru", ...currentItems], true);
    updateNestedField(["navbar", "menuTargets"], ["#hero", ...currentTargets], true);
  };

  const handleRemoveMenuItem = (idx: number) => {
    const currentItems = formContent?.navbar?.menuItems || [];
    const currentTargets = formContent?.navbar?.menuTargets || [];
    updateNestedField(["navbar", "menuItems"], currentItems.filter((_, i) => i !== idx), true);
    updateNestedField(["navbar", "menuTargets"], currentTargets.filter((_, i) => i !== idx), true);
  };

  const handleDownloadDatabase = async () => {
    setIsExportingDb(true);
    setDbSyncStatus({ type: "", message: "" });
    try {
      // 1. Fetch siteContent/main
      const contentRef = doc(db, "siteContent", "main");
      const contentSnap = await getDoc(contentRef);
      const currentSiteContent = contentSnap.exists()
        ? contentSnap.data()
        : formContent || content || defaultContent;

      // 2. Fetch analytics/stats
      const statsRef = doc(db, "analytics", "stats");
      const statsSnap = await getDoc(statsRef);
      const currentStats = statsSnap.exists()
        ? statsSnap.data()
        : stats || { viewsCount: 0, totalUploadBytes: 0, totalDownloadBytes: 0 };

      // 3. Fetch blogComments collection
      const commentsRef = collection(db, "blogComments");
      const commentsSnap = await getDocs(commentsRef);
      const commentsList: Record<string, unknown>[] = [];
      commentsSnap.forEach((docSnap) => {
        commentsList.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });

      // 4. Construct JSON payload
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        siteContent: currentSiteContent,
        analytics: currentStats,
        blogComments: commentsList,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "database.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const sizeFormatted = formatBytes(new Blob([jsonString]).size);
      setDbSyncStatus({
        type: "success",
        message: `Database Firestore berhasil di-download (${sizeFormatted}, ${commentsList.length} komentar)!`,
      });
      setTimeout(() => setDbSyncStatus({ type: "", message: "" }), 6000);
    } catch (err) {
      console.error("Export database error:", err);
      setDbSyncStatus({
        type: "error",
        message: "Gagal mendownload database: " + (err instanceof Error ? err.message : "Terjadi kesalahan"),
      });
    } finally {
      setIsExportingDb(false);
    }
  };

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingDb(true);
    setDbSyncStatus({ type: "", message: "" });

    try {
      const text = await file.text();
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error("Format file harus berupa file JSON yang valid.");
      }

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Struktur file database.json tidak sesuai.");
      }

      // Detect and extract siteContent
      let siteContentToRestore: SiteContent | null = null;
      if (parsed.siteContent && typeof parsed.siteContent === "object") {
        const scObj = parsed.siteContent as Record<string, unknown>;
        if (scObj.main && typeof scObj.main === "object") {
          siteContentToRestore = scObj.main as unknown as SiteContent;
        } else {
          siteContentToRestore = scObj as unknown as SiteContent;
        }
      } else if (parsed.hero || parsed.navbar || parsed.colors || parsed.services) {
        siteContentToRestore = parsed as unknown as SiteContent;
      }

      let restoredContentCount = 0;
      if (siteContentToRestore) {
        const mergedContent: SiteContent = {
          ...defaultContent,
          ...siteContentToRestore,
          isSampleCleaned: true,
        };
        await setDoc(doc(db, "siteContent", "main"), mergedContent);
        await updateContent(mergedContent);
        setFormContent(mergedContent);
        restoredContentCount = 1;
      }

      // Detect and extract analytics
      if (parsed.analytics && typeof parsed.analytics === "object") {
        const analyticsObj = parsed.analytics as Record<string, unknown>;
        const analyticsData = (analyticsObj.stats && typeof analyticsObj.stats === "object"
          ? analyticsObj.stats
          : analyticsObj) as Record<string, unknown>;
        
        await setDoc(
          doc(db, "analytics", "stats"),
          {
            viewsCount: typeof analyticsData.viewsCount === "number" ? analyticsData.viewsCount : 0,
            totalUploadBytes: typeof analyticsData.totalUploadBytes === "number" ? analyticsData.totalUploadBytes : 0,
            totalDownloadBytes: typeof analyticsData.totalDownloadBytes === "number" ? analyticsData.totalDownloadBytes : 0,
          },
          { merge: true }
        );
        await fetchStats();
      }

      // Detect and extract blogComments
      let commentsRestored = 0;
      if (Array.isArray(parsed.blogComments) && parsed.blogComments.length > 0) {
        const batch = writeBatch(db);
        for (const item of parsed.blogComments) {
          if (item && typeof item === "object") {
            const itemObj = item as Record<string, unknown>;
            const commentId = itemObj.id ? String(itemObj.id) : doc(collection(db, "blogComments")).id;
            const commentData = { ...itemObj };
            delete commentData.id;
            const ref = doc(db, "blogComments", commentId);
            batch.set(ref, commentData, { merge: true });
            commentsRestored++;
          }
        }
        await batch.commit();
      }

      setDbSyncStatus({
        type: "success",
        message: `Database berhasil diimpor! Konten website ${restoredContentCount > 0 ? "berhasil diperbarui" : ""}${commentsRestored > 0 ? `, ${commentsRestored} komentar dipulihkan` : ""}.`,
      });
      setSaveStatus({
        type: "success",
        message: "Database Firestore berhasil diimpor dan disinkronkan ke seluruh sistem!",
      });
      setTimeout(() => setDbSyncStatus({ type: "", message: "" }), 6000);
      setTimeout(() => setSaveStatus({ type: "", message: "" }), 6000);
    } catch (err) {
      console.error("Import database error:", err);
      setDbSyncStatus({
        type: "error",
        message: "Gagal mengimpor database: " + (err instanceof Error ? err.message : "Terjadi kesalahan saat memproses JSON"),
      });
    } finally {
      setIsImportingDb(false);
      e.target.value = "";
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper state updaters with real-time sync
  const updateNestedField = (path: string[], value: unknown, isImmediate = false) => {
    setFormContent((prev) => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      let current = copy;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      updateContentLive(copy, isImmediate);
      return copy;
    });
  };

  return (
    <div className="min-h-screen text-white flex flex-col font-sans pb-24 transition-colors" style={{ backgroundColor: darkBg }}>
      {/* Top Navigation Header (Mobile Responsive) */}
      <header className="sticky top-0 z-50 bg-[#1f1f1f]/95 backdrop-blur-md border-b border-[#333] px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm sm:text-base transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              {logoInitials}
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-none">Admin Dashboard</h1>
              <p className="text-[11px] sm:text-xs mt-0.5 truncate max-w-[180px] sm:max-w-none" style={{ color: textLight }}>
                {user?.email}
              </p>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#D0D5DD] bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg"
          >
            <ExternalLink size={13} />
            <span>Web</span>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-2.5 flex-wrap">
          {/* Real-time sync status indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#262626] border border-[#3a3a3a] rounded-xl text-xs shadow-inner">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                syncStatus === "saving"
                  ? "bg-amber-400 animate-ping"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="text-[#D0D5DD] font-medium text-[11px]">
              {syncStatus === "saving" ? "Menyimpan perubahan..." : "Real-Time Sync Aktif"}
            </span>
          </div>

          <button
            onClick={() => setShowCleanModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors cursor-pointer"
            title="Bersihkan semua data contoh awal hosting"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Bersihkan Data Contoh</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#D0D5DD] bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg transition-colors"
          >
            <ExternalLink size={14} />
            <span>Lihat Website</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{isSaving ? "Menyimpan..." : "Simpan"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Alert Banner */}
      {saveStatus.message && (
        <div
          className={`sticky top-[100px] sm:top-[73px] z-40 px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium flex items-center justify-between border-b ${saveStatus.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800"
              : "bg-red-950/90 text-red-300 border-red-800"
            }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span>{saveStatus.message}</span>
          </div>
          <button onClick={() => setSaveStatus({ type: "", message: "" })} className="text-xs underline opacity-80 cursor-pointer">Tutup</button>
        </div>
      )}

      {/* Main Body */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6 flex flex-col lg:flex-row gap-4 sm:gap-8 items-start">
        {/* Sticky Desktop Tab Sidebar / Mobile Scrollable Bar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1.5 sm:gap-2 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-none bg-[#1a1a1a] lg:bg-transparent p-1.5 lg:p-0 rounded-xl lg:rounded-none border border-[#2d2d2d] lg:border-none lg:sticky lg:top-[90px] lg:self-start lg:max-h-[calc(100vh-110px)]">
          {[
            { id: "stats", label: "Statistik Website", icon: BarChart3 },
            { id: "colors", label: "Tema Warna", icon: Palette },
            { id: "header-footer", label: "Header & Footer", icon: Layout },
            { id: "hero-hire", label: "Hero & Link Portfolio", icon: UserCheck },
            { id: "services", label: "Certificate", icon: Award },
            { id: "experience", label: "Pengalaman Kerja", icon: Sparkles },
            { id: "portfolio", label: "Portofolio", icon: FolderKanban },
            { id: "blogs", label: "Blog Post", icon: FileText },
            { id: "comments", label: "Komentar Blog", icon: MessageSquare, badge: comments.length },
            { id: "password", label: "Ubah Password", icon: KeyRound },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer ${isActive
                    ? "text-white font-semibold shadow-md"
                    : "bg-[#1f1f1f] text-[#98A2B3] hover:bg-[#2a2a2a] hover:text-white border border-[#2d2d2d]"
                  }`}
                style={isActive ? { backgroundColor: primaryColor } : {}}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-white text-black" : "bg-orange-500/20 text-orange-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Form Content Area */}
        <main className="flex-1 bg-[#1f1f1f] border border-[#333] rounded-2xl p-4 sm:p-8 shadow-xl">
          {/* TAB 0: STATISTIK WEBSITE */}
          {activeTab === "stats" && (
            <div className="flex flex-col gap-6 sm:gap-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 size={20} style={{ color: primaryColor }} />
                    Statistik &amp; Trafik Website
                  </h2>
                  <p className="text-xs text-[#98A2B3] mt-1">Pantau total kunjungan pengunjung serta estimasi data upload &amp; download</p>
                </div>

                <button
                  onClick={handleRefreshStats}
                  disabled={isRefreshingStats}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-xs font-semibold text-white rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={isRefreshingStats ? "animate-spin" : ""} />
                  <span>Refresh Data</span>
                </button>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Metric Card 1: Page Views */}
                <div className="flex flex-col gap-3 p-5 bg-[#262626] rounded-2xl border border-[#3a3a3a] shadow-lg relative overflow-hidden group">
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-colors pointer-events-none"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">Total Kunjungan</span>
                    <div
                      className="p-2.5 rounded-xl transition-colors"
                      style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                    >
                      <Eye size={20} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {stats.viewsCount.toLocaleString()}
                    </span>
                    <span className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                      <ArrowUpRight size={14} /> Live pengunjung utama
                    </span>
                  </div>
                </div>

                {/* Metric Card 2: Total Upload Data */}
                <div className="flex flex-col gap-3 p-5 bg-[#262626] rounded-2xl border border-[#3a3a3a] shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">Total Upload Data</span>
                    <div className="p-2.5 bg-blue-500/15 text-blue-400 rounded-xl">
                      <HardDrive size={20} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {formatBytes(stats.totalUploadBytes)}
                    </span>
                    <span className="text-xs text-blue-400 mt-1 flex items-center gap-1 font-medium">
                      <ArrowUpRight size={14} /> Total data tersimpan dari Admin
                    </span>
                  </div>
                </div>

                {/* Metric Card 3: Total Download Data */}
                <div className="flex flex-col gap-3 p-5 bg-[#262626] rounded-2xl border border-[#3a3a3a] shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">Total Download Data</span>
                    <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-xl">
                      <ArrowDownRight size={20} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {formatBytes(stats.totalDownloadBytes)}
                    </span>
                    <span className="text-xs text-purple-400 mt-1 flex items-center gap-1 font-medium">
                      <ArrowDownRight size={14} /> Estimasi total data dikirim ke pengunjung
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d] flex flex-col gap-2">
                <h3 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: primaryColor }}>
                  <BarChart3 size={15} /> Keterangan Statistik
                </h3>
                <ul className="text-xs text-[#98A2B3] space-y-1 list-disc pl-4 leading-relaxed">
                  <li><strong>Total Kunjungan:</strong> Menghitung setiap kali halaman depan (*homepage*) dimuat oleh pengunjung secara real-time.</li>
                  <li><strong>Total Upload Data:</strong> Akumulasi data konten &amp; pengaturan yang disimpan dari Admin ke Cloud Database.</li>
                  <li><strong>Total Download Data:</strong> Estimasi total lalu lintas data yang di-download oleh seluruh pengunjung saat membuka web.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 1: COLORS */}
          {activeTab === "colors" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Palette size={20} style={{ color: primaryColor }} />
                  Pengaturan Warna Website
                </h2>
                <p className="text-xs text-[#98A2B3] mt-1">
                  Pilih preset palet warna siap pakai atau sesuaikan warna secara kustom di seluruh halaman web (termasuk Halaman Admin &amp; Login)
                </p>
              </div>

              {/* Color Presets Section */}
              <div className="flex flex-col gap-3 p-4 sm:p-5 bg-[#202020] rounded-2xl border border-[#333]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} style={{ color: primaryColor }} />
                    <span className="text-sm font-bold text-white">Preset Palet Warna (Pilih 1-Klik)</span>
                  </div>
                  <span className="text-xs text-[#98A2B3]">5 Pilihan Desain</span>
                </div>
                <p className="text-xs text-[#98A2B3]">
                  Klik salah satu preset di bawah untuk langsung menerapkan kombinasi warna yang harmonis:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-1">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected =
                      formContent.colors.primary.toUpperCase() === preset.colors.primary.toUpperCase() &&
                      formContent.colors.dark.toUpperCase() === preset.colors.dark.toUpperCase() &&
                      formContent.colors.light.toUpperCase() === preset.colors.light.toUpperCase();

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          updateNestedField(["colors"], { ...preset.colors }, true);
                        }}
                        style={{
                          borderColor: isSelected ? preset.colors.primary : "#3a3a3a",
                          backgroundColor: isSelected ? `${preset.colors.primary}15` : "#262626",
                        }}
                        className={`group flex flex-col gap-2.5 p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-white/40 active:scale-[0.98] ${
                          isSelected ? "shadow-lg ring-1 ring-white/20" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-white">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <CheckCircle size={14} style={{ color: preset.colors.primary }} />
                          )}
                        </div>

                        {/* Color Swatches Grid */}
                        <div className="grid grid-cols-6 gap-1 w-full p-1 bg-[#1a1a1a] rounded-lg border border-[#333]">
                          <div
                            title={`Primary: ${preset.colors.primary}`}
                            style={{ backgroundColor: preset.colors.primary }}
                            className="h-6 rounded-md shadow-sm"
                          />
                          <div
                            title={`Dark: ${preset.colors.dark}`}
                            style={{ backgroundColor: preset.colors.dark }}
                            className="h-6 rounded-md shadow-sm border border-white/10"
                          />
                          <div
                            title={`Light: ${preset.colors.light}`}
                            style={{ backgroundColor: preset.colors.light }}
                            className="h-6 rounded-md shadow-sm border border-black/10"
                          />
                          <div
                            title={`TextDark: ${preset.colors.textDark}`}
                            style={{ backgroundColor: preset.colors.textDark }}
                            className="h-6 rounded-md shadow-sm border border-white/10"
                          />
                          <div
                            title={`TextMid: ${preset.colors.textMid}`}
                            style={{ backgroundColor: preset.colors.textMid }}
                            className="h-6 rounded-md shadow-sm border border-white/10"
                          />
                          <div
                            title={`TextLight: ${preset.colors.textLight}`}
                            style={{ backgroundColor: preset.colors.textLight }}
                            className="h-6 rounded-md shadow-sm border border-white/10"
                          />
                        </div>

                        <span className="text-[11px] text-[#98A2B3] truncate">
                          {preset.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Fine-Tuning Inputs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">Kustomisasi Detail Warna</span>
                  <span className="text-xs text-[#98A2B3]">Atur nilai HEX &amp; Color Picker secara manual</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { key: "primary", label: "Warna Utama / Aksen (Buttons & Highlights)", placeholder: "Contoh: #FD853A" },
                    { key: "dark", label: "Warna Latar Gelap (Section Background)", placeholder: "Contoh: #171717" },
                    { key: "light", label: "Warna Latar Terang", placeholder: "Contoh: #F2F4F7" },
                    { key: "textDark", label: "Teks Gelap", placeholder: "Contoh: #344054" },
                    { key: "textMid", label: "Teks Sedang", placeholder: "Contoh: #1D2939" },
                    { key: "textLight", label: "Teks Terang / Muted", placeholder: "Contoh: #98A2B3" },
                  ].map((colorItem) => (
                    <div key={colorItem.key} className="flex flex-col gap-2 p-3.5 sm:p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                      <label className="text-xs font-semibold text-[#D0D5DD]">{colorItem.label}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formContent.colors[colorItem.key as keyof SiteColors] || "#000000"}
                          onChange={(e) => updateNestedField(["colors", colorItem.key], e.target.value, true)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                        />
                        <input
                          type="text"
                          value={formContent.colors[colorItem.key as keyof SiteColors] || ""}
                          onChange={(e) => updateNestedField(["colors", colorItem.key], e.target.value, true)}
                          placeholder={colorItem.placeholder}
                          className="flex-1 bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white font-mono uppercase outline-none min-w-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEADER & FOOTER */}
          {activeTab === "header-footer" && (
            <div className="flex flex-col gap-6 sm:gap-8">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Layout size={20} style={{ color: primaryColor }} />
                  Pengaturan Header (Navbar)
                </h2>
                <p className="text-xs text-[#98A2B3] mt-1">Kelola logo nama brand dan menu navigasi utama</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 max-w-md">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Logo / Nama Brand Header</label>
                  <input
                    type="text"
                    value={formContent.navbar.logoText || ""}
                    onChange={(e) => updateNestedField(["navbar", "logoText"], e.target.value)}
                    placeholder="Contoh: Mahesh Pokale / MP"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#FD853A]"
                  />
                  <p className="text-[11px] text-[#98A2B3]">Kosongkan jika tidak ingin menampilkan teks logo di Navbar.</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div>
                    <label className="text-xs font-semibold text-[#D0D5DD]">Menu Items (Navigasi Header & Footer)</label>
                    <p className="text-[11px] text-[#98A2B3] mt-0.5">Ubah label teks tombol menu dan tentukan section tujuan saat menu diklik</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMenuItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all shadow-sm cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus size={14} />
                    <span>Tambah Menu</span>
                  </button>
                </div>

                {(!formContent.navbar.menuItems || formContent.navbar.menuItems.length === 0) ? (
                  <div className="p-6 bg-[#262626] rounded-xl border border-[#3a3a3a] text-center flex flex-col items-center gap-2">
                    <p className="text-xs text-[#98A2B3]">
                      Belum ada menu navigasi. Navbar akan bersih tanpa tombol menu.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddMenuItem}
                      className="text-xs font-medium underline cursor-pointer"
                      style={{ color: primaryColor }}
                    >
                      + Tambah Menu Navigasi Pertama
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formContent.navbar.menuItems.map((item, idx) => {
                      const defaultTarget = idx === 0 ? "#hero" : idx === 1 ? "#services" : idx === 2 ? "#portfolio" : "#contact";
                      const currentTarget = formContent.navbar.menuTargets?.[idx] || defaultTarget;
                      return (
                        <div key={idx} className="p-3.5 bg-[#262626] rounded-xl border border-[#3a3a3a] flex flex-col gap-2.5 relative group">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Menu #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMenuItem(idx)}
                              className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Hapus menu ini"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-[#D0D5DD]">Label Teks Menu</label>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newMenu = [...formContent.navbar.menuItems];
                                newMenu[idx] = e.target.value;
                                updateNestedField(["navbar", "menuItems"], newMenu);
                              }}
                              className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FD853A]"
                              placeholder={`Contoh: ${idx === 0 ? "Home" : idx === 1 ? "Certificate" : idx === 2 ? "Project" : "Contact"}`}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-[#D0D5DD]">Target Section (Arah Scroll Saat Diklik)</label>
                            <select
                              value={currentTarget}
                              onChange={(e) => {
                                const newTargets = [...(formContent.navbar.menuTargets || ["#hero", "#services", "#portfolio", "#contact"])];
                                newTargets[idx] = e.target.value;
                                updateNestedField(["navbar", "menuTargets"], newTargets);
                              }}
                              className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#FD853A] cursor-pointer"
                            >
                              <option value="#hero">Section Home / Hero (#hero)</option>
                              <option value="#services">Section Certificate (#services)</option>
                              <option value="#portfolio">Section Portfolio / Project (#portfolio)</option>
                              <option value="#contact">Section Contact / Footer (#contact)</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <hr className="border-[#333]" />

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Layout size={20} style={{ color: primaryColor }} />
                  Pengaturan Footer
                </h2>
                <p className="text-xs text-[#98A2B3] mt-1">Kelola deskripsi, kontak, hak cipta, dan link media sosial</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Logo Text Footer</label>
                  <input
                    type="text"
                    value={formContent.footer.logoText || ""}
                    onChange={(e) => updateNestedField(["footer", "logoText"], e.target.value)}
                    placeholder="Contoh: Mahesh Pokale / MP"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Tagline / Judul Utama Footer</label>
                  <input
                    type="text"
                    value={formContent.footer.tagline || ""}
                    onChange={(e) => updateNestedField(["footer", "tagline"], e.target.value)}
                    placeholder="Contoh: Lets Connect There / Mari Terhubung"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#D0D5DD]">Deskripsi Singkat Footer</label>
                <textarea
                  rows={3}
                  value={formContent.footer.description || ""}
                  onChange={(e) => updateNestedField(["footer", "description"], e.target.value)}
                  placeholder="Contoh: Designer & Developer profesional yang berdedikasi menciptakan pengalaman pengguna digital yang luar biasa..."
                  className="bg-[#2a2a2a] border border-[#444] rounded-xl p-3 sm:p-4 text-sm text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={formContent.footer.address || ""}
                    onChange={(e) => updateNestedField(["footer", "address"], e.target.value)}
                    placeholder="Contoh: Jakarta, Indonesia"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Email (Untuk Button Hire Me)</label>
                  <input
                    type="text"
                    value={formContent.footer.email || ""}
                    onChange={(e) => updateNestedField(["footer", "email"], e.target.value)}
                    placeholder="Contoh: kontak@portofolio.com"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Website Domain</label>
                  <input
                    type="text"
                    value={formContent.footer.website || ""}
                    onChange={(e) => updateNestedField(["footer", "website"], e.target.value)}
                    placeholder="Contoh: https://myportfolio.com atau portofolio.id"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Link Media Sosial (Opsional)</label>
                  <span className="text-[11px] text-[#98A2B3]">Hanya yang diisi yang akan muncul di Footer</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "facebook", label: "Facebook URL", placeholder: "Contoh: https://facebook.com/username" },
                    { key: "youtube", label: "YouTube URL", placeholder: "Contoh: https://youtube.com/@channel" },
                    { key: "whatsapp", label: "WhatsApp (Nomor / Link)", placeholder: "Contoh: https://wa.me/628123456789 atau 628123456789" },
                    { key: "instagram", label: "Instagram URL", placeholder: "Contoh: https://instagram.com/username" },
                    { key: "twitter", label: "Twitter / X URL", placeholder: "Contoh: https://x.com/username" },
                    { key: "linkedin", label: "LinkedIn URL", placeholder: "Contoh: https://linkedin.com/in/username" },
                    { key: "github", label: "GitHub URL", placeholder: "Contoh: https://github.com/username" },
                    { key: "pinterest", label: "Pinterest URL", placeholder: "Contoh: https://pinterest.com/username" },
                  ].map((item) => (
                    <div key={item.key} className="flex flex-col gap-1">
                      <span className="text-[11px] text-[#98A2B3] font-medium">{item.label}</span>
                      <input
                        type="text"
                        value={formContent.footer.socialLinks[item.key as keyof typeof formContent.footer.socialLinks] || ""}
                        onChange={(e) => updateNestedField(["footer", "socialLinks", item.key], e.target.value)}
                        placeholder={item.placeholder}
                        className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FD853A] outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HERO & RESUME */}
          {activeTab === "hero-hire" && (
            <div className="flex flex-col gap-6 sm:gap-8">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck size={20} style={{ color: primaryColor }} />
                  Section Hero &amp; Link Portfolio (CV Drive)
                </h2>
                <p className="text-xs text-[#98A2B3] mt-1">Ubah teks salam, nama, profesi, kutipan, foto hero, dan link Portfolio / CV Drive</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Teks Salam (Greeting)</label>
                  <input
                    type="text"
                    value={formContent.hero.greeting || ""}
                    onChange={(e) => updateNestedField(["hero", "greeting"], e.target.value)}
                    placeholder="Contoh: Hello! atau Halo!"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formContent.hero.name || ""}
                    onChange={(e) => updateNestedField(["hero", "name"], e.target.value)}
                    placeholder="Contoh: Jenny Wilson / Mahesh Pokale"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Profesi / Job Title</label>
                  <input
                    type="text"
                    value={formContent.hero.title || ""}
                    onChange={(e) => updateNestedField(["hero", "title"], e.target.value)}
                    placeholder="Contoh: Product Designer / Fullstack Developer"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Pengalaman Kerja (Teks Hero)</label>
                  <input
                    type="text"
                    value={formContent.hero.yearsExperience || ""}
                    onChange={(e) => updateNestedField(["hero", "yearsExperience"], e.target.value)}
                    placeholder="Contoh: 10 Years Experience atau Kosongkan"
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD] flex items-center justify-between">
                    <span>Jumlah Bintang Rating Hero (Opsional)</span>
                    <span className="text-[11px] text-[#98A2B3]">
                      {(formContent.hero.ratingStars ?? 5) === 0 ? "Sembunyikan Bintang" : `${formContent.hero.ratingStars ?? 5} Bintang`}
                    </span>
                  </label>
                  <div className="flex items-center gap-2 bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2">
                    <button
                      type="button"
                      onClick={() => updateNestedField(["hero", "ratingStars"], 0, true)}
                      className={`text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                        (formContent.hero.ratingStars ?? 5) === 0
                          ? "bg-red-500/20 text-red-400 font-semibold border border-red-500/40"
                          : "text-[#98A2B3] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Tanpa Bintang
                    </button>
                    <div className="h-4 w-px bg-[#444] mx-1" />
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const currentStars = formContent.hero.ratingStars ?? 5;
                        const isFilled = starNum <= currentStars;
                        return (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => updateNestedField(["hero", "ratingStars"], starNum, true)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                            title={`${starNum} Bintang`}
                          >
                            <Star
                              size={20}
                              fill={isFilled ? (primaryColor || "#F79009") : "none"}
                              stroke={isFilled ? (primaryColor || "#F79009") : "#666"}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#D0D5DD]">Kutipan / Description Ringkas Hero</label>
                  <textarea
                    rows={2}
                    value={formContent.hero.quote || ""}
                    onChange={(e) => updateNestedField(["hero", "quote"], e.target.value)}
                    placeholder="Contoh: Membantu mewujudkan produk digital yang estetis, modern, dan berdampak nyata..."
                    className="bg-[#2a2a2a] border border-[#444] rounded-xl p-3 text-sm text-white outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 p-3.5 sm:p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: primaryColor }}>
                  <FileCode size={15} /> Link Download Resume / Portfolio Drive
                </label>
                <input
                  type="text"
                  value={formContent.hero.resumeUrl || ""}
                  onChange={(e) => updateNestedField(["hero", "resumeUrl"], e.target.value)}
                  placeholder="Contoh: https://drive.google.com/file/d/... atau https://..."
                  className="bg-[#1a1a1a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 p-3.5 sm:p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                <label className="text-xs font-semibold" style={{ color: primaryColor }}>
                  Foto Hero (Link Google Drive / URL / Upload File)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formContent.hero.heroImage || ""}
                    onChange={(e) => updateNestedField(["hero", "heroImage"], e.target.value)}
                    placeholder="Contoh: https://drive.google.com/file/d/... atau /Frame 68.svg"
                    className="flex-1 bg-[#1a1a1a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                  <label className="cursor-pointer bg-[#333] hover:bg-[#444] text-xs text-white px-3.5 py-2.5 rounded-xl border border-[#555] flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                    <Upload size={14} />
                    <span>Upload Foto Hero</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => updateNestedField(["hero", "heroImage"], url, true))
                      }
                    />
                  </label>
                </div>

                {formContent.hero.heroImage && isValidUrlString(formatGoogleDriveUrl(formContent.hero.heroImage)) && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-[#1a1a1a] rounded-lg">
                    <span className="text-xs text-[#98A2B3]">Preview Foto Hero:</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formatGoogleDriveUrl(formContent.hero.heroImage)}
                      alt="Hero Preview"
                      className="w-14 h-14 object-cover rounded-lg bg-[#333] border border-[#444]"
                      onLoad={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "block";
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <hr className="border-[#333]" />

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck size={20} style={{ color: primaryColor }} />
                  Pengaturan Section &quot;Why Hire Me&quot;
                </h2>
                <p className="text-xs text-[#98A2B3] mt-1">Ubah judul, deskripsi, statistik, dan foto pendukung section Why Hire Me</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#D0D5DD]">Judul Section Hire Me</label>
                <input
                  type="text"
                  value={formContent.hireMe.title || ""}
                  onChange={(e) => updateNestedField(["hireMe", "title"], e.target.value)}
                  placeholder="Contoh: Why Hire Me? atau Mengapa Memilih Saya?"
                  className="bg-[#2a2a2a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#D0D5DD]">Deskripsi Section Hire Me</label>
                <textarea
                  rows={3}
                  value={formContent.hireMe.description || ""}
                  onChange={(e) => updateNestedField(["hireMe", "description"], e.target.value)}
                  placeholder="Contoh: Berpengalaman luas dalam merancang dan mengembangkan antarmuka web modern yang responsif dan berkinerja tinggi..."
                  className="bg-[#2a2a2a] border border-[#444] rounded-xl p-3 sm:p-4 text-sm text-white outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-2 p-3.5 sm:p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                <label className="text-xs font-semibold" style={{ color: primaryColor }}>
                  Foto &quot;Why Hire Me&quot; (Link Google Drive / URL / Upload File)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formContent.hireMe.heroImage || ""}
                    onChange={(e) => updateNestedField(["hireMe", "heroImage"], e.target.value)}
                    placeholder="Contoh: https://drive.google.com/file/d/... atau /Frame 77.svg"
                    className="flex-1 bg-[#1a1a1a] border border-[#444] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                  <label className="cursor-pointer bg-[#333] hover:bg-[#444] text-xs text-white px-3.5 py-2.5 rounded-xl border border-[#555] flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                    <Upload size={14} />
                    <span>Upload Foto Hire Me</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => updateNestedField(["hireMe", "heroImage"], url, true))
                      }
                    />
                  </label>
                </div>

                {formContent.hireMe.heroImage && isValidUrlString(formatGoogleDriveUrl(formContent.hireMe.heroImage)) && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-[#1a1a1a] rounded-lg">
                    <span className="text-xs text-[#98A2B3]">Preview Foto Hire Me:</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formatGoogleDriveUrl(formContent.hireMe.heroImage)}
                      alt="Hire Me Preview"
                      className="w-14 h-14 object-cover rounded-lg bg-[#333] border border-[#444]"
                      onLoad={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "block";
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 p-3.5 sm:p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                  <span className="text-xs font-semibold" style={{ color: primaryColor }}>Statistik 1</span>
                  <input
                    type="text"
                    value={formContent.hireMe.stat1Value || ""}
                    onChange={(e) => updateNestedField(["hireMe", "stat1Value"], e.target.value)}
                    placeholder="Contoh: 450+"
                    className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-1.5 text-sm text-white"
                  />
                  <input
                    type="text"
                    value={formContent.hireMe.stat1Label || ""}
                    onChange={(e) => updateNestedField(["hireMe", "stat1Label"], e.target.value)}
                    placeholder="Contoh: Project Completed"
                    className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-1.5 text-sm text-white"
                  />
                </div>

                <div className="flex flex-col gap-2 p-3.5 sm:p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                  <span className="text-xs font-semibold" style={{ color: primaryColor }}>Statistik 2</span>
                  <input
                    type="text"
                    value={formContent.hireMe.stat2Value || ""}
                    onChange={(e) => updateNestedField(["hireMe", "stat2Value"], e.target.value)}
                    placeholder="Contoh: 10+"
                    className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-1.5 text-sm text-white"
                  />
                  <input
                    type="text"
                    value={formContent.hireMe.stat2Label || ""}
                    onChange={(e) => updateNestedField(["hireMe", "stat2Label"], e.target.value)}
                    placeholder="Contoh: Years Experience"
                    className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-1.5 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CERTIFICATE */}
          {activeTab === "services" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Award size={20} style={{ color: primaryColor }} />
                    Kelola Certificate
                  </h2>
                  <p className="text-xs text-[#98A2B3] mt-1">Tambah, ubah, atau hapus kartu certificate &amp; deskripsi ringkasnya</p>
                </div>
                <button
                  onClick={() => {
                    const newItem: ServiceItem = {
                      id: Date.now().toString(),
                      title: "Certificate Baru",
                      imageSrc: "",
                      description: "",
                    };
                    updateNestedField(["services"], [newItem, ...formContent.services], true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-semibold hover:opacity-90 cursor-pointer shadow-md transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus size={16} />
                  <span>Tambah Certificate</span>
                </button>
              </div>

              {/* Section Header Title */}
              <div className="flex flex-col gap-2 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                <label className="text-xs font-semibold text-[#D0D5DD] flex items-center justify-between">
                  <span>Judul Section Certificate (Teks Tampilan Web)</span>
                  <span className="text-[11px] text-[#98A2B3] font-normal">Default: My Certificate</span>
                </label>
                <input
                  type="text"
                  value={formContent.sectionTitles?.services ?? formContent.servicesTitle ?? "My Certificate"}
                  onChange={(e) => {
                    updateNestedField(["sectionTitles", "services"], e.target.value);
                    updateNestedField(["servicesTitle"], e.target.value);
                  }}
                  placeholder="Contoh: My Certificate atau Sertifikat Saya"
                  className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FD853A] outline-none"
                />
                <p className="text-[11px] text-[#98A2B3]">
                  💡 Kata terakhir akan otomatis diberi warna aksen utama (Primary Color).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formContent.services.map((service, index) => (
                  <div key={service.id} className="flex flex-col gap-3 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a] relative">
                    <button
                      onClick={() => {
                        const newServices = formContent.services.filter((_, i) => i !== index);
                        updateNestedField(["services"], newServices, true);
                      }}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-500/10 cursor-pointer"
                      title="Hapus Certificate"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Nama Certificate #{index + 1}</label>
                      <input
                        type="text"
                        value={service.title || ""}
                        onChange={(e) => {
                          const copy = [...formContent.services];
                          copy[index].title = e.target.value;
                          updateNestedField(["services"], copy);
                        }}
                        placeholder="Contoh: Google UX Design Professional Certificate"
                        className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Foto Certificate (Google Drive Link / URL / Upload File)</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={service.imageSrc || ""}
                          onChange={(e) => {
                            const copy = [...formContent.services];
                            copy[index].imageSrc = e.target.value;
                            updateNestedField(["services"], copy);
                          }}
                          placeholder="Contoh: https://drive.google.com/file/d/... atau https://..."
                          className="flex-1 bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                        <label className="cursor-pointer bg-[#333] hover:bg-[#444] text-xs text-white px-3 py-2 rounded-lg border border-[#555] flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                          <Upload size={14} />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) => {
                                const copy = [...formContent.services];
                                copy[index].imageSrc = url;
                                updateNestedField(["services"], copy, true);
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Deskripsi Ringkas (Muncul saat diklik)</label>
                      <textarea
                        rows={3}
                        value={service.description || ""}
                        onChange={(e) => {
                          const copy = [...formContent.services];
                          copy[index].description = e.target.value;
                          updateNestedField(["services"], copy);
                        }}
                        placeholder="Contoh: Sertifikat kompetensi desain antarmuka dan riset pengguna yang diterbitkan oleh Google Coursera tahun 2024..."
                        className="bg-[#1a1a1a] border border-[#444] rounded-lg p-2.5 text-sm text-white resize-none"
                      />
                    </div>

                    {service.imageSrc && isValidUrlString(formatGoogleDriveUrl(service.imageSrc)) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#98A2B3]">Preview:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formatGoogleDriveUrl(service.imageSrc)}
                          alt={service.title}
                          className="w-12 h-12 object-cover rounded-lg bg-[#333] border border-[#444]"
                          onLoad={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "block";
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={20} style={{ color: primaryColor }} />
                    Kelola Pengalaman Kerja (Work Experience)
                  </h2>
                  <p className="text-xs text-[#98A2B3] mt-1">Tambah, edit, atau hapus riwayat pengalaman kerja</p>
                </div>
                <button
                  onClick={() => {
                    const newItem: ExperienceItem = {
                      id: Date.now().toString(),
                      company: "Nama Perusahaan, Kota",
                      duration: "Bulan 2024 - Sekarang",
                      role: "Posisi / Jabatan",
                      desc: "Deskripsi singkat mengenai tanggung jawab pekerjaan.",
                      dotColor: "bg-[#FD853A]",
                    };
                    updateNestedField(["experiences"], [newItem, ...formContent.experiences], true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-semibold hover:opacity-90 cursor-pointer shadow-md transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus size={16} />
                  <span>Tambah Pengalaman</span>
                </button>
              </div>

              {/* Section Header Title */}
              <div className="flex flex-col gap-2 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                <label className="text-xs font-semibold text-[#D0D5DD] flex items-center justify-between">
                  <span>Judul Section Pengalaman Kerja (Teks Tampilan Web)</span>
                  <span className="text-[11px] text-[#98A2B3] font-normal">Default: My Work Experience</span>
                </label>
                <input
                  type="text"
                  value={formContent.sectionTitles?.experience ?? formContent.experiencesTitle ?? "My Work Experience"}
                  onChange={(e) => {
                    updateNestedField(["sectionTitles", "experience"], e.target.value);
                    updateNestedField(["experiencesTitle"], e.target.value);
                  }}
                  placeholder="Contoh: My Work Experience atau Pengalaman Kerja"
                  className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FD853A] outline-none"
                />
                <p className="text-[11px] text-[#98A2B3]">
                  💡 Kata pertama akan berwarna gelap/terang dan kata berikutnya akan diberi warna aksen utama.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {formContent.experiences.map((exp, index) => (
                  <div key={exp.id} className="flex flex-col gap-3 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a] relative">
                    <button
                      onClick={() => {
                        const newExp = formContent.experiences.filter((_, i) => i !== index);
                        updateNestedField(["experiences"], newExp, true);
                      }}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-500/10 cursor-pointer"
                      title="Hapus Pengalaman"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[#D0D5DD]">Perusahaan & Lokasi</label>
                        <input
                          type="text"
                          value={exp.company || ""}
                          onChange={(e) => {
                            const copy = [...formContent.experiences];
                            copy[index].company = e.target.value;
                            updateNestedField(["experiences"], copy);
                          }}
                          placeholder="Contoh: PT Teknologi Indonesia, Jakarta"
                          className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[#D0D5DD]">Durasi / Periode</label>
                        <input
                          type="text"
                          value={exp.duration || ""}
                          onChange={(e) => {
                            const copy = [...formContent.experiences];
                            copy[index].duration = e.target.value;
                            updateNestedField(["experiences"], copy);
                          }}
                          placeholder="Contoh: Jan 2023 - Sekarang"
                          className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[#D0D5DD]">Jabatan / Role</label>
                        <input
                          type="text"
                          value={exp.role || ""}
                          onChange={(e) => {
                            const copy = [...formContent.experiences];
                            copy[index].role = e.target.value;
                            updateNestedField(["experiences"], copy);
                          }}
                          placeholder="Contoh: Senior UI/UX Designer"
                          className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Deskripsi Singkat Pekerjaan</label>
                      <textarea
                        rows={2}
                        value={exp.desc || ""}
                        onChange={(e) => {
                          const copy = [...formContent.experiences];
                          copy[index].desc = e.target.value;
                          updateNestedField(["experiences"], copy);
                        }}
                        placeholder="Contoh: Bertanggung jawab memimpin tim perancang produk, menyusun design system, dan meningkatkan alur onboarding pengguna..."
                        className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-sm text-white resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PORTFOLIO */}
          {activeTab === "portfolio" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <FolderKanban size={20} style={{ color: primaryColor }} />
                    Kelola Portofolio (Projects)
                  </h2>
                  <p className="text-xs text-[#98A2B3] mt-1">Tambah, ubah, atau hapus proyek portofolio</p>
                </div>
                <button
                  onClick={() => {
                    const newItem: PortfolioItem = {
                      id: Date.now().toString(),
                      title: "Nama Proyek Baru",
                      href: "",
                      desc: "Deskripsi singkat proyek...",
                      image: "",
                    };
                    updateNestedField(["portfolio"], [newItem, ...formContent.portfolio], true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-semibold hover:opacity-90 cursor-pointer shadow-md transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus size={16} />
                  <span>Tambah Proyek</span>
                </button>
              </div>

              {/* Section Header Title */}
              <div className="flex flex-col gap-2 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                <label className="text-xs font-semibold text-[#D0D5DD] flex items-center justify-between">
                  <span>Judul Section Portofolio (Teks Tampilan Web)</span>
                  <span className="text-[11px] text-[#98A2B3] font-normal">Default: Lets Have a look at my Portfolio</span>
                </label>
                <input
                  type="text"
                  value={formContent.sectionTitles?.portfolio ?? formContent.portfolioTitle ?? "Lets Have a look at my Portfolio"}
                  onChange={(e) => {
                    updateNestedField(["sectionTitles", "portfolio"], e.target.value);
                    updateNestedField(["portfolioTitle"], e.target.value);
                  }}
                  placeholder="Contoh: Lets Have a look at my Portfolio"
                  className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FD853A] outline-none"
                />
                <p className="text-[11px] text-[#98A2B3]">
                  💡 Kata terakhir akan otomatis diberi warna aksen utama (Primary Color).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formContent.portfolio.map((proj, index) => (
                  <div key={proj.id} className="flex flex-col gap-3 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a] relative">
                    <button
                      onClick={() => {
                        const newPortfolio = formContent.portfolio.filter((_, i) => i !== index);
                        updateNestedField(["portfolio"], newPortfolio, true);
                      }}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-500/10 cursor-pointer"
                      title="Hapus Proyek"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Judul Proyek #{index + 1}</label>
                      <input
                        type="text"
                        value={proj.title || ""}
                        onChange={(e) => {
                          const copy = [...formContent.portfolio];
                          copy[index].title = e.target.value;
                          updateNestedField(["portfolio"], copy);
                        }}
                        placeholder="Contoh: LSign - Web Banking & Crypto App"
                        className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Foto Proyek (Google Drive Link / URL / Upload File)</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={proj.image || ""}
                          onChange={(e) => {
                            const copy = [...formContent.portfolio];
                            copy[index].image = e.target.value;
                            updateNestedField(["portfolio"], copy);
                          }}
                          placeholder="Contoh: https://drive.google.com/file/d/... atau https://..."
                          className="flex-1 bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                        <label className="cursor-pointer bg-[#333] hover:bg-[#444] text-xs text-white px-3 py-2 rounded-lg border border-[#555] flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                          <Upload size={14} />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) => {
                                const copy = [...formContent.portfolio];
                                copy[index].image = url;
                                updateNestedField(["portfolio"], copy, true);
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>

                    {proj.image && isValidUrlString(formatGoogleDriveUrl(proj.image)) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#98A2B3]">Preview:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formatGoogleDriveUrl(proj.image)}
                          alt={proj.title}
                          className="w-12 h-12 object-cover rounded-lg bg-[#333] border border-[#444]"
                          onLoad={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "block";
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Link Halaman / URL Proyek (Opsional)</label>
                      <input
                        type="text"
                        value={proj.href || ""}
                        onChange={(e) => {
                          const copy = [...formContent.portfolio];
                          copy[index].href = e.target.value;
                          updateNestedField(["portfolio"], copy);
                        }}
                        placeholder="Contoh: https://dribbble.com/shots/... (Kosongkan jika tidak ingin tombol Buka Proyek)"
                        className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                      />
                      <p className="text-[11px] text-[#98A2B3]">
                        💡 Jika diisi, tombol &quot;Buka Proyek&quot; akan muncul di popup modal. Jika dikosongkan, tombol tidak akan muncul.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Deskripsi Proyek</label>
                      <textarea
                        rows={2}
                        value={proj.desc || ""}
                        onChange={(e) => {
                          const copy = [...formContent.portfolio];
                          copy[index].desc = e.target.value;
                          updateNestedField(["portfolio"], copy);
                        }}
                        placeholder="Contoh: Desain antarmuka aplikasi perbankan modern dan dashboard crypto yang berfokus pada kecepatan transaksi..."
                        className="bg-[#1a1a1a] border border-[#444] rounded-lg p-2.5 text-sm text-white resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: BLOG POSTS */}
          {activeTab === "blogs" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <FileText size={20} style={{ color: primaryColor }} />
                    Kelola Blog Posts (Opsional)
                  </h2>
                  <p className="text-xs text-[#98A2B3] mt-1">Tambah, ubah, atau hapus artikel blog beserta isinya</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const sorted = sortBlogsByDate(formContent.blogs);
                      updateNestedField(["blogs"], sorted, true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md transition-colors"
                    title="Urutkan semua artikel berdasarkan tanggal publish terbaru"
                  >
                    <ArrowUpDown size={14} />
                    <span>Urutkan Tanggal Terbaru</span>
                  </button>
                  <button
                    onClick={() => {
                      const newItem: BlogItem = {
                        id: Date.now().toString(),
                        title: "Judul Artikel Blog Baru",
                        name: "",
                        date: "",
                        button: "",
                        image: "",
                        content: "",
                      };
                      updateNestedField(["blogs"], [newItem, ...formContent.blogs], true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-semibold hover:opacity-90 cursor-pointer shadow-md transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus size={16} />
                    <span>Tambah Blog</span>
                  </button>
                </div>
              </div>

              {/* Section Header Title */}
              <div className="flex flex-col gap-2 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                <label className="text-xs font-semibold text-[#D0D5DD] flex items-center justify-between">
                  <span>Judul Section Blog Post (Teks Tampilan Web)</span>
                  <span className="text-[11px] text-[#98A2B3] font-normal">Default: From my blog post</span>
                </label>
                <input
                  type="text"
                  value={formContent.sectionTitles?.blogs ?? formContent.blogsTitle ?? "From my blog post"}
                  onChange={(e) => {
                    updateNestedField(["sectionTitles", "blogs"], e.target.value);
                    updateNestedField(["blogsTitle"], e.target.value);
                  }}
                  placeholder="Contoh: From my blog post atau Artikel Terbaru"
                  className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FD853A] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formContent.blogs.map((blog, index) => (
                  <div key={blog.id} className="flex flex-col gap-3 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a] relative">
                    <button
                      onClick={() => {
                        const newBlogs = formContent.blogs.filter((_, i) => i !== index);
                        updateNestedField(["blogs"], newBlogs, true);
                      }}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-500/10 cursor-pointer"
                      title="Hapus Blog"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Judul Artikel</label>
                      <input
                        type="text"
                        value={blog.title || ""}
                        onChange={(e) => {
                          const copy = [...formContent.blogs];
                          copy[index].title = e.target.value;
                          updateNestedField(["blogs"], copy);
                        }}
                        placeholder="Contoh: Tren Desain UI/UX & Kecerdasan Buatan 2025"
                        className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[#D0D5DD]">Penulis</label>
                        <input
                          type="text"
                          value={blog.name || ""}
                          onChange={(e) => {
                            const copy = [...formContent.blogs];
                            copy[index].name = e.target.value;
                            updateNestedField(["blogs"], copy);
                          }}
                          placeholder="Contoh: Admin / Jenny Wilson"
                          className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[#D0D5DD]">Tanggal Publish</label>
                        <input
                          type="text"
                          value={blog.date || ""}
                          onChange={(e) => {
                            const copy = [...formContent.blogs];
                            copy[index].date = e.target.value;
                            updateNestedField(["blogs"], copy);
                          }}
                          placeholder="Contoh: 15 Jan 2025"
                          className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Foto Cover Blog (Google Drive Link / URL / Upload File)</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={blog.image || ""}
                          onChange={(e) => {
                            const copy = [...formContent.blogs];
                            copy[index].image = e.target.value;
                            updateNestedField(["blogs"], copy);
                          }}
                          placeholder="Contoh: https://drive.google.com/file/d/... atau https://..."
                          className="flex-1 bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                        <label className="cursor-pointer bg-[#333] hover:bg-[#444] text-xs text-white px-3 py-2 rounded-lg border border-[#555] flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                          <Upload size={14} />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) => {
                                const copy = [...formContent.blogs];
                                copy[index].image = url;
                                updateNestedField(["blogs"], copy, true);
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#D0D5DD]">Isi / Konten Artikel (Muncul saat diklik)</label>
                      <textarea
                        rows={3}
                        value={blog.content || ""}
                        onChange={(e) => {
                          const copy = [...formContent.blogs];
                          copy[index].content = e.target.value;
                          updateNestedField(["blogs"], copy);
                        }}
                        placeholder="Contoh: Tulis isi lengkap artikel blog di sini... Anda dapat menulis beberapa paragraf untuk membagikan wawasan dan pengalaman Anda."
                        className="bg-[#1a1a1a] border border-[#444] rounded-lg p-2.5 text-sm text-white resize-none"
                      />
                    </div>

                    {blog.image && isValidUrlString(formatGoogleDriveUrl(blog.image)) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#98A2B3]">Preview:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formatGoogleDriveUrl(blog.image)}
                          alt={blog.title}
                          className="w-12 h-12 object-cover rounded-lg bg-[#333] border border-[#444]"
                          onLoad={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "block";
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Blog Comments Quick Link */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#333] mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#98A2B3]">
                        <MessageSquare size={14} />
                        <span>
                          {comments.filter((c) => c.blogId === blog.id).length} Komentar
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/blog/${blog.id}`}
                          target="_blank"
                          className="text-xs text-[#98A2B3] hover:text-white flex items-center gap-1"
                        >
                          <span>Buka Halaman</span>
                          <ExternalLink size={12} />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedBlogFilter(blog.id);
                            setActiveTab("comments");
                          }}
                          className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                        >
                          Kelola Komentar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: KOMENTAR BLOG */}
          {activeTab === "comments" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare size={20} style={{ color: primaryColor }} />
                    Kelola Komentar Blog
                  </h2>
                  <p className="text-xs text-[#98A2B3] mt-1">
                    Lihat, filter, dan hapus komentar dari pengunjung pada artikel blog
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3a3a3a] text-white font-semibold flex items-center gap-1.5 shadow-sm">
                    <MessageSquare size={14} style={{ color: primaryColor }} />
                    <span>Total: {comments.length} Komentar</span>
                  </span>
                </div>
              </div>

              {/* Status Message */}
              {commentActionMsg && (
                <div className="p-3.5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-2 animate-fade-in">
                  <Check size={16} />
                  <span>{commentActionMsg}</span>
                </div>
              )}

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a]">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={commentSearch}
                    onChange={(e) => setCommentSearch(e.target.value)}
                    placeholder="Contoh: Cari komentar berdasarkan nama, email, atau isi teks..."
                    className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-[#FD853A] outline-none"
                  />
                </div>

                <div className="sm:w-64">
                  <select
                    value={selectedBlogFilter}
                    onChange={(e) => setSelectedBlogFilter(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FD853A] outline-none cursor-pointer"
                  >
                    <option value="all">Semua Artikel Blog</option>
                    {sortBlogsByDate(formContent.blogs).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delete Confirmation Modal */}
              {commentToDelete && (
                <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#222] border border-[#444] rounded-2xl p-6 max-w-md w-full flex flex-col gap-4 shadow-2xl">
                    <div className="flex items-center gap-3 text-rose-400">
                      <AlertTriangle size={24} />
                      <h3 className="text-base font-bold text-white">Hapus Komentar Ini?</h3>
                    </div>
                    <div className="p-3.5 bg-[#181818] rounded-xl border border-[#333] text-xs text-gray-300 flex flex-col gap-1.5">
                      <span className="font-semibold text-white">Dari: {commentToDelete.name}</span>
                      <p className="italic text-gray-300 line-clamp-3">&quot;{commentToDelete.content}&quot;</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Tindakan ini tidak dapat dibatalkan. Komentar akan dihapus secara permanen dari database Firebase Firestore.
                    </p>
                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        onClick={() => setCommentToDelete(null)}
                        disabled={isDeletingComment}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#333] hover:bg-[#444] text-white transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleDeleteComment(commentToDelete.id)}
                        disabled={isDeletingComment}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                      >
                        {isDeletingComment ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Menghapus...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            <span>Ya, Hapus</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="p-12 text-center text-gray-400 text-sm bg-[#262626] rounded-xl border border-[#3a3a3a]">
                  Memuat data komentar...
                </div>
              ) : (() => {
                const filtered = comments.filter((c) => {
                  const matchesSearch =
                    commentSearch.trim() === "" ||
                    c.name.toLowerCase().includes(commentSearch.toLowerCase()) ||
                    c.content.toLowerCase().includes(commentSearch.toLowerCase()) ||
                    (c.email && c.email.toLowerCase().includes(commentSearch.toLowerCase()));

                  const matchesBlog =
                    selectedBlogFilter === "all" || c.blogId === selectedBlogFilter;

                  return matchesSearch && matchesBlog;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center text-gray-400 text-sm bg-[#262626] rounded-xl border border-[#3a3a3a] flex flex-col items-center gap-3">
                      <MessageSquare size={32} className="text-gray-500" />
                      <p className="font-semibold text-white text-base">Tidak Ada Komentar</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        {comments.length === 0
                          ? "Belum ada komentar dari pengunjung yang masuk."
                          : "Tidak ada komentar yang cocok dengan kata kunci atau filter yang dipilih."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-3">
                    {filtered.map((item) => {
                      const associatedBlog = formContent.blogs.find((b) => b.id === item.blogId);
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a] hover:border-[#4a4a4a] transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                style={{ backgroundColor: primaryColor }}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                              >
                                {item.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-white">{item.name}</span>
                                  {item.email && (
                                    <span className="text-xs text-gray-400 font-normal">({item.email})</span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400">
                                  {(() => {
                                    if (!item.createdAt) return "Baru saja";
                                    try {
                                      let d: Date;
                                      if (typeof item.createdAt === "object" && item.createdAt !== null && "toDate" in item.createdAt && typeof (item.createdAt as Timestamp).toDate === "function") {
                                        d = (item.createdAt as Timestamp).toDate();
                                      } else if (typeof item.createdAt === "object" && item.createdAt !== null && "seconds" in item.createdAt) {
                                        d = new Date((item.createdAt as { seconds: number }).seconds * 1000);
                                      } else if (typeof item.createdAt === "number") {
                                        d = new Date(item.createdAt);
                                      } else {
                                        d = new Date(String(item.createdAt));
                                      }
                                      return isNaN(d.getTime()) ? "Baru saja" : new Intl.DateTimeFormat("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }).format(d);
                                    } catch {
                                      return "Baru saja";
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => setCommentToDelete(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Hapus Komentar"
                            >
                              <Trash2 size={14} />
                              <span className="hidden sm:inline">Hapus</span>
                            </button>
                          </div>

                          {/* Associated Blog Link */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#98A2B3]">Artikel:</span>
                            <Link
                              href={`/blog/${item.blogId}`}
                              target="_blank"
                              className="text-xs text-orange-400 hover:text-orange-300 underline flex items-center gap-1 truncate max-w-md"
                            >
                              <span>{associatedBlog?.title || item.blogTitle || `Blog #${item.blogId}`}</span>
                              <ExternalLink size={12} />
                            </Link>
                          </div>

                          {/* Comment Content */}
                          <div className="p-3 bg-[#1e1e1e] rounded-lg border border-[#333] text-sm text-gray-200 whitespace-pre-line break-words leading-relaxed">
                            {item.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 9: UBAH PASSWORD & BACKUP DATABASE */}
          {activeTab === "password" && (
            <div className="flex flex-col gap-8 max-w-2xl">
              {/* Section 1: Ubah Password Login Admin */}
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <KeyRound size={20} style={{ color: primaryColor }} />
                    Ubah Password Login Admin
                  </h2>
                  <p className="text-xs text-[#98A2B3] mt-1">Perbarui password akun admin Firebase Auth agar lebih aman</p>
                </div>

                {passwordStatus.message && (
                  <div
                    className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-2 ${passwordStatus.type === "success"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                        : "bg-red-950/80 text-red-300 border-red-800"
                      }`}
                  >
                    <Lock size={16} />
                    <span>{passwordStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#D0D5DD]">Password Baru</label>
                    <div className="relative w-full">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Contoh: Minimal 6 karakter (misal: Admin@2025)"
                        required
                        className="w-full bg-[#2a2a2a] border border-[#444] rounded-xl pl-4 pr-12 py-2.5 text-sm text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-white transition-colors cursor-pointer p-1"
                        title={showNewPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#D0D5DD]">Konfirmasi Password Baru</label>
                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Contoh: Ulangi password baru yang sama"
                        required
                        className="w-full bg-[#2a2a2a] border border-[#444] rounded-xl pl-4 pr-12 py-2.5 text-sm text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-white transition-colors cursor-pointer p-1"
                        title={showConfirmPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="mt-2 flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isChangingPassword ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Lock size={16} />
                    )}
                    <span>{isChangingPassword ? "Memproses..." : "Perbarui Password Admin"}</span>
                  </button>
                </form>
              </div>

              {/* Section 2: Backup & Restore Database Firestore */}
              <div className="border-t border-[#333] pt-6 flex flex-col gap-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Database size={20} style={{ color: primaryColor }} />
                    Backup &amp; Restore Database Firestore (database.json)
                  </h2>
                  <p className="text-xs text-[#98A2B3] mt-1">
                    Download seluruh data situs (konten, statistik, sertifikat, proyek, blog &amp; komentar) sebagai file <code className="text-orange-400 bg-black/40 px-1.5 py-0.5 rounded text-[11px]">database.json</code> atau unggah untuk memulihkannya kembali.
                  </p>
                </div>

                {dbSyncStatus.message && (
                  <div
                    className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-2 ${
                      dbSyncStatus.type === "success"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                        : "bg-red-950/80 text-red-300 border-red-800"
                    }`}
                  >
                    {dbSyncStatus.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    <span>{dbSyncStatus.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Download Card */}
                  <div className="p-4 sm:p-5 bg-[#262626] rounded-xl border border-[#3a3a3a] flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-white font-semibold text-sm">
                        <Download size={18} style={{ color: primaryColor }} />
                        <span>Download database.json</span>
                      </div>
                      <p className="text-xs text-[#98A2B3] leading-relaxed">
                        Ekspor seluruh isi database Firestore terkini ke dalam format file JSON untuk backup lokal.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadDatabase}
                      disabled={isExportingDb}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-md cursor-pointer hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isExportingDb ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mengekspor...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>Download database.json</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Upload / Import Card */}
                  <div className="p-4 sm:p-5 bg-[#262626] rounded-xl border border-[#3a3a3a] flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-white font-semibold text-sm">
                        <Upload size={18} style={{ color: primaryColor }} />
                        <span>Import database.json</span>
                      </div>
                      <p className="text-xs text-[#98A2B3] leading-relaxed">
                        Upload file JSON backup untuk memperbarui atau memulihkan isi database Firestore situs secara langsung.
                      </p>
                    </div>

                    <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#333] hover:bg-[#444] border border-[#555] transition-all shadow-md cursor-pointer">
                      {isImportingDb ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mengimpor...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Pilih &amp; Upload File</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        disabled={isImportingDb}
                        onChange={handleImportDatabase}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Clean All Sample Data Confirmation Modal */}
      {showCleanModal && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] rounded-2xl border border-[#444] p-6 max-w-md w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Bersihkan Semua Data Contoh?</h3>
                <p className="text-xs text-[#98A2B3]">Pembersihan data awal hosting</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#262626] p-3.5 rounded-xl border border-[#333]">
              Tindakan ini akan mengosongkan seluruh data teks bawaan (<em>greeting, nama, title, quote, menu navbar contoh, dan deskripsi</em>). Aset <strong>Frame 68.svg, Frame 77.svg</strong>, serta teks <strong>copyright dengan hyperlink di footer akan tetap dipertahankan</strong>.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCleanModal(false)}
                disabled={isCleaningSample}
                className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-[#2a2a2a] hover:bg-[#333] rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCleanAllSampleData}
                disabled={isCleaningSample}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {isCleaningSample ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Ya, Bersihkan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
