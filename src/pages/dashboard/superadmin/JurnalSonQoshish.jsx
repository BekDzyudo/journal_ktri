import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBook, FaSave } from "react-icons/fa";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { toast } from "react-toastify";

const INITIAL = {
  title: "",
  description: "",
  nashr_sanasi: "",
  volume: "",
  issue: "",
  year: "",
  faol: false,
};

export default function JurnalSonQoshish() {
  const navigate = useNavigate();
  const { refresh: refreshAccessToken } = useContext(AuthContext);

  const [form, setForm] = useState(INITIAL);
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Sarlavha majburiy";
    if (!form.year) newErrors.year = "Yil majburiy";
    if (!form.volume) newErrors.volume = "Volume majburiy";
    if (!form.issue) newErrors.issue = "Issue majburiy";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      const formData = new FormData();
      formData.append("title", form.title.trim());
      if (form.description.trim()) formData.append("description", form.description.trim());
      if (form.nashr_sanasi) formData.append("date", form.nashr_sanasi);
      formData.append("volume", form.volume);
      formData.append("issue", form.issue);
      formData.append("year", form.year);
      formData.append("faol", form.faol ? "true" : "false");
      if (imageFile) formData.append("image", imageFile);
      if (pdfFile) formData.append("pdfUrl", pdfFile);

      const res = await fetchWithAuth(
        `${base}/admin/jurnal-sonlari/`,
        { method: "POST", body: formData },
        getAccessToken,
        refreshAccessToken
      );
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (res.ok) {
        toast.success("Jurnal soni muvaffaqiyatli qo'shildi!");
        navigate("/profile", { state: { activeTab: "jurnal-sonlar" } });
      } else {
        throw new Error(parseApiError(json, `${res.status}`));
      }
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Orqaga
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Boshqaruv</p>
          <h2 className="mt-0.5 text-2xl font-black text-slate-950">Yangi jurnal soni</h2>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <FaBook className="text-blue-500" />
              <h3 className="text-base font-black text-slate-900">Ma'lumotlarni kiriting</h3>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Sarlavha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
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
                Muqova rasmi
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-blue-700"
              />
            </div>

            {/* PDF */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                PDF fayl
              </label>
              <input
                type="file"
                accept="application/pdf"
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
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Qisqacha tavsif..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Nashr sanasi */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Nashr sanasi
              </label>
              <input
                type="date"
                name="nashr_sanasi"
                value={form.nashr_sanasi}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Volume raqami <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="volume"
                value={form.volume}
                onChange={handleChange}
                min="1"
                placeholder="Masalan: 2"
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
                type="number"
                name="issue"
                value={form.issue}
                onChange={handleChange}
                min="1"
                placeholder="Masalan: 1"
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
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                min="2000"
                max="2100"
                placeholder="Masalan: 2026"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  errors.year ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-blue-400"
                }`}
              />
              {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
            </div>

            {/* Faol */}
            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                id="faol"
                name="faol"
                checked={form.faol}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
              />
              <label htmlFor="faol" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Faol (aktiv holat)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <FaSave className="text-xs" />
              )}
              Saqlash
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
