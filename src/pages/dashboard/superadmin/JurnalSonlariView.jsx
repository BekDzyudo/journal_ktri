import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBook, FaSearch, FaSync, FaChevronLeft, FaChevronRight,
  FaCalendarAlt, FaHashtag,
  FaEye, FaArrowLeft, FaSave, FaTrash,
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaListUl, FaListOl, FaRemoveFormat, FaLink, FaUnlink,
} from "react-icons/fa";
import DOMPurify from "dompurify";
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

function forceHttps(url) {
  return url ? String(url).replace(/^http:\/\//i, "https://") : url;
}

/** Ro'yxat va batafsil GET uchun turli URL variantlari */
function resolveJurnalMediaUrl(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return forceHttps(s);
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const resolved = s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
  return forceHttps(resolved);
}

function fileDisplayNameFromUrl(url) {
  if (!url) return "";
  try {
    const path = String(url).includes("://") ? new URL(url).pathname : String(url);
    const seg = path.split("/").filter(Boolean).pop() || path;
    return decodeURIComponent(seg);
  } catch {
    const parts = String(url).split(/[/\\]/);
    return parts[parts.length - 1] || String(url);
  }
}

/** Backend ba'zan `views`, ba'zan `views_count` yuboradi */
function pickJurnalViewsCount(raw) {
  if (raw == null || typeof raw !== "object") return null;
  const v =
    raw.views_count ??
    raw.views ??
    raw.view_count ??
    raw.korishlar_soni ??
    raw.korishlar ??
    null;
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : String(v);
}

const DESCRIPTION_PURIFY = {
  ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "s", "strike", "del", "ul", "ol", "li", "a", "h2", "h3", "blockquote"],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

function sanitizeDescriptionHtml(html) {
  return DOMPurify.sanitize(html || "", DESCRIPTION_PURIFY);
}

/** Oddiy HTML tavsif maydoni (bold / italic va hokazo) */
function HtmlDescriptionField({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || focused) return;
    const sanitized = sanitizeDescriptionHtml(value);
    const next = sanitized || "<br>";
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value, focused]);

  const syncFromDom = () => {
    const el = editorRef.current;
    if (!el) return;
    let html = el.innerHTML.replace(/^\s*<br\s*\/?>\s*$/i, "").trim();
    if (!html || html === "<br>") html = "";
    onChange(sanitizeDescriptionHtml(html));
  };

  const runCmd = (command, cmdValue = null) => {
    editorRef.current?.focus();
    try {
      document.execCommand(command, false, cmdValue);
    } catch {
      /* eski brauzerlar */
    }
    syncFromDom();
  };

  const insertLink = () => {
    const url = typeof window !== "undefined" ? window.prompt("Havola URL manzili:", "https://") : "";
    if (!url?.trim()) return;
    runCmd("createLink", url.trim());
  };

  const ToolBtn = ({ onClick, title, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-white px-2 py-1.5">
        <ToolBtn title="Qalin" onClick={() => runCmd("bold")}>
          <FaBold />
        </ToolBtn>
        <ToolBtn title="Qiya" onClick={() => runCmd("italic")}>
          <FaItalic />
        </ToolBtn>
        <ToolBtn title="Chiziq ostidan" onClick={() => runCmd("underline")}>
          <FaUnderline />
        </ToolBtn>
        <ToolBtn title="Chizilgan" onClick={() => runCmd("strikeThrough")}>
          <FaStrikethrough />
        </ToolBtn>
        <ToolBtn title="Ro'yxat" onClick={() => runCmd("insertUnorderedList")}>
          <FaListUl />
        </ToolBtn>
        <ToolBtn title="Raqamli ro'yxat" onClick={() => runCmd("insertOrderedList")}>
          <FaListOl />
        </ToolBtn>
        <ToolBtn title="Havola" onClick={insertLink}>
          <FaLink />
        </ToolBtn>
        <ToolBtn title="Havolani olib tashlash" onClick={() => runCmd("unlink")}>
          <FaUnlink />
        </ToolBtn>
        <ToolBtn title="Formatlashni tozalash" onClick={() => runCmd("removeFormat")}>
          <FaRemoveFormat />
        </ToolBtn>
      </div>
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          syncFromDom();
        }}
        onInput={syncFromDom}
        className="min-h-[192px] w-full px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none"
      />
    </div>
  );
}

/** `<input type="date">` uchun yyyy-mm-dd */
function toDateInputValue(raw) {
  if (raw == null || raw === "") return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dm = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const m = s.match(dm);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  return "";
}

function pickExistingImageUrl(json) {
  if (!json || typeof json !== "object") return null;
  const v =
    json.image ??
    json.cover ??
    json.cover_image ??
    json.muqova ??
    json.muqova_rasm ??
    null;
  if (v && typeof v === "object" && v.url) return String(v.url).trim() || null;
  return v ? String(v).trim() || null : null;
}

function pickExistingPdfUrl(json) {
  if (!json || typeof json !== "object") return null;
  const v =
    json.pdfUrl ??
    json.pdf ??
    json.pdf_url ??
    json.file ??
    json.fayl ??
    null;
  if (v && typeof v === "object" && v.url) return String(v.url).trim() || null;
  return v ? String(v).trim() || null : null;
}

// ─── Edit / Delete panel ─────────────────────────────────────────────────────
function JurnalSonEditPanel({ jurnalId, onBack, onDone, refreshAccessToken }) {
  const EMPTY = {
    title: "", description: "", nashr_sanasi: "", volume: "",
    issue: "", year: "", views_count: "", faol: true,
  };
  const [form, setForm] = useState(EMPTY);
  const [faolTouched, setFaolTouched] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState(null);
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
          const vc = pickJurnalViewsCount(json);
          setExistingImageUrl(pickExistingImageUrl(json));
          setExistingPdfUrl(pickExistingPdfUrl(json));
          setImageFile(null);
          setPdfFile(null);
          setFaolTouched(false);
          setForm({
            title: json.title ?? "",
            description: sanitizeDescriptionHtml(json.description ?? ""),
            nashr_sanasi: toDateInputValue(json.date ?? json.nashr_sanasi ?? ""),
            volume: json.volume != null ? String(json.volume) : "",
            issue: json.issue != null ? String(json.issue) : "",
            year: json.year != null ? String(json.year) : "",
            views_count: vc != null ? String(vc) : "",
            faol: true,
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
    if (name === "faol") setFaolTouched(true);
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
      const descClean = sanitizeDescriptionHtml(form.description).trim();
      if (descClean) formData.append("description", descClean);
      if (form.nashr_sanasi) formData.append("date", form.nashr_sanasi);
      formData.append("volume", form.volume);
      formData.append("issue", form.issue);
      formData.append("year", form.year);
      if (form.views_count !== "") formData.append("views_count", form.views_count);
      const faolEffective = faolTouched ? form.faol : true;
      formData.append("faol", faolEffective ? "true" : "false");
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
      <div className="flex flex-col items-start gap-4">
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
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Muqova rasmi
              </label>
              {existingImageUrl && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-600">Hozirda:</span>
                  <a
                    href={resolveJurnalMediaUrl(existingImageUrl) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    {fileDisplayNameFromUrl(existingImageUrl)}
                  </a>
                </div>
              )}
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                O&apos;zgartirish
              </p>
              <input
                key={`cover-${jurnalId}`}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-blue-700"
              />
            </div>

            {/* PDF */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                PDF fayl
              </label>
              {existingPdfUrl && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-600">Hozirda:</span>
                  <a
                    href={resolveJurnalMediaUrl(existingPdfUrl) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    {fileDisplayNameFromUrl(existingPdfUrl)}
                  </a>
                </div>
              )}
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                O&apos;zgartirish
              </p>
              <input
                key={`pdf-${jurnalId}`}
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-blue-700"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Tavsif
              </label>
              <HtmlDescriptionField
                value={form.description}
                onChange={(html) => {
                  setForm((prev) => ({ ...prev, description: html }));
                  setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder="Qisqacha tavsif..."
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Yuqoridagi tugmalar yordamida qalin, qiya, ro&apos;yxat va havola qo&apos;shishingiz mumkin.
              </p>
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
                          <span className="text-slate-600">
                            {j.views ?? j.views_count ?? j.view_count ?? "—"}
                          </span>
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
