import React, { useState } from "react";
import { Lock, User, Loader2, ArrowLeft, Wind } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLoginSuccess: (token: string, role: "admin" | "user" | "teknisi") => void;
  onBack: () => void;
}

export default function Login({ onLoginSuccess, onBack }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { username, password }
        : { username, password, name };

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
        setErrorMessage(
          data.error || (isLogin ? "Login gagal." : "Registrasi gagal."),
        );
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Gagal terhubung ke server.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="max-w-md w-full"
      >
        <button
          onClick={onBack}
          className="flex items-center text-white/80 hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Kembali
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-sky-600 to-sky-400 px-8 pt-10 pb-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wind className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {isLogin ? "Selamat Datang" : "Buat Akun Baru"}
              </h2>
              <p className="text-sky-100 text-sm">
                {isLogin
                  ? "Masuk untuk mengakses layanan HDB Airconds"
                  : "Daftarkan diri Anda untuk mulai menggunakan layanan kami"}
              </p>
            </div>
          </div>

          {/* Toggle tabs */}
          <div className="flex border-b border-slate-100 -mt-1">
            <button
              onClick={() => { setIsLogin(true); setErrorMessage(""); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${isLogin ? "text-sky-600 border-b-2 border-sky-500" : "text-slate-500 hover:text-slate-700"}`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsLogin(false); setErrorMessage(""); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${!isLogin ? "text-sky-600 border-b-2 border-sky-500" : "text-slate-500 hover:text-slate-700"}`}
            >
              Daftar
            </button>
          </div>

          <div className="p-8">
            {status === "error" && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-sky-500 text-white font-bold py-3.5 rounded-xl hover:bg-sky-600 transition-all flex justify-center items-center gap-2 disabled:opacity-70 shadow-lg shadow-sky-500/30 mt-2"
              >
                {status === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  "Masuk"
                ) : (
                  "Daftar Sekarang"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
              <button
                onClick={() => { setIsLogin(!isLogin); setErrorMessage(""); }}
                className="text-sky-600 font-semibold hover:underline"
              >
                {isLogin ? "Daftar di sini" : "Masuk di sini"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
