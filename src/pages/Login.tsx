import React, { useState } from "react";
import { Lock, User, Loader2, ArrowLeft, Mail } from "lucide-react";
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
      className="fixed inset-0 z-50 bg-blue-50/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Kembali ke Beranda
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="p-8 bg-blue-600 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? "Login" : "Daftar Akun"}
            </h2>
            <p className="text-blue-100 text-sm">
              {isLogin
                ? "Masuk untuk mengakses layanan HDB Airconds"
                : "Buat akun baru untuk mulai menggunakan layanan HDB Airconds"}
            </p>
          </div>

          <div className="p-8">
            {status === "error" && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-blue-100 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-blue-100 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-blue-100 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center disabled:opacity-70 shadow-md"
              >
                {status === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  "Masuk"
                ) : (
                  "Daftar"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              {isLogin ? (
                <p>
                  Belum punya akun?{" "}
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setErrorMessage("");
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Daftar di sini
                  </button>
                </p>
              ) : (
                <p>
                  Sudah punya akun?{" "}
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setErrorMessage("");
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Masuk di sini
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
