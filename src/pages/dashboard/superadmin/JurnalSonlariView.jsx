import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBook, FaSearch, FaSync, FaChevronLeft, FaChevronRight,
  FaCalendarAlt, FaHashtag, FaFileAlt,
  FaEye, FaArrowLeft, FaSave, FaTrash,
} from "react-icons/fa";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { toast } from "react-toastify";

function formatDate(str) {
  if (!str) return "—";
  try {
    const d = new Date(str);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return str;
  }
}

// ─── Edit / Delete panel ─────────────────────────────────────────────────────
function JurnalSonEditPanel({ jurnalId, onBack, onDone, refreshAccessToken }) {
  const EMPTY = {
    title: "", description: "", nashr_sanasi: "", volume: "",
    issue: "", year: "", views_count: "", faol: false,
  };
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!jurnalId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
        const res = await fetchWithAuth(
          `${base}/admin/jurnal-sonlari/${jurnalId}/`,
          { method: "GET" },
          getAccessToken,
          refreshAccessToken
        );
        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
        if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));
        if (!cancelled && json) {
          setForm({
            title: json.title ?? "",
            description: json.description ?? "",
            nashr_sanasi: json.date ?? json.nashr_sanasi ?? "",
            volume: json.volume != null ? String(json.volume) : "",
            issue: json.issue != null ? String(json.issue) : "",
            year: json.year != null ? String(json.year) : "",
            views_count: json.views_count != null ? String(json.views_count) : "",
            faol: !!json.faol,
          });
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Jurnal sonini yuklashda xatolik");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [jurnalId, refreshAccessToken]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Sarlavha majburiy";
    if (!form.year) newErrors.year = "Yil majburiy";
    if (!form.volume) newErrors.volume = "Volume majburiy";
    if (!form.issue) newErrors.issue = "Issue majburiy";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    try {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      const formData = new FormData();
      formData.append("title", form.title.trim());
      if (form.description.trim()) formData.append("description", form.description.trim());
      if (form.nashr_sanasi) formData.append("date", form.nashr_sanasi);
      formData.append("volume", form.volume);
      formData.append("issue", form.issue);
      formData.append("year", form.year);
      if (form.views_count !== "") formData.append("views_count", form.views_count);
      formData.append("faol", form.faol ? "true" : "false");
      if (imageFile) formData.append("image", imageFile);
      if (pdfFile) formData.append("pdfUrl", pdfFile);

      const res = await fetchWithAuth(
        `${base}/admin/jurnal-sonlari/${jurnalId}/`,
        { method: "PATCH", body: formData },
        getAccessToken,
        refreshAccessToken
      );
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));
      toast.success("Jurnal soni muvaffaqiyatli yangilandi!");
      onDone();
    } catch (err) {
      toast.error(err.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      const res = await fetchWithAuth(
        `${base}/admin/jurnal-sonlari/${jurnalId}/`,
        { method: "DELETE" },
        getAccessToken,
        refreshAccessToken
      );
      if (!res.ok) {
        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
        throw new Error(parseApiError(json, `${res.status}`));
      }
      toast.success("Jurnal soni o'chirildi!");
      onDone();
    } catch (err) {
      toast.error(err.message || "O'chirishda xatolik");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
        <span className="loading loading-spinner loading-lg text-blue-500" />
        <p className="mt-3 text-sm font-semibold text-slate-400">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Ro'yxatga qaytish
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Boshqaruv</p>
          <h2 className="mt-0.5 text-2xl font-black text-slate-950">Jurnal sonini tahrirlash</h2>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave}>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <FaBook className="text-blue-500" />
              <h3 className="text-base font-black text-slate-900">Ma'lumotlarni tahrirlang</h3>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Sarlavha <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange}
                placeholder="Jurnal soni sarlavhasi"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  errors.title ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-blue-400"
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Image */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Muqova rasmi (yangi)
              </label>
              <input
                type="file" accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-blue-700"
              />
            </div>

            {/* PDF */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                PDF fayl (yangi)
              </label>
              <input
                type="file" accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-blue-700"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Tavsif
              </label>
              <textarea
                name="description" value={form.description} onChange={handleChange}
                rows={3} placeholder="Qisqacha tavsif..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Nashr sanasi */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Nashr sanasi
              </label>
              <input
                type="date" name="nashr_sanasi" value={form.nashr_sanasi} onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Volume raqami <span className="text-red-500">*</span>
              </label>
              <input
                type="number" name="volume" value={form.volume} onChange={handleChange} min="1"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  errors.volume ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-blue-400"
                }`}
              />
              {errors.volume && <p className="mt-1 text-xs text-red-500">{errors.volume}</p>}
            </div>

            {/* Issue */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Issue raqami <span className="text-red-500">*</span>
              </label>
              <input
                type="number" name="issue" value={form.issue} onChange={handleChange} min="1"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  errors.issue ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-blue-400"
                }`}
              />
              {errors.issue && <p className="mt-1 text-xs text-red-500">{errors.issue}</p>}
            </div>

            {/* Yil */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Yil <span className="text-red-500">*</span>
              </label>
              <input
                type="number" name="year" value={form.year} onChange={handleChange}
                min="2000" max="2100"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  errors.year ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-blue-400"
                }`}
              />
              {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
            </div>

            {/* Ko'rishlar soni */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Ko'rishlar soni
              </label>
              <input
                type="number" name="views_count" value={form.views_count} onChange={handleChange} min="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Faol */}
            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox" id="editFaol" name="faol"
                checked={form.faol} onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
              />
              <label htmlFor="editFaol" className="cursor-pointer text-sm font-semibold text-slate-700">
                Faol (aktiv holat)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            {/* Delete */}
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-600">O'chirishni tasdiqlaysizmi?</span>
                  <button
                    type="button" onClick={handleDelete} disabled={deleting}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? <span className="loading loading-spinner loading-xs" /> : "Ha, o'chirish"}
                  </button>
                  <button
                    type="button" onClick={() => setConfirmDelete(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Bekor
                  </button>
                </div>
              ) : (
                <button
                  type="button" onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  <FaTrash className="text-xs" />
                  O'chirish
                </button>
              )}
            </div>
            {/* Save */}
            <div className="flex items-center gap-3">
              <button
                type="button" onClick={onBack}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit" disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? <span className="loading loading-spinner loading-xs" /> : <FaSave className="text-xs" />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function JurnalSonlariView({ onAddNew }) {
  const navigate = useNavigate();
  const { refresh: refreshAccessToken } = useContext(AuthContext);

  const [jurnallar, setJurnallar] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      const res = await fetchWithAuth(
        `${base}/admin/jurnal-sonlari/`,
        { method: "GET" },
        getAccessToken,
        refreshAccessToken
      );
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.results)
          ? json.results
          : [];
      setJurnallar(list);
    } catch (err) {
      setError(err.message || "Jurnal sonlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [refreshAccessToken]);

  useEffect(() => { load(); }, [load]);

  const filtered = jurnallar.filter((j) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const title = (j.title || "").toLowerCase();
    const volume = String(j.volume ?? "").toLowerCase();
    const issue = String(j.issue ?? "").toLowerCase();
    const year = String(j.year ?? "").toLowerCase();
    return title.includes(q) || volume.includes(q) || issue.includes(q) || year.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  if (editingId !== null) {
    return (
      <JurnalSonEditPanel
        jurnalId={editingId}
        onBack={() => setEditingId(null)}
        onDone={() => { setEditingId(null); load(); }}
        refreshAccessToken={refreshAccessToken}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Boshqaruv</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Jurnal sonlari</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (onAddNew ? onAddNew() : navigate("/admin/jurnal-son-qoshish"))}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
          >
            + Yangi qo'shish
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            Yangilash
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
        <input
          type="text"
          placeholder="Nom, son yoki yil bo'yicha qidirish..."
          value={search}
          onChange={handleSearch}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <span className="loading loading-spinner loading-lg text-blue-500" />
          <p className="mt-3 text-sm font-semibold text-slate-400">Yuklanmoqda...</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBook className="text-blue-500" />
                <h3 className="text-base font-black text-slate-900">Barcha jurnal sonlari</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                {filtered.length} ta
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 font-semibold">
              Jurnal soni topilmadi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 text-left">#</th>
                    <th className="px-5 py-3 text-left">Sarlavha</th>
                    <th className="px-5 py-3 text-left">Volume</th>
                    <th className="px-5 py-3 text-left">Son (Issue)</th>
                    <th className="px-5 py-3 text-left">Yil</th>
                    <th className="px-5 py-3 text-left">Ko'rishlar</th>
                    <th className="px-5 py-3 text-left">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((j, idx) => (
                    <tr
                      key={j.id ?? idx}
                      onClick={() => j.id != null && setEditingId(j.id)}
                      className="cursor-pointer transition hover:bg-blue-50/60"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="max-w-xs px-5 py-3.5">
                        <p className="font-semibold text-blue-700 leading-snug underline-offset-2 hover:underline">
                          {j.title || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <FaBook className="text-[10px] text-slate-400" />
                          <span className="font-semibold text-slate-700">{j.volume ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <FaHashtag className="text-[10px] text-slate-400" />
                          <span className="text-slate-700">{j.issue ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{j.year ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <FaEye className="text-[10px] text-slate-400" />
                          <span className="text-slate-600">{j.views ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <FaCalendarAlt className="text-[9px]" />
                          {formatDate(j.date)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                <span className="text-xs font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
