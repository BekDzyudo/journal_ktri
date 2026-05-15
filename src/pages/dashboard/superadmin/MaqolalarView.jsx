import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaNewspaper, FaSearch, FaSync, FaChevronLeft, FaChevronRight,
  FaCalendarAlt, FaUser, FaTag, FaFileAlt,
  FaArrowLeft, FaSave, FaTrash, FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { inferMuallifHolatKeyForPanel } from "../../../utils/maqolaApi.js";
import {
  MUALLIF_API_HOLAT_LABELS,
  MUALLIF_API_HOLAT_COLORS,
  MUALLIF_API_HOLAT,
} from "../../../constants/roles.js";
import useRuknlar from "../../../hooks/useRuknlar.jsx";

const INITIAL_AUTHOR = {
  id: null,
  fullName: "",
  phone: "",
  email: "",
  workplace: "",
  position: "",
};

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

function toDateInputValue(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  return "";
}

function forceHttps(url) {
  return url ? String(url).replace(/^http:\/\//i, "https://") : url;
}

function resolveFileUrl(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return forceHttps(s);
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  return forceHttps(s.startsWith("/") ? `${base}${s}` : `${base}/${s}`);
}

function fileNameFromUrl(url) {
  if (!url) return "";
  try {
    const path = String(url).includes("://") ? new URL(url).pathname : String(url);
    const seg = path.split("/").filter(Boolean).pop() || path;
    return decodeURIComponent(seg);
  } catch {
    const parts = String(url).split(/[/\\]/);
    return parts[parts.length - 1] || "";
  }
}

function mualliflarToAuthors(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [{ ...INITIAL_AUTHOR }];
  return [...arr]
    .sort((a, b) => (a.tartib ?? 0) - (b.tartib ?? 0))
    .map((m) => ({
      id: m.id ?? m.pk ?? null,
      fullName: m.ism_familya || "",
      phone: m.telefon || "",
      email: m.email || "",
      workplace: m.tashkilot || "",
      position: m.lavozim || "",
    }));
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

const HOLAT_OPTIONS = Object.values(MUALLIF_API_HOLAT);

function MaqolaEditPanel({ articleId, onBack, onDone, refreshAccessToken }) {
  const { ruknlar, isPending: ruknlarLoading, error: ruknlarError } = useRuknlar();
  const refreshRef = useRef(refreshAccessToken);
  refreshRef.current = refreshAccessToken;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [sarlavha, setSarlavha] = useState("");
  const [ruknId, setRuknId] = useState("");
  const [kalitSozlar, setKalitSozlar] = useState("");
  const [annotatsiya, setAnnotatsiya] = useState("");
  const [adabiyotlar, setAdabiyotlar] = useState("");
  const [sahifalar, setSahifalar] = useState("");
  const [holat, setHolat] = useState(MUALLIF_API_HOLAT.YUBORILGAN);
  const [radSababi, setRadSababi] = useState("");
  const [nashrSanasi, setNashrSanasi] = useState("");
  const [authors, setAuthors] = useState([{ ...INITIAL_AUTHOR }]);
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!articleId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
        const res = await fetchWithAuth(
          `${base}/admin/maqolalar/${articleId}/`,
          { method: "GET" },
          getAccessToken,
          refreshRef.current
        );
        const text = await res.text();
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }
        if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));
        if (cancelled || !json) return;

        setSarlavha(json.sarlavha ?? json.title ?? "");
        setRuknId(json.rukn?.id != null ? String(json.rukn.id) : "");
        setKalitSozlar(
          typeof json.kalit_sozlar === "string"
            ? json.kalit_sozlar
            : Array.isArray(json.kalit_sozlar_list)
              ? json.kalit_sozlar_list.join(", ")
              : ""
        );
        setAnnotatsiya(json.annotatsiya ?? "");
        setAdabiyotlar(json.adabiyotlar ?? "");
        setSahifalar(json.sahifalar != null ? String(json.sahifalar) : "");
        const h = json.holat != null ? String(json.holat).trim() : "";
        setHolat(HOLAT_OPTIONS.includes(h) ? h : h || MUALLIF_API_HOLAT.YUBORILGAN);
        setRadSababi(json.rad_sababi ?? "");
        setNashrSanasi(toDateInputValue(json.nashr_sanasi ?? ""));
        setAuthors(mualliflarToAuthors(json.mualliflar));
        setFile(null);

        const rawFayl = json.fayl;
        const urlStr =
          typeof rawFayl === "string"
            ? rawFayl
            : rawFayl && typeof rawFayl === "object" && rawFayl.url
              ? String(rawFayl.url)
              : "";
        setExistingFileUrl(urlStr || null);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Yuklashda xatolik");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // Faqat maqola ID o'zgarganda qayta yuklash — refreshAccessToken har renderda yangilanib formani tiklab qo'ymasin
  }, [articleId]);

  const holatSelectOptions = useMemo(() => {
    const set = new Set(HOLAT_OPTIONS);
    if (holat && !set.has(holat)) return [holat, ...HOLAT_OPTIONS];
    return HOLAT_OPTIONS;
  }, [holat]);

  const setAuthor = (index, field, value) => {
    setAuthors((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
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
    if (!ruknId) e.rukn = "Ruknni tanlang";
    if (!sarlavha.trim()) e.sarlavha = "Sarlavha majburiy";
    if (!kalitSozlar.trim()) e.kalit = "Kalit so'zlar";
    if (!annotatsiya.trim()) e.annotatsiya = "Annotatsiya";
    authors.forEach((a, i) => {
      if (!a.fullName.trim()) e[`n${i}`] = true;
      if (!a.email.trim()) e[`e${i}`] = true;
    });
    return e;
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      toast.error("Majburiy maydonlarni to'ldiring.");
      return;
    }

    const ruknNum = parseInt(ruknId, 10);
    const validIds = new Set(ruknlar.map((r) => r.id));
    if (!Number.isFinite(ruknNum) || !validIds.has(ruknNum)) {
      toast.error("Ruknni tanlang.");
      return;
    }

    setSaving(true);
    try {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      const url = `${base}/admin/maqolalar/${articleId}/`;

      const mualliflar = authors.map((a, i) => {
        const row = {
          tartib: i,
          ism_familya: a.fullName.trim(),
          telefon: a.phone.trim(),
          email: a.email.trim(),
          tashkilot: a.workplace.trim(),
          lavozim: a.position.trim(),
        };
        if (a.id != null && a.id !== "") row.id = a.id;
        return row;
      });

      const parseRes = async (res) => {
        const text = await res.text();
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }
        return { json };
      };

      const patchJson = async (partial) => {
        const res = await fetchWithAuth(
          url,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(partial),
          },
          getAccessToken,
          refreshAccessToken
        );
        const parsed = await parseRes(res);
        if (!res.ok) throw new Error(parseApiError(parsed.json, `${res.status}`));
      };

      /**
       * Ba'zi backendlar bitta PATCH da `holat` bilan boshqa maydonlarni birga yuborganimizda
       * faqat holatni yangilaydi. Shuning uchun avval matn maydonlari va mualliflar, oxirida holat.
       */
      await patchJson({
        sarlavha: sarlavha.trim(),
        rukn: ruknNum,
        kalit_sozlar: kalitSozlar.trim(),
        annotatsiya: annotatsiya.trim(),
        adabiyotlar: adabiyotlar.trim(),
        sahifalar: sahifalar.trim(),
        rad_sababi: radSababi.trim(),
        nashr_sanasi: nashrSanasi || null,
      });

      await patchJson({ mualliflar });

      await patchJson({ holat });

      if (file) {
        const fd = new FormData();
        fd.append("fayl", file, file.name);
        const resFile = await fetchWithAuth(
          url,
          { method: "PATCH", body: fd },
          getAccessToken,
          refreshAccessToken
        );
        const parsed = await parseRes(resFile);
        if (!resFile.ok) throw new Error(parseApiError(parsed.json, `${resFile.status}`));
      }

      toast.success("Saqlandi!");
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
        `${base}/admin/maqolalar/${articleId}/`,
        { method: "DELETE" },
        getAccessToken,
        refreshAccessToken
      );
      if (!res.ok) {
        const text = await res.text();
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }
        throw new Error(parseApiError(json, `${res.status}`));
      }
      toast.success("O'chirildi");
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
        <span className="loading loading-spinner loading-lg text-emerald-500" />
        <p className="mt-3 text-sm font-semibold text-slate-400">Yuklanmoqda...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Ro'yxatga qaytish
        </button>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {loadError}
        </div>
      </div>
    );
  }

  const resolvedExisting = resolveFileUrl(existingFileUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Ro'yxatga qaytish
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Tahrirlash</p>
          <h2 className="mt-0.5 text-2xl font-black text-slate-950">Maqola #{articleId}</h2>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <FaNewspaper className="text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">Ma'lumotlarni tahrirlang</h3>
            </div>
          </div>

          <div className="grid gap-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Sarlavha <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sarlavha"
                  autoComplete="off"
                  value={sarlavha}
                  onChange={(e) => {
                    setSarlavha(e.target.value);
                    setErrors((x) => ({ ...x, sarlavha: "" }));
                  }}
                  className={`${inputCls} ${errors.sarlavha ? "border-red-300 bg-red-50" : ""}`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Rukn <span className="text-red-500">*</span>
                </label>
                <select
                  value={ruknId}
                  onChange={(e) => {
                    setRuknId(e.target.value);
                    setErrors((x) => ({ ...x, rukn: "" }));
                  }}
                  disabled={ruknlarLoading || !!ruknlarError}
                  className={`${inputCls} ${errors.rukn ? "border-red-300 bg-red-50" : ""}`}
                >
                  <option value="">Tanlang</option>
                  {ruknlar.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.kod ? `${r.kod} — ` : ""}
                      {r.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Holat
                </label>
                <select
                  value={holat}
                  onChange={(e) => setHolat(e.target.value)}
                  className={inputCls}
                >
                  {holatSelectOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {MUALLIF_API_HOLAT_LABELS[opt] || opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
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
                />
              </div>

              <div className="sm:col-span-2">
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

              <div className="grid gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Sahifalar
                  </label>
                  <input
                    type="text"
                    value={sahifalar}
                    onChange={(e) => setSahifalar(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Nashr sanasi
                  </label>
                  <input
                    type="date"
                    value={nashrSanasi}
                    onChange={(e) => setNashrSanasi(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Rad etilish sababi
                </label>
                <textarea
                  value={radSababi}
                  onChange={(e) => setRadSababi(e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-y`}
                />
              </div>
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
                  + Muallif
                </button>
              </div>
              <div className="space-y-4">
                {authors.map((a, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <FaUser className="text-slate-400" /> {i + 1}
                      </span>
                      {authors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAuthor(i)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          <FaTimes className="inline" /> O'chirish
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="F.I.Sh *"
                        value={a.fullName}
                        onChange={(e) => setAuthor(i, "fullName", e.target.value)}
                        className={`${inputCls} sm:col-span-2 ${errors[`n${i}`] ? "border-red-300 bg-red-50" : ""}`}
                      />
                      <input
                        type="tel"
                        placeholder="Telefon"
                        value={a.phone}
                        onChange={(e) => setAuthor(i, "phone", e.target.value)}
                        className={inputCls}
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={a.email}
                        onChange={(e) => setAuthor(i, "email", e.target.value)}
                        className={`${inputCls} ${errors[`e${i}`] ? "border-red-300 bg-red-50" : ""}`}
                      />
                      <input
                        type="text"
                        placeholder="Tashkilot"
                        value={a.workplace}
                        onChange={(e) => setAuthor(i, "workplace", e.target.value)}
                        className={inputCls}
                      />
                      <input
                        type="text"
                        placeholder="Lavozim"
                        value={a.position}
                        onChange={(e) => setAuthor(i, "position", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Fayl (.doc / .docx)
              </label>
              {existingFileUrl && (
                <div className="mb-2 text-sm">
                  <span className="font-semibold text-slate-600">Hozirda: </span>
                  <a
                    href={resolvedExisting || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    {fileNameFromUrl(existingFileUrl)}
                  </a>
                </div>
              )}
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Yangi fayl
              </p>
              <input
                key={`f-${articleId}`}
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-emerald-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <div>
              {confirmDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-red-600">O'chirilsinmi?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? <span className="loading loading-spinner loading-xs" /> : "Ha"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    Bekor
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
                >
                  <FaTrash className="text-xs" />
                  O'chirish
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
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

export default function MaqolalarView({ onAddNew }) {
  const navigate = useNavigate();
  const { refresh: refreshAccessToken } = useContext(AuthContext);

  const [articles, setArticles] = useState([]);
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
        `${base}/admin/maqolalar/`,
        { method: "GET" },
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
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.results)
          ? json.results
          : [];
      setArticles(list);
    } catch (err) {
      setError(err.message || "Maqolalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = articles.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const sarlavha = (a.sarlavha || "").toLowerCase();
    const mualliflar = Array.isArray(a.mualliflar)
      ? a.mualliflar
          .map((m) =>
            typeof m === "object" && m !== null
              ? m.ism_familya ||
                m.ism_familiya ||
                m.ism ||
                m.name ||
                `${m.first_name || ""} ${m.last_name || ""}`.trim()
              : ""
          )
          .join(" ")
          .toLowerCase()
      : "";
    return sarlavha.includes(q) || mualliflar.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openAdd = () => {
    if (onAddNew) onAddNew();
    else navigate("/profile", { state: { activeTab: "maqola-qoshish" } });
  };

  if (editingId != null) {
    return (
      <MaqolaEditPanel
        articleId={editingId}
        onBack={() => setEditingId(null)}
        onDone={() => {
          setEditingId(null);
          load();
        }}
        refreshAccessToken={refreshAccessToken}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Boshqaruv</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Maqolalar</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
          >
            + Yangi qo'shish
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            Yangilash
          </button>
        </div>
      </div>

      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
        <input
          type="text"
          placeholder="Sarlavha yoki muallif bo'yicha qidirish..."
          value={search}
          onChange={handleSearch}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <span className="loading loading-spinner loading-lg text-blue-500" />
          <p className="mt-3 text-sm font-semibold text-slate-400">Yuklanmoqda...</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaNewspaper className="text-emerald-500" />
                <h3 className="text-base font-black text-slate-900">Barcha maqolalar</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                {filtered.length} ta
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-400">
              Maqola topilmadi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Sarlavha</th>
                    <th className="px-4 py-3 text-left">Mualliflar</th>
                    <th className="px-4 py-3 text-left">Rukn</th>
                    <th className="px-4 py-3 text-left">Sahifalar</th>
                    <th className="px-4 py-3 text-left">Holat</th>
                    <th className="px-4 py-3 text-left">Nashr sanasi</th>
                    <th className="px-4 py-3 text-left">Yuborilgan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((a, idx) => {
                    const holatRaw = a.holat ?? "";
                    const holatKey = inferMuallifHolatKeyForPanel({ holat: holatRaw });
                    const badgeClass =
                      MUALLIF_API_HOLAT_COLORS[holatKey] || "bg-gray-100 text-gray-700 border-gray-200";
                    const badgeLabel = MUALLIF_API_HOLAT_LABELS[holatKey] || holatRaw || "—";

                    return (
                      <tr
                        key={a.id ?? idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => a.id != null && setEditingId(a.id)}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && a.id != null) {
                            e.preventDefault();
                            setEditingId(a.id);
                          }
                        }}
                        className="cursor-pointer transition hover:bg-emerald-50/60 focus:bg-emerald-50/60 focus:outline-none"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="max-w-56 px-4 py-3.5">
                          <p className="line-clamp-2 font-semibold leading-snug text-blue-700 underline-offset-2 hover:underline">
                            {a.sarlavha || "Nomsiz"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          {Array.isArray(a.mualliflar) && a.mualliflar.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {a.mualliflar.map((m, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <FaUser className="shrink-0 text-[10px] text-slate-400" />
                                  <span className="text-xs text-slate-700">{m.ism_familya}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-700">{a.rukn?.nom || "—"}</span>
                            {a.rukn?.kod && (
                              <span className="text-[11px] text-slate-400">{a.rukn.kod}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FaFileAlt className="text-[10px] text-slate-400" />
                            <span className="text-xs text-slate-600">{a.sahifalar || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}
                          >
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FaCalendarAlt className="text-[9px]" />
                            {formatDate(a.nashr_sanasi)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FaCalendarAlt className="text-[9px]" />
                            {formatDate(a.yuborilgan_vaqt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} /{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
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
                  type="button"
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
