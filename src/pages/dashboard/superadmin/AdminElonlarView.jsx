import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaBullhorn,
  FaSearch,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaSave,
  FaTrash,
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaRemoveFormat,
  FaLink,
  FaUnlink,
} from "react-icons/fa";
import DOMPurify from "dompurify";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { toast } from "react-toastify";

const DESCRIPTION_PURIFY = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "del",
    "ul",
    "ol",
    "li",
    "a",
    "h2",
    "h3",
    "blockquote",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

function sanitizeDescriptionHtml(html) {
  return DOMPurify.sanitize(html || "", DESCRIPTION_PURIFY);
}

/** Jurnal soni / maqola tahriridagi kabi HTML matn maydoni */
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
    const url =
      typeof window !== "undefined"
        ? window.prompt("Havola URL manzili:", "https://")
        : "";
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
        className="min-h-[220px] w-full px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none"
      />
    </div>
  );
}

function parseList(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.results)) return json.results;
  return [];
}

function formatDisplayDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    const s = String(iso).slice(0, 10);
    const [y, m, d] = s.split("-");
    if (y && m && d) return `${d}.${m}.${y}`;
    return String(iso);
  }
}

function toDateInputValue(raw) {
  if (raw == null || raw === "") return "";
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

function emptyForm() {
  return {
    sarlavha: "",
    matn: "",
    sana: "",
    muallif: "",
    oqish_vaqti: "",
    faol: true,
    korishlar_soni: "",
  };
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

function ElonEditPanel({ elonId, onBack, onDone, refreshAccessToken }) {
  const isNew = elonId === "new";
  const refreshRef = useRef(refreshAccessToken);
  refreshRef.current = refreshAccessToken;

  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const apiRoot = `${base}/admin/elonlar`;

  const [form, setForm] = useState(emptyForm);
  const [existingRasmUrl, setExistingRasmUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [blobPreview, setBlobPreview] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!imageFile) {
      setBlobPreview(null);
      return;
    }
    const u = URL.createObjectURL(imageFile);
    setBlobPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [imageFile]);

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm());
      setExistingRasmUrl("");
      setImageFile(null);
      setLoading(false);
      setLoadError("");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetchWithAuth(
          `${apiRoot}/${elonId}/`,
          { method: "GET" },
          getAccessToken,
          refreshRef.current,
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

        setExistingRasmUrl(json.rasm ? String(json.rasm).trim() : "");
        setImageFile(null);
        setForm({
          sarlavha: json.sarlavha ?? "",
          matn: json.matn ?? "",
          sana: toDateInputValue(json.sana),
          muallif: json.muallif ?? "",
          oqish_vaqti: json.oqish_vaqti != null ? String(json.oqish_vaqti) : "",
          faol: Boolean(json.faol),
          korishlar_soni:
            json.korishlar_soni != null ? String(json.korishlar_soni) : "",
        });
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
  }, [elonId, isNew, apiRoot]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.sarlavha.trim()) e.sarlavha = "Sarlavha majburiy";
    if (!form.matn.trim()) e.matn = "Matn majburiy";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Majburiy maydonlarni to'ldiring.");
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? `${apiRoot}/` : `${apiRoot}/${elonId}/`;
      const method = isNew ? "POST" : "PATCH";

      /** Backend PATCH/POST JSON ni rad qiladi (415) — doim multipart */
      const fd = new FormData();
      fd.append("sarlavha", form.sarlavha.trim());
      fd.append("matn", form.matn);
      if (form.sana) fd.append("sana", form.sana);
      fd.append("muallif", form.muallif.trim());
      fd.append("oqish_vaqti", form.oqish_vaqti.trim());
      fd.append("faol", form.faol ? "true" : "false");
      if (imageFile) fd.append("rasm", imageFile, imageFile.name);

      const res = await fetchWithAuth(
        url,
        { method, body: fd },
        getAccessToken,
        refreshRef.current,
      );

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));

      toast.success(isNew ? "Yaratildi" : "Saqlandi!");
      onDone();
    } catch (err) {
      toast.error(err.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(
        `${apiRoot}/${elonId}/`,
        { method: "DELETE" },
        getAccessToken,
        refreshRef.current,
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
      toast.success("O'chirildi!");
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
        <span className="loading loading-spinner loading-lg text-indigo-500" />
        <p className="mt-3 text-sm font-semibold text-slate-400">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!isNew && loadError) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Ro&apos;yxatga qaytish
        </button>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {loadError}
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

  const previewSrc = blobPreview || (existingRasmUrl ? forceHttps(existingRasmUrl) : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Ro&apos;yxatga qaytish
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Boshqaruv</p>
          <h2 className="mt-0.5 text-2xl font-black text-slate-950">
            {isNew ? "Yangi e'lon" : `E'lon #${elonId}`}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <FaBullhorn className="text-indigo-500" />
              <h3 className="text-base font-black text-slate-900">Ma&apos;lumotlarni tahrirlang</h3>
            </div>
          </div>

          <div className="grid gap-5 p-6">
            {previewSrc && (
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  Ko&apos;rinish
                </p>
                <img
                  src={previewSrc}
                  alt=""
                  className="max-h-52 rounded-xl border border-slate-100 object-contain"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                E&apos;lon rasmi
              </label>
              {!isNew && existingRasmUrl && !imageFile && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-600">Hozirda:</span>
                  <a
                    href={forceHttps(existingRasmUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    {fileDisplayNameFromUrl(existingRasmUrl)}
                  </a>
                </div>
              )}
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {imageFile ? "Tanlangan fayl" : isNew ? "Rasm tanlang (ixtiyoriy)" : "Rasmni almashtirish"}
              </p>
              <input
                key={`rasm-${elonId}`}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-indigo-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Sarlavha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sarlavha"
                value={form.sarlavha}
                onChange={handleChange}
                className={`${inputCls} ${errors.sarlavha ? "border-red-300 bg-red-50" : ""}`}
              />
              {errors.sarlavha && (
                <p className="mt-1 text-xs text-red-500">{errors.sarlavha}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Matn <span className="text-red-500">*</span>
              </label>
              <HtmlDescriptionField
                key={String(elonId)}
                value={form.matn}
                onChange={(html) => {
                  setForm((p) => ({ ...p, matn: html }));
                  setErrors((e) => ({ ...e, matn: "" }));
                }}
                placeholder="E'lon matni..."
              />
              {errors.matn && <p className="mt-1 text-xs text-red-500">{errors.matn}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Sana
              </label>
              <input
                type="date"
                name="sana"
                value={form.sana}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                Muallif
              </label>
              <input
                type="text"
                name="muallif"
                value={form.muallif}
                onChange={handleChange}
                placeholder="Masalan: Jurnal tahririyati"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                O&apos;qish vaqti
              </label>
              <input
                type="text"
                name="oqish_vaqti"
                value={form.oqish_vaqti}
                onChange={handleChange}
                placeholder="3 yoki 1 daqiqa"
                className={inputCls}
              />
            </div>

            {!isNew && (
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Ko&apos;rishlar soni
                </label>
                <input
                  type="text"
                  readOnly
                  value={form.korishlar_soni || "—"}
                  className={`${inputCls} cursor-not-allowed bg-slate-100 text-slate-600`}
                />
              </div>
            )}

            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                id="elonFaol"
                name="faol"
                checked={form.faol}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
              />
              <label htmlFor="elonFaol" className="cursor-pointer text-sm font-semibold text-slate-700">
                Faol e&apos;lon
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <div>
              {!isNew &&
                (confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-red-600">
                      O&apos;chirishni tasdiqlaysizmi?
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {deleting ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Ha, o'chirish"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Bekor
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                  >
                    <FaTrash className="text-xs" />
                    O&apos;chirish
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <FaSave className="text-xs" />
                )}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function AdminElonlarView() {
  const { refresh: refreshAccessToken } = useContext(AuthContext);
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const apiRoot = `${base}/admin/elonlar`;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [panelId, setPanelId] = useState(null);

  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    if (!base) {
      toast.error("VITE_BASE_URL sozlanmagan");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `${apiRoot}/`,
        { headers: { Accept: "application/json" } },
        getAccessToken,
        refreshAccessToken,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(json, "Ro'yxat yuklanmadi"));
      setItems(parseList(json));
    } catch (e) {
      setError(e.message || "Xatolik");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiRoot, base, refreshAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (!q) return true;
      const sarlavha = (row.sarlavha || "").toLowerCase();
      const muallif = (row.muallif || "").toLowerCase();
      return sarlavha.includes(q) || muallif.includes(q);
    });
  }, [items, search]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        String(b.sana || "").localeCompare(String(a.sana || "")),
      ),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  if (panelId !== null) {
    return (
      <ElonEditPanel
        elonId={panelId}
        onBack={() => setPanelId(null)}
        onDone={() => {
          setPanelId(null);
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
          <h2 className="mt-1 text-2xl font-black text-slate-950">E&apos;lonlar</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPanelId("new")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
          >
            + Yangi qo&apos;shish
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
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
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
          <span className="loading loading-spinner loading-lg text-indigo-500" />
          <p className="mt-3 text-sm font-semibold text-slate-400">Yuklanmoqda...</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBullhorn className="text-indigo-500" />
                <h3 className="text-base font-black text-slate-900">Barcha e&apos;lonlar</h3>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                {sorted.length} ta
              </span>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-400">
              E&apos;lon topilmadi
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-center">Rasm</th>
                      <th className="px-4 py-3 text-left">Sarlavha</th>
                      <th className="px-4 py-3 text-left">Sana</th>
                      <th className="px-4 py-3 text-left">Muallif</th>
                      <th className="px-4 py-3 text-left">Holat</th>
                      <th className="px-4 py-3 text-right">Ko&apos;rishlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.map((row, idx) => (
                      <tr
                        key={row.id ?? idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => row.id != null && setPanelId(row.id)}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && row.id != null) {
                            e.preventDefault();
                            setPanelId(row.id);
                          }
                        }}
                        className="cursor-pointer transition hover:bg-indigo-50/60 focus:bg-indigo-50/60 focus:outline-none"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {row.rasm ? (
                            <img
                              src={forceHttps(row.rasm)}
                              alt=""
                              className="mx-auto h-10 w-14 rounded-md border border-slate-100 object-cover"
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="max-w-xs px-4 py-3.5">
                          <p className="line-clamp-2 font-semibold leading-snug text-indigo-700 underline-offset-2 hover:underline">
                            {row.sarlavha || "Nomsiz"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                          {formatDisplayDate(row.sana)}
                        </td>
                        <td className="max-w-[140px] truncate px-4 py-3.5 text-slate-700">
                          {row.muallif || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {row.faol ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                              Faol
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                              Nofaol
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">
                          {row.korishlar_soni ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
                  <p className="text-xs font-semibold text-slate-500">
                    Sahifa {currentPage} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="btn btn-sm btn-ghost gap-1 disabled:opacity-40"
                    >
                      <FaChevronLeft className="text-[10px]" />
                      Oldingi
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="btn btn-sm btn-ghost gap-1 disabled:opacity-40"
                    >
                      Keyingi
                      <FaChevronRight className="text-[10px]" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
