import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Trash2, Edit, X, Users, UploadCloud, Eye, EyeOff } from "lucide-react";

const POSITIONS = [
  { value: "founder",        label: "Founder" },
  { value: "admin",          label: "Admin" },
  { value: "kepala_teknisi", label: "Kepala Teknisi" },
  { value: "teknisi",        label: "Teknisi" },
  { value: "lainnya",        label: "Lainnya" },
];

const positionBadge: Record<string, string> = {
  founder:        "bg-amber-100 text-amber-700",
  admin:          "bg-blue-100 text-blue-700",
  kepala_teknisi: "bg-sky-100 text-sky-700",
  teknisi:        "bg-emerald-100 text-emerald-700",
  lainnya:        "bg-slate-100 text-slate-600",
};

const emptyForm = {
  name: "", position: "teknisi", role_label: "", bio: "", phone: "", sort_order: "0",
};

export default function AdminTeam({ token }: { token: string }) {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTeam(data.data);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setImageFile(null);
    setImagePreview(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (member: any) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      position: member.position,
      role_label: member.role_label,
      bio: member.bio || "",
      phone: member.phone || "",
      sort_order: String(member.sort_order ?? 0),
    });
    setImageFile(null);
    setImagePreview(member.image || null);
    setError("");
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append("image", imageFile);

      const url = editingId ? `/api/admin/team/${editingId}` : "/api/admin/team";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!data.success) throw new Error("Gagal menyimpan");
      setShowModal(false);
      fetchTeam();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus anggota tim "${name}"?`)) return;
    await fetch(`/api/admin/team/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchTeam();
  };

  const toggleActive = async (member: any) => {
    const fd = new FormData();
    Object.entries({
      name: member.name, position: member.position, role_label: member.role_label,
      bio: member.bio || "", phone: member.phone || "",
      sort_order: String(member.sort_order ?? 0), is_active: member.is_active ? "0" : "1",
    }).forEach(([k, v]) => fd.append(k, v));
    await fetch(`/api/admin/team/${member.id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: fd });
    fetchTeam();
  };

  const filtered = team.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role_label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Kelola Tim</h2>
            <p className="text-slate-400 text-sm">{team.length} anggota terdaftar</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <button
            onClick={openAdd}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors text-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-6 mt-4 mb-2 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-sm text-sky-700 flex items-start gap-2">
        <span className="text-sky-400 font-bold shrink-0">ℹ</span>
        Halaman "Tentang Kami" hanya menampilkan posisi <strong>Founder</strong>, <strong>Admin</strong>, dan <strong>Kepala Teknisi</strong> yang berstatus aktif.
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-3 font-medium">Anggota</th>
              <th className="px-6 py-3 font-medium">Posisi</th>
              <th className="px-6 py-3 font-medium">No. HP</th>
              <th className="px-6 py-3 font-medium">Urutan</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400 text-sm">Memuat data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400 text-sm">Belum ada anggota tim.</td></tr>
            ) : filtered.map((member) => (
              <tr key={member.id} className={`hover:bg-slate-50 transition-colors ${!member.is_active ? "opacity-50" : ""}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-sky-400 to-sky-600 flex-shrink-0">
                      {member.image
                        ? <img src={member.image} alt={member.name} className="w-full h-full object-cover object-top" />
                        : <span className="w-full h-full flex items-center justify-center text-white font-bold text-base">
                            {member.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                          </span>
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{member.name}</div>
                      <div className="text-slate-400 text-xs">{member.role_label}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${positionBadge[member.position] ?? positionBadge.lainnya}`}>
                    {POSITIONS.find((p) => p.value === member.position)?.label ?? member.position}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{member.phone || "-"}</td>
                <td className="px-6 py-4 text-sm text-slate-600 text-center">{member.sort_order}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(member)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                      member.is_active
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {member.is_active ? <><Eye className="w-3 h-3" /> Aktif</> : <><EyeOff className="w-3 h-3" /> Nonaktif</>}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEdit(member)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(member.id, member.name)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Anggota Tim" : "Tambah Anggota Tim"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Foto</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-sky-400 to-sky-600 flex-shrink-0">
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                          {form.name ? form.name.split(" ").map((w) => w[0]).slice(0, 2).join("") : "?"}
                        </span>
                    }
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {imagePreview ? "Ganti Foto" : "Upload Foto"}
                    </button>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG. Maks 2MB.</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Posisi <span className="text-red-500">*</span></label>
                  <select required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                    {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Urutan Tampil</label>
                  <input type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul Jabatan <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="mis: Founder & Pemilik" value={form.role_label}
                    onChange={(e) => setForm({ ...form, role_label: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. HP</label>
                  <input type="text" placeholder="08xx..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio Singkat</label>
                <textarea rows={3} placeholder="Deskripsi singkat tentang anggota tim..." value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors disabled:opacity-60">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
