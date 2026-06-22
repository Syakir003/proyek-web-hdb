import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  UserCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface ProfileProps {
  token: string;
}

export default function Profile({ token }: ProfileProps) {
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  // Selalu baca data terbaru dari server saat halaman dibuka (data users bisa
  // diubah dari luar, mis. aplikasi admin Android yang berbagi DB).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.success) {
          setForm({
            name: data.data.name || "",
            phone: data.data.phone || "",
            address: data.data.address || "",
          });
          setLoadState("ready");
        } else {
          setLoadState("error");
          setMessage(data.error || "Gagal memuat profil.");
        }
      } catch {
        if (!active) return;
        setLoadState("error");
        setMessage("Gagal terhubung ke server.");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (saveState !== "idle") setSaveState("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState("saving");
    setMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForm({
          name: data.data.name || "",
          phone: data.data.phone || "",
          address: data.data.address || "",
        });
        setSaveState("saved");
        setMessage("Profil berhasil disimpan.");
      } else {
        setSaveState("error");
        setMessage(data.error || "Gagal menyimpan profil.");
      }
    } catch {
      setSaveState("error");
      setMessage("Gagal terhubung ke server.");
    }
  };

  const inputClass =
    "w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all placeholder-slate-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500";
  const labelClass =
    "block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 dark:text-zinc-100";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-slate-50 min-h-screen py-12 dark:bg-zinc-950"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center dark:bg-sky-950/50">
            <UserCircle className="w-7 h-7 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-100">
              Profil Saya
            </h1>
            <p className="text-slate-600 text-sm dark:text-zinc-400">
              Simpan data diri Anda agar tidak perlu mengisi ulang saat checkout.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          {loadState === "loading" ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-500" />
              Memuat profil...
            </div>
          ) : loadState === "error" ? (
            <div className="p-8">
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 dark:bg-red-950/30 dark:border-red-900">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {/* Nama */}
              <div>
                <label className={labelClass}>
                  <User className="w-4 h-4 text-sky-500" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className={labelClass}>
                  <Phone className="w-4 h-4 text-sky-500" />
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0812xxxx"
                />
                <p className="text-xs text-slate-500 mt-2 dark:text-zinc-400">
                  Dipakai untuk komunikasi pesanan Anda.
                </p>
              </div>

              {/* Alamat */}
              <div>
                <label className={labelClass}>
                  <MapPin className="w-4 h-4 text-sky-500" />
                  Alamat
                </label>
                <textarea
                  name="address"
                  rows={4}
                  value={form.address}
                  onChange={handleChange}
                  className={`${inputClass} resize-none`}
                  placeholder="Tuliskan alamat lengkap termasuk kota dan kode pos..."
                />
              </div>

              {/* Feedback */}
              {saveState === "saved" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3 dark:bg-green-950/30 dark:border-green-900"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    {message}
                  </p>
                </motion.div>
              )}
              {saveState === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 dark:bg-red-950/30 dark:border-red-900"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
                </motion.div>
              )}

              {/* Save */}
              <div className="pt-2">
                <motion.button
                  type="submit"
                  disabled={saveState === "saving"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-sky-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-sky-600 transition-all flex justify-center items-center gap-2 shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveState === "saving" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Simpan Profil
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
