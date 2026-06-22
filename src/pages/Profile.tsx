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
  Plus,
  Pencil,
  Trash2,
  Star,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileProps {
  token: string;
}

interface Address {
  id: number;
  label: string;
  address: string;
  is_default: boolean;
}

export default function Profile({ token }: ProfileProps) {
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ── Data diri ───────────────────────────────────────────────
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  // ── Alamat ──────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrError, setAddrError] = useState("");
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [addrForm, setAddrForm] = useState({ label: "", address: "" });
  const [addrSaving, setAddrSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/user/addresses", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const pData = await pRes.json();
        const aData = await aRes.json();
        if (!active) return;

        if (pRes.ok && pData.success) {
          setForm({ name: pData.data.name || "", phone: pData.data.phone || "" });
          if (aRes.ok && aData.success) setAddresses(aData.data || []);
          setLoadState("ready");
        } else {
          setLoadState("error");
          setMessage(pData.error || "Gagal memuat profil.");
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

  // ── Data diri handlers ──────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForm({ name: data.data.name || "", phone: data.data.phone || "" });
        setSaveState("saved");
        setMessage("Data diri berhasil disimpan.");
      } else {
        setSaveState("error");
        setMessage(data.error || "Gagal menyimpan data diri.");
      }
    } catch {
      setSaveState("error");
      setMessage("Gagal terhubung ke server.");
    }
  };

  // ── Alamat handlers ─────────────────────────────────────────
  const openAdd = () => {
    setEditingId("new");
    setAddrForm({ label: "", address: "" });
    setAddrError("");
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setAddrForm({ label: a.label, address: a.address });
    setAddrError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddrError("");
  };

  const reloadAddresses = async () => {
    const res = await fetch("/api/user/addresses", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.success) setAddresses(data.data || []);
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrSaving(true);
    setAddrError("");
    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/user/addresses" : `/api/user/addresses/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: authHeaders,
        body: JSON.stringify(addrForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await reloadAddresses();
        setEditingId(null);
      } else {
        setAddrError(data.error || "Gagal menyimpan alamat.");
      }
    } catch {
      setAddrError("Gagal terhubung ke server.");
    } finally {
      setAddrSaving(false);
    }
  };

  const deleteAddress = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await reloadAddresses();
      } else {
        setAddrError(data.error || "Gagal menghapus alamat.");
      }
    } catch {
      setAddrError("Gagal terhubung ke server.");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const setDefault = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/user/addresses/${id}/default`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await reloadAddresses();
      } else {
        setAddrError(data.error || "Gagal mengatur alamat utama.");
      }
    } catch {
      setAddrError("Gagal terhubung ke server.");
    } finally {
      setBusyId(null);
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
              Simpan data diri & alamat agar tidak perlu mengisi ulang saat checkout.
            </p>
          </div>
        </div>

        {loadState === "loading" ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-500" />
            Memuat profil...
          </div>
        ) : loadState === "error" ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 dark:bg-red-950/30 dark:border-red-900">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── DATA DIRI ── */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
              <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-zinc-800">
                <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2 dark:text-zinc-100">
                  <User className="w-5 h-5 text-sky-500" /> Data Diri
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                <div>
                  <label className={labelClass}>
                    <User className="w-4 h-4 text-sky-500" /> Nama Lengkap
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
                <div>
                  <label className={labelClass}>
                    <Phone className="w-4 h-4 text-sky-500" /> Nomor WhatsApp
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

                {saveState === "saved" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3 dark:bg-green-950/30 dark:border-green-900"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">{message}</p>
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

                <motion.button
                  type="submit"
                  disabled={saveState === "saving"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-sky-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-sky-600 transition-all flex justify-center items-center gap-2 shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveState === "saving" ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Simpan Data Diri</>
                  )}
                </motion.button>
              </form>
            </div>

            {/* ── ALAMAT TERSIMPAN ── */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
              <div className="px-6 md:px-8 py-5 border-b border-slate-100 flex items-center justify-between dark:border-zinc-800">
                <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2 dark:text-zinc-100">
                  <MapPin className="w-5 h-5 text-sky-500" /> Alamat Tersimpan
                </h2>
                {editingId === null && (
                  <button
                    onClick={openAdd}
                    className="flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                )}
              </div>

              <div className="p-6 md:p-8 space-y-4">
                {addrError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 dark:bg-red-950/30 dark:border-red-900">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 dark:text-red-400" />
                    <p className="text-xs text-red-700 dark:text-red-300">{addrError}</p>
                  </div>
                )}

                {/* Form tambah/edit */}
                <AnimatePresence>
                  {editingId !== null && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={saveAddress}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl border-2 border-sky-200 bg-sky-50/50 space-y-3 dark:border-sky-900 dark:bg-sky-950/20">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 dark:text-zinc-400">
                            Label
                          </label>
                          <input
                            type="text"
                            required
                            value={addrForm.label}
                            onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                            className={inputClass}
                            placeholder="Mis. Rumah, Kantor"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 dark:text-zinc-400">
                            Alamat Lengkap
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={addrForm.address}
                            onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                            className={`${inputClass} resize-none`}
                            placeholder="Tuliskan alamat lengkap termasuk kota dan kode pos..."
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <motion.button
                            type="submit"
                            disabled={addrSaving}
                            whileTap={{ scale: 0.97 }}
                            className="flex-1 bg-sky-500 text-white font-semibold py-2.5 rounded-lg hover:bg-sky-600 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                          >
                            {addrSaving ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                            ) : (
                              <><Save className="w-4 h-4" /> Simpan Alamat</>
                            )}
                          </motion.button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-all dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Daftar alamat */}
                {addresses.length === 0 && editingId === null ? (
                  <div className="text-center py-8 text-slate-400 dark:text-zinc-500">
                    <Home className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Belum ada alamat tersimpan.</p>
                    <button
                      onClick={openAdd}
                      className="mt-3 text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                    >
                      + Tambah alamat pertama
                    </button>
                  </div>
                ) : (
                  addresses.map((a) => (
                    <div
                      key={a.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        a.is_default
                          ? "border-sky-300 bg-sky-50/40 dark:border-sky-800 dark:bg-sky-950/20"
                          : "border-slate-200 dark:border-zinc-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-zinc-100">{a.label}</span>
                            {a.is_default && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full dark:text-sky-300 dark:bg-sky-950/60">
                                <Star className="w-3 h-3 fill-current" /> Utama
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 whitespace-pre-line dark:text-zinc-400">{a.address}</p>
                        </div>
                      </div>

                      {confirmDeleteId === a.id ? (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <span className="text-red-600 font-medium dark:text-red-400">Hapus alamat ini?</span>
                          <button
                            onClick={() => deleteAddress(a.id)}
                            disabled={busyId === a.id}
                            className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                          >
                            {busyId === a.id ? "..." : "Ya, hapus"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-1 flex-wrap">
                          {!a.is_default && (
                            <button
                              onClick={() => setDefault(a.id)}
                              disabled={busyId === a.id}
                              className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 dark:text-sky-400 dark:hover:bg-zinc-800"
                            >
                              <Star className="w-3.5 h-3.5" /> Jadikan Utama
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(a)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(a.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
