import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaNewspaper, FaSave, FaUser, FaTimes, FaFileAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import useRuknlar from "../../../hooks/useRuknlar.jsx";

const INITIAL_AUTHOR = {
  fullName: "",
  phone: "",
  email: "",
  workplace: "",
  position: "",
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

export default function MaqolaQoshish({ onBack, onSuccess }) {
  const navigate = useNavigate();
  const { refresh: refreshAccessToken } = useContext(AuthContext);
  const { ruknlar, isPending: ruknlarLoading, error: ruknlarError } = useRuknlar();

  const handleBack = () => (onBack ? onBack() : navigate(-1));

  const [category, setCategory] = useState("");
  const [sarlavha, setSarlavha] = useState("");
  const [kalitSozlar, setKalitSozlar] = useState("");
  const [annotatsiya, setAnnotatsiya] = useState("");
  const [adabiyotlar, setAdabiyotlar] = useState("");
  const [authors, setAuthors] = useState([{ ...INITIAL_AUTHOR }]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const setAuthor = (index, field, value) => {
    setAuthors((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
    setErrors((prev) => ({ ...prev, [`a${index}_${field}`]: "" }));
  };

  const addAuthor = () => setAuthors((prev) => [...prev, { ...INITIAL_AUTHOR }]);
  const removeAuthor = (index) => {
    setAuthors((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ ...INITIAL_AUTHOR }];
    });
  };

  const validate = () => {
    const e = {};
    if (!category) e.category = "Ruknni tanlang";
    if (!sarlavha.trim()) e.sarlavha = "Sarlavha majburiy";
    if (!kalitSozlar.trim()) e.kalit = "Kalit so'zlar majburiy";
    if (!annotatsiya.trim()) e.annotatsiya = "Annotatsiya majburiy";
    authors.forEach((a, i) => {
      if (!a.fullName.trim()) e[`a${i}_name`] = "F.I.Sh";
      if (!a.phone.trim()) e[`a${i}_phone`] = "Telefon";
      if (!a.email.trim()) e[`a${i}_email`] = "Email";
      else if (!/\S+@\S+\.\S+/.test(a.email)) e[`a${i}_email`] = "Email formati";
      if (!a.workplace.trim()) e[`a${i}_work`] = "Tashkilot";
      if (!a.position.trim()) e[`a${i}_pos`] = "Lavozim";
    });
    if (!file) e.file = "Maqola faylini yuklang (.doc / .docx)";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      toast.error("Iltimos, majburiy maydonlarni to'ldiring.");
      return;
    }

    const rukn = parseInt(category, 10);
    const validIds = new Set(ruknlar.map((r) => r.id));
    if (!Number.isFinite(rukn) || !validIds.has(rukn)) {
      toast.error("Ruknni tanlang.");
      return;
    }

    setLoading(true);
    try {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      const fd = new FormData();
      fd.append("sarlavha", sarlavha.trim());
      fd.append("rukn", String(rukn));
      fd.append("kalit_sozlar", kalitSozlar.trim());
      fd.append("annotatsiya", annotatsiya.trim());
      if (adabiyotlar.trim()) fd.append("adabiyotlar", adabiyotlar.trim());
      fd.append("fayl", file, file.name);

      const mualliflar = authors.map((a, i) => ({
        tartib: i,
        ism_familya: a.fullName.trim(),
        telefon: a.phone.trim(),
        email: a.email.trim(),
        tashkilot: a.workplace.trim(),
        lavozim: a.position.trim(),
      }));
      fd.append("mualliflar", JSON.stringify(mualliflar));

      const res = await fetchWithAuth(
        `${base}/admin/maqolalar/`,
        { method: "POST", body: fd },
        getAccessToken,
        refreshAccessToken
      );
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));

      toast.success("Maqola qo'shildi!");
      if (onSuccess) onSuccess();
      else navigate("/profile", { state: { activeTab: "maqolalar" } });
    } catch (err) {
      toast.error(err.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${onBack ? "py-6" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Orqaga
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Boshqaruv</p>
          <h2 className="mt-0.5 text-2xl font-black text-slate-950">Yangi maqola</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <FaNewspaper className="text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">Ma'lumotlarni kiriting</h3>
            </div>
          </div>

          <div className="grid gap-5 p-6">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Rukn <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setErrors((x) => ({ ...x, category: "" }));
                }}
                disabled={ruknlarLoading || !!ruknlarError}
                className={`${inputCls} ${errors.category ? "border-red-300 bg-red-50" : ""}`}
              >
                <option value="">Tanlang</option>
                {ruknlar.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.kod ? `${r.kod} — ` : ""}{r.nom}
                  </option>
                ))}
              </select>
              {ruknlarError && (
                <p className="mt-1 text-xs text-amber-600">Ruknlarni yuklashda xatolik</p>
              )}
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Sarlavha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sarlavha}
                onChange={(e) => {
                  setSarlavha(e.target.value);
                  setErrors((x) => ({ ...x, sarlavha: "" }));
                }}
                className={`${inputCls} ${errors.sarlavha ? "border-red-300 bg-red-50" : ""}`}
                placeholder="Maqola nomi"
              />
              {errors.sarlavha && <p className="mt-1 text-xs text-red-500">{errors.sarlavha}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Kalit so'zlar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={kalitSozlar}
                onChange={(e) => {
                  setKalitSozlar(e.target.value);
                  setErrors((x) => ({ ...x, kalit: "" }));
                }}
                className={`${inputCls} ${errors.kalit ? "border-red-300 bg-red-50" : ""}`}
                placeholder="vergul bilan ajrating"
              />
              {errors.kalit && <p className="mt-1 text-xs text-red-500">{errors.kalit}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Annotatsiya <span className="text-red-500">*</span>
              </label>
              <textarea
                value={annotatsiya}
                onChange={(e) => {
                  setAnnotatsiya(e.target.value);
                  setErrors((x) => ({ ...x, annotatsiya: "" }));
                }}
                rows={5}
                className={`${inputCls} resize-y min-h-[120px] ${errors.annotatsiya ? "border-red-300 bg-red-50" : ""}`}
              />
              {errors.annotatsiya && (
                <p className="mt-1 text-xs text-red-500">{errors.annotatsiya}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Adabiyotlar
              </label>
              <textarea
                value={adabiyotlar}
                onChange={(e) => setAdabiyotlar(e.target.value)}
                rows={4}
                className={`${inputCls} resize-y`}
              />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Mualliflar <span className="text-red-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={addAuthor}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Muallif qo'shish
                </button>
              </div>
              <div className="space-y-4">
                {authors.map((a, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <FaUser className="text-slate-400" /> {i + 1}-muallif
                      </span>
                      {authors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAuthor(i)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <FaTimes /> O'chirish
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="F.I.Sh *"
                          value={a.fullName}
                          onChange={(e) => setAuthor(i, "fullName", e.target.value)}
                          className={`${inputCls} ${errors[`a${i}_name`] ? "border-red-300 bg-red-50" : ""}`}
                        />
                      </div>
                      <input
                        type="tel"
                        placeholder="Telefon *"
                        value={a.phone}
                        onChange={(e) => setAuthor(i, "phone", e.target.value)}
                        className={`${inputCls} ${errors[`a${i}_phone`] ? "border-red-300 bg-red-50" : ""}`}
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={a.email}
                        onChange={(e) => setAuthor(i, "email", e.target.value)}
                        className={`${inputCls} ${errors[`a${i}_email`] ? "border-red-300 bg-red-50" : ""}`}
                      />
                      <input
                        type="text"
                        placeholder="Tashkilot *"
                        value={a.workplace}
                        onChange={(e) => setAuthor(i, "workplace", e.target.value)}
                        className={`${inputCls} ${errors[`a${i}_work`] ? "border-red-300 bg-red-50" : ""}`}
                      />
                      <input
                        type="text"
                        placeholder="Lavozim *"
                        value={a.position}
                        onChange={(e) => setAuthor(i, "position", e.target.value)}
                        className={`${inputCls} ${errors[`a${i}_pos`] ? "border-red-300 bg-red-50" : ""}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Maqola fayli (.doc / .docx) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  <FaFileAlt />
                  Fayl tanlash
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setFile(f || null);
                      setErrors((x) => ({ ...x, file: "" }));
                      e.target.value = "";
                    }}
                  />
                </label>
                {file && <span className="text-sm text-slate-600">{file.name}</span>}
              </div>
              {errors.file && <p className="mt-1 text-xs text-red-500">{errors.file}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? <span className="loading loading-spinner loading-xs" /> : <FaSave className="text-xs" />}
              Saqlash
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
