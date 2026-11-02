"use client";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

export default function AdminLogin() {
  const router = useRouter();
  const { content } = useAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showBlank, setShowBlank] = useState(true);

  // Dynamic colors from theme
  const primaryColor = content?.colors?.primary || "#FD853A";
  const darkBg = content?.colors?.dark || "#171717";
  const textLight = content?.colors?.textLight || "#98A2B3";
  const logoText = content?.navbar?.logoText || content?.hero?.name || "JC";
  const logoInitials = logoText ? logoText.substring(0, 2).toUpperCase() : "JC";

  useEffect(() => {
    // Show clean blank white screen for a split millisecond on refresh
    const timer = setTimeout(() => {
      setShowBlank(false);
    }, 200);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/admin");
      } else {
        setCheckingAuth(false);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Email atau password salah. Silakan coba lagi.";
      if (errorMessage.includes("auth/invalid-credential") || errorMessage.includes("auth/wrong-password") || errorMessage.includes("auth/user-not-found")) {
        setError("Email atau password salah. Silakan periksa kembali akun Anda.");
      } else {
        setError("Gagal masuk: " + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Requirement 2: Clean white screen for a split millisecond on refresh
  if (checkingAuth || showBlank) {
    return <div className="min-h-screen bg-white w-full" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 transition-colors" style={{ backgroundColor: darkBg }}>
      <div className="w-full max-w-md bg-[#1f1f1f] rounded-[24px] p-8 border border-[#333] shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-lg transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-white text-xl font-bold">{logoInitials}</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Admin Panel Login</h1>
          <p className="text-sm mt-1 text-center" style={{ color: textLight }}>
            Masuk untuk mengelola seluruh teks, gambar, dan warna website
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#D0D5DD] text-sm font-medium">Email Admin</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full h-[48px] bg-[#2a2a2a] border border-[#444] rounded-[12px] px-4 text-white placeholder:text-[#667085] outline-none transition-colors"
              style={{ caretColor: primaryColor }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#D0D5DD] text-sm font-medium">Password</label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-[48px] bg-[#2a2a2a] border border-[#444] rounded-[12px] pl-4 pr-12 text-white placeholder:text-[#667085] outline-none transition-colors"
                style={{ caretColor: primaryColor }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-white transition-colors cursor-pointer p-1"
                title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-[10px]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] text-white font-semibold rounded-[12px] transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              "Masuk ke Dashboard"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

