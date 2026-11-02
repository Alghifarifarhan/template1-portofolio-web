"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Share2,
  Check,
  MessageSquare,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Facebook,
  Linkedin,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { formatGoogleDriveUrl, sortBlogsByDate } from "@/lib/utils";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BlogComment {
  id: string;
  blogId: string;
  blogTitle?: string;
  name: string;
  email?: string;
  content: string;
  createdAt: string | number | Timestamp | null;
}

export default function BlogDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { content, loading } = useAdmin();

  const [clientPathId, setClientPathId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] === "blog") {
        setClientPathId(decodeURIComponent(parts[1]));
      }
    }
  }, []);

  const blogId = useMemo(() => {
    if (params?.id) {
      return Array.isArray(params.id) ? params.id[0] : params.id;
    }
    const queryId = searchParams?.get("id");
    if (queryId) return queryId;
    return clientPathId || "";
  }, [params, searchParams, clientPathId]);

  // Find the blog item by ID or title
  const currentBlog = useMemo(() => {
    if (!content?.blogs || content.blogs.length === 0) return null;
    return (
      content.blogs.find(
        (b) => b.id === blogId || encodeURIComponent(b.id) === blogId
      ) ||
      content.blogs.find(
        (b) =>
          encodeURIComponent(b.title.toLowerCase().replace(/\s+/g, "-")) ===
          blogId
      ) ||
      null
    );
  }, [content?.blogs, blogId]);

  // Other blogs for recommendation (sorted by latest publish date)
  const otherBlogs = useMemo(() => {
    if (!content?.blogs) return [];
    const sorted = sortBlogsByDate(content.blogs);
    return sorted.filter((b) => b.id !== currentBlog?.id).slice(0, 3);
  }, [content?.blogs, currentBlog?.id]);

  const primaryColor = content?.colors?.primary || "#FD853A";
  const logoText =
    content?.navbar?.logoText || content?.footer?.logoText || "Portfolio";

  // Share link state
  const [copied, setCopied] = useState(false);

  // Comments state
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reading time estimate (180 words per min)
  const readingTime = useMemo(() => {
    const text =
      (currentBlog?.title || "") + " " + (currentBlog?.content || "");
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min baca`;
  }, [currentBlog]);

  // Short excerpt for social sharing
  const shareExcerpt = useMemo(() => {
    const raw = currentBlog?.content || currentBlog?.title || "";
    const clean = raw.replace(/\r?\n|\r/g, " ").trim();
    return clean.length > 140 ? clean.substring(0, 137) + "..." : clean;
  }, [currentBlog]);

  // Dynamic Head Metadata for Social Crawlers and Browser Tabs
  useEffect(() => {
    if (!currentBlog) return;
    const title = `${currentBlog.title} | Blog`;
    document.title = title;

    const rawDesc = currentBlog.content || currentBlog.title || "";
    const cleanSnippet = rawDesc.replace(/\r?\n|\r/g, " ").trim();
    const shortDesc =
      cleanSnippet.length > 160
        ? cleanSnippet.substring(0, 157) + "..."
        : cleanSnippet;
    const imageUrl = currentBlog.image
      ? formatGoogleDriveUrl(currentBlog.image)
      : "";
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";

    const setMetaTag = (attr: string, key: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMetaTag("property", "og:title", currentBlog.title);
    setMetaTag("property", "og:description", shortDesc);
    setMetaTag("property", "og:image", imageUrl);
    setMetaTag("property", "og:url", currentUrl);
    setMetaTag("property", "og:type", "article");

    setMetaTag("name", "twitter:card", imageUrl ? "summary_large_image" : "summary");
    setMetaTag("name", "twitter:title", currentBlog.title);
    setMetaTag("name", "twitter:description", shortDesc);
    setMetaTag("name", "twitter:image", imageUrl);
    setMetaTag("name", "description", shortDesc);
  }, [currentBlog]);

  // Fetch comments in realtime from Firestore
  useEffect(() => {
    if (!blogId) return;

    let unsubscribe: () => void = () => {};

    try {
      const canonicalBlogId = currentBlog?.id ? String(currentBlog.id) : String(blogId);
      const queryIds = Array.from(new Set([String(blogId), canonicalBlogId])).filter(Boolean);

      const q = queryIds.length > 1
        ? query(collection(db, "blogComments"), where("blogId", "in", queryIds))
        : query(collection(db, "blogComments"), where("blogId", "==", canonicalBlogId));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: BlogComment[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetched.push({
              id: docSnap.id,
              blogId: data.blogId || canonicalBlogId,
              blogTitle: data.blogTitle || currentBlog?.title || "",
              name: data.name || "Anonim",
              email: data.email || "",
              content: data.content || "",
              createdAt: data.createdAt,
            });
          });

          // Sort in memory by date descending
          fetched.sort((a, b) => {
            const getTime = (val: unknown) => {
              if (!val) return 0;
              if (typeof val === "number") return val;
              if (
                typeof val === "object" &&
                val !== null &&
                "toMillis" in val &&
                typeof (val as Timestamp).toMillis === "function"
              ) {
                return (val as Timestamp).toMillis();
              }
              if (
                typeof val === "object" &&
                val !== null &&
                "seconds" in val
              ) {
                return (val as { seconds: number }).seconds * 1000;
              }
              const parsed = new Date(String(val)).getTime();
              return isNaN(parsed) ? 0 : parsed;
            };
            return getTime(b.createdAt) - getTime(a.createdAt);
          });

          setComments(fetched);
          setCommentsLoading(false);
        },
        (error) => {
          console.warn("Firestore comments fetch notice:", error);
          setCommentsLoading(false);
        }
      );
    } catch (err) {
      console.warn("Error subscribing to comments:", err);
      setCommentsLoading(false);
    }

    return () => unsubscribe();
  }, [blogId, currentBlog?.id, currentBlog?.title]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commentText.trim()) {
      setErrorMessage("Nama dan isi komentar wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const canonicalBlogId = currentBlog?.id ? String(currentBlog.id) : String(blogId);
      const newCommentData = {
        blogId: canonicalBlogId,
        blogTitle: currentBlog?.title || "Artikel Blog",
        name: name.trim(),
        email: email.trim(),
        content: commentText.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "blogComments"), newCommentData);

      setSubmitSuccess(true);
      setName("");
      setEmail("");
      setCommentText("");
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: unknown) {
      console.error("Error submitting comment:", err);
      const msg = err instanceof Error ? err.message : "Gagal mengirim komentar ke database. Silakan periksa koneksi dan coba lagi.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (val: unknown) => {
    if (!val) return "Baru saja";
    try {
      let date: Date;
      if (
        typeof val === "object" &&
        val !== null &&
        "toDate" in val &&
        typeof (val as Timestamp).toDate === "function"
      ) {
        date = (val as Timestamp).toDate();
      } else if (
        typeof val === "object" &&
        val !== null &&
        "seconds" in val
      ) {
        date = new Date((val as { seconds: number }).seconds * 1000);
      } else if (typeof val === "number") {
        date = new Date(val);
      } else {
        date = new Date(String(val));
      }
      if (isNaN(date.getTime())) return "Baru saja";
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "Baru saja";
    }
  };

  // Avatar initial color generator
  const getAvatarGradient = (str: string) => {
    const colors = [
      "from-orange-500 to-amber-500",
      "from-blue-500 to-cyan-500",
      "from-emerald-500 to-teal-500",
      "from-purple-500 to-pink-500",
      "from-rose-500 to-red-500",
      "from-indigo-500 to-violet-500",
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white text-gray-800">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"
            style={{ borderTopColor: primaryColor }}
          />
          <p className="text-sm font-medium text-gray-500">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (!currentBlog) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] text-[#0F172A] px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-xl text-center flex flex-col items-center gap-4">
          <div
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
          >
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Artikel Tidak Ditemukan
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Artikel blog yang Anda cari tidak tersedia atau mungkin telah dihapus
            oleh admin.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{ backgroundColor: primaryColor }}
            className="mt-2 flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl text-white font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  const formattedCoverImage = formatGoogleDriveUrl(currentBlog.image, "");

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-[#0F172A] transition-colors duration-300 antialiased selection:bg-orange-100 selection:text-orange-900">
      {/* Light Theme Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 text-sm sm:text-base font-semibold text-[#334155] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-all group-hover:-translate-x-1">
              <ArrowLeft size={18} />
            </div>
            <span>Kembali</span>
          </button>

          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <div
              style={{ backgroundColor: primaryColor }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm text-white font-bold text-xs"
            >
              {logoText.substring(0, 2).toUpperCase()}
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-[#0F172A]">
              {logoText}
            </span>
          </Link>

          {/* Share Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Salin Link Artikel"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-600" />
                  <span className="text-emerald-600 hidden sm:inline">
                    Tersalin!
                  </span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span className="hidden sm:inline">Bagikan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Blog Article Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <article className="flex flex-col gap-6 sm:gap-8">
          {/* Breadcrumb & Badge */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Beranda
            </Link>
            <ChevronRight size={14} />
            <span className="hover:text-gray-900 transition-colors">Blog</span>
            <ChevronRight size={14} />
            <span
              style={{ color: primaryColor }}
              className="font-medium truncate max-w-[200px] sm:max-w-xs"
            >
              {currentBlog.title}
            </span>
          </div>

          {/* Article Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.2] break-words">
            {currentBlog.title}
          </h1>

          {/* Author, Date, Reading Time Meta */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-4 border-y border-gray-200/80 text-xs sm:text-sm text-[#475467]">
            {currentBlog.name && (
              <div className="flex items-center gap-2 font-medium text-[#1E293B]">
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                >
                  <User size={14} />
                </div>
                <span>{currentBlog.name}</span>
              </div>
            )}

            {currentBlog.date && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Calendar size={16} />
                <span>{currentBlog.date}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock size={16} />
              <span>{readingTime}</span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-600">
              <MessageSquare size={16} />
              <span>{comments.length} Komentar</span>
            </div>
          </div>

          {/* Featured Cover Image */}
          {formattedCoverImage && (
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 border border-gray-200/80 shadow-md">
              <Image
                src={formattedCoverImage}
                alt={currentBlog.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          )}

          {/* Article Body Content */}
          <div className="w-full bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-xs flex flex-col gap-6">
            <div className="prose prose-slate max-w-none text-[#334155] text-base sm:text-lg sm:leading-8 leading-relaxed whitespace-pre-line break-words font-normal">
              {currentBlog.content ? (
                currentBlog.content
              ) : (
                <p className="text-gray-400 italic">
                  Tidak ada konten teks untuk artikel ini.
                </p>
              )}
            </div>

              {/* Bottom Article Actions & Share */}
              <div className="pt-6 mt-4 border-t border-gray-200/80 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1E293B]">
                  <Sparkles size={16} style={{ color: primaryColor }} />
                  <span>Bagikan Artikel Ini ke Media Sosial:</span>
                </div>

                {/* Social Share Buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `*${currentBlog.title}*\n\n${shareExcerpt}\n\n${
                        typeof window !== "undefined" ? window.location.href : ""
                      }`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] active:scale-95 transition-all shadow-xs"
                    title="Bagikan ke WhatsApp"
                  >
                    <span>WhatsApp</span>
                  </a>

                  {/* Twitter / X */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `${currentBlog.title} - ${shareExcerpt}`
                    )}&url=${encodeURIComponent(
                      typeof window !== "undefined" ? window.location.href : ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 active:scale-95 transition-all shadow-xs"
                    title="Bagikan ke Twitter / X"
                  >
                    <span>Twitter / X</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      typeof window !== "undefined" ? window.location.href : ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/15 hover:bg-blue-600/25 text-blue-700 active:scale-95 transition-all shadow-xs"
                    title="Bagikan ke Facebook"
                  >
                    <Facebook size={14} />
                    <span>Facebook</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      typeof window !== "undefined" ? window.location.href : ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-700/15 hover:bg-blue-700/25 text-blue-800 active:scale-95 transition-all shadow-xs"
                    title="Bagikan ke LinkedIn"
                  >
                    <Linkedin size={14} />
                    <span>LinkedIn</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      typeof window !== "undefined" ? window.location.href : ""
                    )}&text=${encodeURIComponent(
                      `${currentBlog.title}\n\n${shareExcerpt}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-400/15 hover:bg-sky-400/25 text-sky-800 active:scale-95 transition-all shadow-xs"
                    title="Bagikan ke Telegram"
                  >
                    <Send size={13} />
                    <span>Telegram</span>
                  </a>

                  {/* Web Share / Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                    title="Salin tautan artikel"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Link Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink size={14} />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </article>

        {/* COMMENTS SECTION */}
        <section id="comments" className="mt-12 sm:mt-16 flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
              >
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                  Kolom Komentar
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {comments.length} komentar dari pembaca
                </p>
              </div>
            </div>
          </div>

          {/* Comment Submission Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">
              Tulis Komentar
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              Bagikan pendapat atau pertanyaan Anda seputar artikel ini
            </p>

            {submitSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-fade-in">
                <Check size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold">Komentar berhasil dikirim!</p>
                  <p className="text-xs text-emerald-700">
                    Terima kasih atas partisipasi Anda.
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmitComment}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-[#F8FAFC] border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Email{" "}
                    <span className="text-gray-400 font-normal">
                      (Opsional / Tidak akan dipublikasikan)
                    </span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full bg-[#F8FAFC] border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="comment"
                  className="text-xs font-semibold text-gray-700"
                >
                  Pesan Komentar <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="comment"
                  required
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tulis tanggapan atau komentar Anda di sini..."
                  className="w-full bg-[#F8FAFC] border border-gray-300 rounded-xl p-4 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none resize-y transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: primaryColor }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Kirim Komentar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          <div className="flex flex-col gap-4">
            {commentsLoading ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-sm">
                Memuat komentar...
              </div>
            ) : comments.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-gray-200/80 shadow-xs flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <p className="font-semibold text-gray-800 text-base">
                  Belum Ada Komentar
                </p>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
                  Jadilah orang pertama yang meninggalkan komentar pada artikel
                  ini!
                </p>
              </div>
            ) : (
              comments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex items-start gap-4 transition-all hover:border-gray-300"
                >
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                      item.name
                    )} text-white flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-xs`}
                  >
                    {item.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-[#0F172A]">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-[#334155] leading-relaxed whitespace-pre-line break-words mt-1">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Other Articles Recommendation */}
        {otherBlogs.length > 0 && (
          <section className="mt-16 sm:mt-24 pt-12 border-t border-gray-200/80 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">
                  Artikel Lainnya
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Jelajahi tulisan dan artikel menarik lainnya
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: primaryColor }}
              >
                <span>Lihat Semua</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otherBlogs.map((b) => {
                const img = formatGoogleDriveUrl(b.image, "");
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      router.push(`/blog/${b.id}`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="group bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
                  >
                    {img && (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100">
                        <Image
                          src={img}
                          alt={b.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {b.date && <span>{b.date}</span>}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                      {b.title}
                    </h3>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
