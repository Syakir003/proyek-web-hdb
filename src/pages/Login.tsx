import React, { useState } from "react";
import { Lock, User, Loader2, ArrowLeft, Eye, EyeOff, Users, Award, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginProps {
  onLoginSuccess: (token: string, role: "admin" | "user" | "teknisi") => void;
  onBack: () => void;
}

const particles = [
  { x: "10%",  y: "16%", size: 3, delay: 0    },
  { x: "80%",  y: "28%", size: 4, delay: 0.9  },
  { x: "20%",  y: "70%", size: 3, delay: 1.5  },
  { x: "70%",  y: "80%", size: 5, delay: 0.3  },
  { x: "50%",  y: "10%", size: 3, delay: 1.9  },
  { x: "90%",  y: "55%", size: 4, delay: 0.7  },
  { x: "6%",   y: "48%", size: 3, delay: 1.2  },
  { x: "38%",  y: "92%", size: 4, delay: 2.1  },
  { x: "92%",  y: "18%", size: 3, delay: 0.5  },
  { x: "60%",  y: "45%", size: 2, delay: 1.7  },
];

const trustBadges = [
  { icon: Users, label: "5.000+ Pelanggan Puas" },
  { icon: Award, label: "10+ Tahun Pengalaman" },
  { icon: Clock, label: "Layanan Darurat 24/7" },
];

export default function Login({ onLoginSuccess, onBack }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin ? { username, password } : { username, password, name };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.token, data.role);
      } else {
        setStatus("error");
        setErrorMessage(data.error || (isLogin ? "Login gagal." : "Registrasi gagal."));
      }
    } catch {
      setStatus("error");
      setErrorMessage("Gagal terhubung ke server.");
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setErrorMessage("");
    setStatus("idle");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 28 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[860px] rounded-3xl overflow-hidden shadow-[0_40px_100px_-12px_rgba(0,0,0,0.7)] flex"
        style={{ minHeight: 540 }}
      >
        {/* ── LEFT PANEL — Atmospheric Dark ── */}
        <div
          className="hidden md:flex flex-col justify-between relative w-[44%] flex-shrink-0 overflow-hidden"
          style={{ background: "linear-gradient(150deg, #0b1623 0%, #0f2237 55%, #0c1d30 100%)" }}
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(14,165,233,0.045) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14,165,233,0.045) 1px, transparent 1px)
              `,
              backgroundSize: "44px 44px",
            }}
          />

          {/* Giant word watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" aria-hidden>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 148,
                fontWeight: 700,
                fontStyle: "italic",
                color: "rgba(14,165,233,0.045)",
                letterSpacing: "0.04em",
                transform: "rotate(-18deg) translateY(20%)",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}
            >
              SEJUK
            </span>
          </div>

          {/* Central glow orb */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)",
              left: "50%",
              top: "42%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Floating particles */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                background: "rgba(125,211,252,0.7)",
                boxShadow: "0 0 10px 2px rgba(14,165,233,0.35)",
              }}
              animate={{ y: [0, -14, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 3.2 + i * 0.35, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
            />
          ))}

          {/* Back button */}
          <div className="relative z-10 p-7 pt-8">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sky-400/60 hover:text-sky-300 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
          </div>

          {/* Brand section */}
          <div className="relative z-10 px-8 flex flex-col items-start gap-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(14,165,233,0.12)",
                border: "1px solid rgba(14,165,233,0.22)",
                boxShadow: "0 0 24px rgba(14,165,233,0.15)",
              }}
            >
              <img src="/images/HDB-LOGO.png" alt="HDB Airconds" className="w-11 h-11 object-contain" />
            </motion.div>

            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 38 }}
                className="text-white font-bold leading-tight mb-2"
              >
                HDB Airconds
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="text-sky-300/60 text-sm leading-relaxed max-w-[190px]"
              >
                Solusi AC terpercaya untuk hunian & bisnis Anda sejak 2014.
              </motion.p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="relative z-10 p-8 pb-10 space-y-3">
            {trustBadges.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(14,165,233,0.14)", border: "1px solid rgba(14,165,233,0.2)" }}
                >
                  <Icon className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <span className="text-slate-400 text-xs font-medium">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL — Form ── */}
        <div className="flex-1 bg-white flex flex-col">
          {/* Mobile back button */}
          <div className="md:hidden px-6 pt-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-10">

            {/* Tab toggle */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mb-7"
            >
              <div className="inline-flex p-1 rounded-xl bg-slate-100 mb-6">
                {(["Masuk", "Daftar"] as const).map((label, i) => {
                  const active = i === 0 ? isLogin : !isLogin;
                  return (
                    <button
                      key={label}
                      onClick={() => switchMode(i === 0)}
                      className={`relative px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                        active ? "text-white" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="login-tab-pill"
                          className="absolute inset-0 rounded-lg bg-sky-500 shadow-md shadow-sky-500/30"
                          transition={{ type: "spring", bounce: 0.22, duration: 0.38 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "t-login" : "t-register"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                    {isLogin ? "Selamat datang\nkembali" : "Buat akun baru"}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1.5">
                    {isLogin
                      ? "Masuk untuk mengakses layanan HDB Airconds"
                      : "Daftarkan diri untuk memesan layanan AC terbaik"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                    {errorMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence initial={false}>
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-0.5">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          required={!isLogin}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama kamu"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/70 transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username kamu"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/70 transition-all"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.27, duration: 0.3 }}
              >
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/70 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                type="submit"
                disabled={status === "loading"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.3 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all mt-2"
                style={{
                  background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                  boxShadow: "0 8px 24px -4px rgba(14,165,233,0.4)",
                }}
              >
                {status === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                ) : isLogin ? "Masuk ke Akun" : "Buat Akun Sekarang"}
              </motion.button>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-5 text-center text-xs text-slate-400"
            >
              {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
              <button
                onClick={() => switchMode(!isLogin)}
                className="text-sky-600 font-semibold hover:text-sky-700 transition-colors"
              >
                {isLogin ? "Daftar di sini" : "Masuk di sini"}
              </button>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
