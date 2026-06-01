import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import {
  FaNewspaper, FaUsers, FaUserShield, FaUserPlus, FaCheckCircle, FaTimesCircle,
  FaSearch, FaTag, FaFileAlt,
  FaDownload, FaExternalLinkAlt, FaClock,
  FaSyncAlt, FaCalendarAlt, FaArrowRight, FaThLarge, FaLayerGroup,
  FaUserFriends, FaGavel, FaUserCog, FaArrowLeft, FaUser,
  FaBookOpen, FaBan, FaHashtag, FaBook, FaQuoteLeft, FaJournalWhills,
  FaCreditCard, FaClipboardList, FaMoneyBillWave, FaChevronLeft, FaChevronRight,
  FaEdit,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import { fakeArticleApi } from "../../../utils/fakeArticleApi.js";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { normalizeMaqolalarList, inferMuallifHolatKeyForPanel, normalizeMaqolaForDashboard, formatTaqrizHolatiLabel } from "../../../utils/maqolaApi.js";
import { parseApiError } from "../../../utils/apiError.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import {
  filterArticlesByDisplayStatus,
  filterArticlesByDateRange,
  uniqueDisplayStatuses,
  formatDate,
  formatArticleDateTime,
} from "../../../utils/articleDashboardHelpers.js";
import { useNotifications } from "../../../context/NotificationContext.jsx";
import {
  getArticleAuthorEmail,
  pushArticleStatusNotification,
  syncArticleStatusNotifications,
} from "../../../utils/articleStatusNotifications.js";
import {
  ROLES, normalizeRole, ARTICLE_STATUS,
  SUPERADMIN_STATUS_DISPLAY, SUPERADMIN_STATUS_COLORS,
  MUALLIF_API_HOLAT_LABELS, MUALLIF_API_HOLAT_COLORS,
} from "../../../constants/roles.js";

// ─── shared helpers ────────────────────────────────────────────────────────
function SectionHeader({ icon, title, color = "bg-blue-500", iconColor = "text-blue-600" }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${color} bg-opacity-15`}>
        <span className={`text-xs ${iconColor}`}>{icon}</span>
      </div>
      <h3 className="text-sm font-black uppercase tracking-[0.08em] text-slate-700">{title}</h3>
      <div className="ml-1 h-px flex-1 bg-slate-100" />
    </div>
  );
}

function InfoBlock({ label, value, className = "" }) {
  if (!value && value !== 0) return null;
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50 p-4 ${className}`}>
      <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 leading-relaxed">{value}</p>
    </div>
  );
}

function forceHttps(url) {
  return url ? String(url).replace(/^http:\/\//i, "https://") : url;
}

function resolveAdminMediaUrl(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return forceHttps(s);
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const resolved = s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
  return forceHttps(resolved);
}

function resolveChekHref(raw) {
  return resolveAdminMediaUrl(raw);
}

/**
 * Admin ro'yxatidagi "To'lov" ustuni uchun.
 * Backend ro'yxatda `paidAt` / `paymentStatus` bermasligi mumkin; CLICK dan keyin `holat`
 * ko'pincha `paid` o'rniga `accepted` (masalan QABUL_QILINGAN), `assigned` va hokazo bo'ladi.
 */
function articlePaymentLooksCompleted(article) {
  if (!article) return false;
  if (article.paymentStatus === "paid" || article.paidAt) return true;
  if (article.tolov_amalga_oshirildi === true) return true;
  if (article.paid === true || article.tolangan === true || article.is_paid === true) return true;
  if (article.status === ARTICLE_STATUS.PAID) return true;
  const statusesPastPayment = [
    ARTICLE_STATUS.ASSIGNED,
    ARTICLE_STATUS.UNDER_REVIEW,
    ARTICLE_STATUS.IN_EDITING,
    ARTICLE_STATUS.REVIEW_ACCEPTED,
    ARTICLE_STATUS.REVIEW_REJECTED,
    ARTICLE_STATUS.ACCEPTED,
    ARTICLE_STATUS.REVISION_REQUIRED,
    ARTICLE_STATUS.PUBLISHED,
  ];
  return statusesPastPayment.includes(article.status);
}

/** To'lov yakunlangach taqrizchi tayinlash / almashtirish (nashr/rad tugaganidan keyin yo'q) */
function canAssignReviewerAction(article) {
  if (!article?.id) return false;
  if (!articlePaymentLooksCompleted(article)) return false;
  const terminal = [
    ARTICLE_STATUS.PUBLISHED,
    ARTICLE_STATUS.REJECTED,
  ];
  if (terminal.includes(article.status)) return false;
  return true;
}

const MONTHS_SHORT_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Masalan: 18-May, 2026-yil 10:48 */
function formatAdminTolovDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const day = d.getDate();
  const mon = MONTHS_SHORT_EN[d.getMonth()];
  const y = d.getFullYear();
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${mon}, ${y}-yil ${h}:${min}`;
}

function formatMiqdorUZS(val) {
  if (val == null || val === "") return "—";
  const n = Number(String(val).replace(",", "."));
  if (!Number.isFinite(n)) return String(val);
  return n.toFixed(2).replace(".", ",");
}

function normalizeTolovlarListPayload(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.results)) return raw.results;
  return [];
}

function paymentTransactionBadgeClass(holat) {
  const h = String(holat || "").toUpperCase();
  if (h.includes("MUVAFFAQ") || h.includes("SUCCESS")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (h.includes("XATO") || h.includes("RAD") || h.includes("CANCEL")) {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-amber-100 text-amber-900 border-amber-200";
}

function paymentArticleHolatBadgeClass(holat) {
  const h = String(holat || "").toUpperCase();
  if (h.includes("QABUL")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (h.includes("RAD")) return "bg-red-100 text-red-700 border-red-200";
  return "bg-sky-100 text-sky-900 border-sky-200";
}

function prettyUpperSnakeLabel(s) {
  if (s == null || s === "") return "—";
  return String(s)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function taqrizHolatiBadgeClass(key) {
  const k = String(key || "KUTILMOQDA").toUpperCase();
  if (k === "QABUL") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (k === "RAD") return "bg-red-100 text-red-800 border-red-200";
  return "bg-amber-100 text-amber-900 border-amber-200";
}

function articleTaqrizKey(article) {
  return String(article?.taqrizHolati || "KUTILMOQDA").toUpperCase();
}

// ─── SuperAdminDetailPanel ──────────────────────────────────────────────────
function SuperAdminDetailPanel({ articleId, onBack, onActionDone }) {
  const { refresh: refreshAccessToken } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!articleId) return;
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base) { setDetailError("VITE_BASE_URL sozlanmagan"); setDetailLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      setDetailLoading(true);
      setDetailError("");
      try {
        const res = await fetchWithAuth(
          `${base}/admin/maqolalar/${articleId}/`,
          { method: "GET" },
          getAccessToken,
          refreshAccessToken
        );
        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
        if (!res.ok) throw new Error(parseApiError(json, `${res.status}`));
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setDetailError(err.message || "Maqolani yuklashda xatolik");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [articleId, refreshAccessToken]);

  const normalizedArticle = useMemo(() => data ? normalizeMaqolaForDashboard(data) : null, [data]);
  const holat = data?.holat ?? "";
  const holatKey = inferMuallifHolatKeyForPanel({ holat });
  const badgeClass = MUALLIF_API_HOLAT_COLORS[holatKey] || "bg-gray-100 text-gray-800 border-gray-200";
  const badgeLabel = MUALLIF_API_HOLAT_LABELS[holatKey] || holat || "—";
  const pdfUrl = resolveAdminMediaUrl(data?.fayl || data?.pdf || null);

  return (
    <div className="space-y-6">
      {/* Back bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Ro'yxatga qaytish
        </button>
      </div>

      {detailLoading && (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <span className="loading loading-spinner loading-lg text-emerald-500" />
          <p className="mt-3 text-sm font-semibold text-slate-400">Yuklanmoqda...</p>
        </div>
      )}

      {detailError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {detailError}
        </div>
      )}

      {data && !detailLoading && (
        <>
          {/* Title + status */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600">
                  <FaNewspaper className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Maqola tafsilotlari · #{data.id}
                  </p>
                  <h2 className="mt-1 text-xl font-black leading-snug text-slate-900">
                    {data.sarlavha || "Nomsiz maqola"}
                  </h2>
                </div>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}>
                {badgeLabel}
              </span>
            </div>

            {/* Meta chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {data.rukn?.nom && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <FaBookOpen className="text-[9px]" />{data.rukn.nom}
                </span>
              )}
              {data.rukn?.kod && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {data.rukn.kod}
                </span>
              )}
              {data.sahifalar && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  Sahifalar: {data.sahifalar}
                </span>
              )}
              {data.yuborilgan_vaqt && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  <FaCalendarAlt className="text-[9px]" />
                  {formatArticleDateTime(data.yuborilgan_vaqt)}
                </span>
              )}
              {data.nashr_sanasi && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  Nashr: {formatDate(data.nashr_sanasi)}
                </span>
              )}
            </div>
          </div>

          {/* Mualliflar */}
          {Array.isArray(data.mualliflar) && data.mualliflar.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaUser />} title="Mualliflar" color="bg-violet-500" iconColor="text-violet-600" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[...data.mualliflar]
                  .sort((a, b) => (a.tartib ?? 0) - (b.tartib ?? 0))
                  .map((m, idx) => (
                    <div key={m.id ?? `${m.email}-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-black text-slate-900">{m.ism_familya || "—"}</p>
                        {idx === 0 ? (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">Asosiy muallif</span>
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">Hammuallif</span>
                        )}
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        {m.email && <p><span className="font-semibold text-slate-600">Email:</span> {m.email}</p>}
                        {m.tashkilot && <p><span className="font-semibold text-slate-600">Tashkilot:</span> {m.tashkilot}</p>}
                        {m.lavozim && <p><span className="font-semibold text-slate-600">Lavozim:</span> {m.lavozim}</p>}
                        {m.telefon && <p><span className="font-semibold text-slate-600">Telefon:</span> {m.telefon}</p>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Jurnal soni */}
          {data.jurnal_soni && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaJournalWhills />} title="Jurnal soni" color="bg-sky-500" iconColor="text-sky-600" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.jurnal_soni.title && <InfoBlock label="Jurnal nomi" value={data.jurnal_soni.title} />}
                {data.jurnal_soni.year && <InfoBlock label="Yil" value={String(data.jurnal_soni.year)} />}
                {data.jurnal_soni.volume && <InfoBlock label="Tom" value={String(data.jurnal_soni.volume)} />}
                {data.jurnal_soni.issue && <InfoBlock label="Son" value={String(data.jurnal_soni.issue)} />}
                {data.jurnal_soni.date && <InfoBlock label="Sana" value={formatDate(data.jurnal_soni.date)} />}
              </div>
            </div>
          )}

          {/* Kalit so'zlar */}
          {(data.kalit_sozlar_list?.length > 0 || data.kalit_sozlar) && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaHashtag />} title="Kalit so'zlar" color="bg-amber-500" iconColor="text-amber-600" />
              <div className="flex flex-wrap gap-2">
                {(data.kalit_sozlar_list?.length > 0
                  ? data.kalit_sozlar_list
                  : String(data.kalit_sozlar).split(",").map((s) => s.trim()).filter(Boolean)
                ).map((kw, i) => (
                  <span key={i} className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Annotatsiya */}
          {data.annotatsiya && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaBookOpen />} title="Annotatsiya" color="bg-blue-500" iconColor="text-blue-600" />
              <p className="text-sm leading-7 text-slate-700">{data.annotatsiya}</p>
            </div>
          )}

          {/* Adabiyotlar */}
          {data.adabiyotlar && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaBook />} title="Adabiyotlar" color="bg-indigo-500" iconColor="text-indigo-600" />
              <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">{data.adabiyotlar}</p>
            </div>
          )}

          {/* How to cite */}
          {data.how_to_cite && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaQuoteLeft />} title="Iqtibos keltirish" color="bg-slate-500" iconColor="text-slate-600" />
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm italic leading-7 text-slate-600">{data.how_to_cite}</p>
              </div>
            </div>
          )}

          {/* Rad etilish sababi */}
          {data.rad_sababi && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FaBan className="text-red-500" />
                <p className="text-sm font-black uppercase tracking-wider text-red-600">Rad etilish sababi</p>
              </div>
              <p className="text-sm leading-6 text-red-700">{data.rad_sababi}</p>
            </div>
          )}

          {/* Taqriz */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionHeader icon={<FaClipboardList />} title="Taqriz" color="bg-rose-500" iconColor="text-rose-600" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-400">Taqriz holati</p>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${taqrizHolatiBadgeClass(normalizedArticle?.taqrizHolati)}`}
                >
                  {formatTaqrizHolatiLabel(normalizedArticle?.taqrizHolati)}
                </span>
              </div>
              {normalizedArticle?.assignedTo ? (
                <InfoBlock label="Taqrizchi" value={normalizedArticle.assignedToName || normalizedArticle.assignedTo} />
              ) : (
                <InfoBlock label="Taqrizchi" value="Tayinlanmagan" />
              )}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Taqriz izohi</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                  {normalizedArticle?.taqrizIzohi?.trim() ? normalizedArticle.taqrizIzohi : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Fayl */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionHeader icon={<FaFileAlt />} title="Fayl" color="bg-sky-500" iconColor="text-sky-600" />
            {pdfUrl ? (
              <div className="flex flex-wrap gap-3">
                <a
                  href={pdfUrl}
                  download=""
                  // target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <FaDownload className="text-xs" />
                  Yuklab olish
                </a>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Fayl hali yuklanmagan.</p>
            )}
          </div>

          {/* Admin amallar */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-700">
              Ro'yxatga qaytib amallarni bajaring
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              <FaArrowLeft className="text-xs" />
              Ro'yxatga qaytish
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ACCEPTED_ARTICLE_PRICE = 309000;

function computeSuperAdminStats(submittedArticles, allUsers) {
  const authors = allUsers.filter((u) => normalizeRole(u.role) === ROLES.USER);
  const reviewers = allUsers.filter((u) => normalizeRole(u.role) === ROLES.ADMIN);
  const staffAdmins = allUsers.filter((u) => normalizeRole(u.role) === ROLES.SUPERADMIN);
  return {
    totalArticles: submittedArticles.length,
    newMaterials: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.SUBMITTED).length,
    paymentPending: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.PAYMENT_PENDING).length,
    assigned: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.ASSIGNED).length,
    inReview: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.IN_EDITING).length,
    accepted: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.ACCEPTED).length,
    rejected: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.REJECTED).length,
    published: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.PUBLISHED).length,
    totalAuthors: authors.length,
    totalReviewers: reviewers.length,
    totalStaffAdmins: staffAdmins.length,
    totalAllUsers: allUsers.length,
    totalUsers: authors.length,
    totalAdmins: reviewers.length,
    totalRevenue: 0,
    revenueCurrency: "UZS",
  };
}

function pickStatsNumber(source, keys, fallback = 0) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);
      if (Number.isFinite(numberValue)) return numberValue;
    }
  }
  return fallback;
}

function pickStatsString(source, keys, fallback = "") {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return fallback;
}

const UZ_MONTH_NAMES = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

function paymentAdminRowLooksSuccessful(p) {
  const h = String(p?.holat ?? "").toUpperCase();
  return h.includes("MUVAFFAQ") || h.includes("SUCCESS");
}

/** Muvaffaqiyatli to'lovlarni `yaratilgan` bo'yicha oy kesimida jamlash */
function aggregateSuccessfulAdminRevenueByMonth(rows, defaultCurrency = "UZS") {
  if (!Array.isArray(rows)) return [];
  const map = new Map();
  for (const p of rows) {
    if (!paymentAdminRowLooksSuccessful(p)) continue;
    const iso = p?.yaratilgan;
    if (!iso) continue;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const key = `${y}-${String(mo).padStart(2, "0")}`;
    const n = Number(String(p.miqdor ?? "").replace(",", "."));
    if (!Number.isFinite(n) || n < 0) continue;
    const cur =
      p.valyuta != null && String(p.valyuta).trim() !== ""
        ? String(p.valyuta).trim()
        : defaultCurrency;
    const prev = map.get(key) || { sum: 0, count: 0, currency: cur };
    prev.sum += n;
    prev.count += 1;
    map.set(key, prev);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, agg]) => {
      const [ys, ms] = key.split("-");
      const yi = Number(ys);
      const mi = Number(ms);
      return {
        key,
        year: yi,
        month: mi,
        label: `${UZ_MONTH_NAMES[mi - 1] ?? ms} ${yi}`,
        sum: agg.sum,
        count: agg.count,
        currency: agg.currency,
      };
    });
}

function normalizeStatistikaPayload(raw, fallbackStats) {
  const tolBlock =
    raw?.tolovlar && typeof raw.tolovlar === "object" && !Array.isArray(raw.tolovlar)
      ? raw.tolovlar
      : null;

  const maq =
    raw?.maqolalar && typeof raw.maqolalar === "object" && !Array.isArray(raw.maqolalar)
      ? raw.maqolalar
      : null;
  const usersBlock =
    raw?.foydalanuvchilar &&
    typeof raw.foydalanuvchilar === "object" &&
    !Array.isArray(raw.foydalanuvchilar)
      ? raw.foydalanuvchilar
      : null;

  /** Admin API: maqolalar, foydalanuvchilar, tolovlar bloklari */
  if (maq || usersBlock || tolBlock) {
    return {
      totalArticles: pickStatsNumber(
        maq || {},
        ["jami", "totalArticles", "total_articles", "jami_maqolalar"],
        fallbackStats.totalArticles
      ),
      newMaterials: pickStatsNumber(
        maq || {},
        ["yangi", "newMaterials", "new_materials", "yangi_maqolalar", "submitted"],
        fallbackStats.newMaterials
      ),
      assigned: pickStatsNumber(
        maq || {},
        ["tayinlangan", "assigned", "tayinlanganlar", "taqrizchiga_tayinlangan"],
        fallbackStats.assigned
      ),
      paymentPending: pickStatsNumber(
        maq || {},
        ["tolov_kutilmoqda", "payment_pending", "paymentPending"],
        fallbackStats.paymentPending
      ),
      inReview: pickStatsNumber(
        maq || {},
        ["taqrizda", "in_review", "inReview", "taqriz_kelgan", "taqriz_kelib_tushgan"],
        maq ? 0 : fallbackStats.inReview
      ),
      accepted: pickStatsNumber(
        maq || {},
        ["qabul_qilingan", "accepted", "tasdiqlangan", "qabul_qilindi"],
        fallbackStats.accepted
      ),
      rejected: pickStatsNumber(
        maq || {},
        ["rad_etilgan", "rejected", "rad_qilingan", "bekor_qilingan"],
        fallbackStats.rejected
      ),
      published: pickStatsNumber(
        maq || {},
        ["nashr_etilgan", "published", "nashr_qilingan"],
        fallbackStats.published ?? 0
      ),
      totalUsers: pickStatsNumber(
        usersBlock || {},
        ["mualliflar"],
        fallbackStats.totalUsers
      ),
      totalAdmins: pickStatsNumber(
        usersBlock || {},
        ["taqrizchilar"],
        fallbackStats.totalAdmins
      ),
      totalAuthors: pickStatsNumber(
        usersBlock || {},
        ["mualliflar"],
        fallbackStats.totalAuthors ?? fallbackStats.totalUsers
      ),
      totalReviewers: pickStatsNumber(
        usersBlock || {},
        ["taqrizchilar"],
        fallbackStats.totalReviewers ?? fallbackStats.totalAdmins
      ),
      totalStaffAdmins: pickStatsNumber(
        usersBlock || {},
        ["adminlar"],
        fallbackStats.totalStaffAdmins
      ),
      totalAllUsers: pickStatsNumber(
        usersBlock || {},
        ["jami", "jami_foydalanuvchilar", "jami_userlar", "total_users", "total"],
        fallbackStats.totalAllUsers
      ),
      totalRevenue: pickStatsNumber(
        tolBlock || {},
        ["jami_daromad", "jamiDaromad", "total_revenue", "daromad"],
        fallbackStats.totalRevenue ?? 0
      ),
      revenueCurrency: pickStatsString(
        tolBlock || {},
        ["valyuta", "currency", "valyuta_kodi"],
        fallbackStats.revenueCurrency || "UZS"
      ),
    };
  }

  const source =
    raw?.statistika && typeof raw.statistika === "object"
      ? raw.statistika
      : raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data)
        ? raw.data
        : raw?.results && typeof raw.results === "object" && !Array.isArray(raw.results)
          ? raw.results
          : raw || {};

  return {
    totalArticles: pickStatsNumber(
      source,
      ["totalArticles", "total_articles", "jami_maqolalar", "jami"],
      fallbackStats.totalArticles
    ),
    newMaterials: pickStatsNumber(
      source,
      ["newMaterials", "new_materials", "yangi_materiallar", "yangi_maqolalar", "yangi", "submitted"],
      fallbackStats.newMaterials
    ),
    assigned: pickStatsNumber(
      source,
      ["assigned", "tayinlangan", "tayinlanganlar", "taqrizchiga_tayinlangan"],
      fallbackStats.assigned
    ),
    paymentPending: pickStatsNumber(
      source,
      ["tolov_kutilmoqda", "payment_pending", "paymentPending"],
      fallbackStats.paymentPending
    ),
    inReview: pickStatsNumber(
      source,
      ["inReview", "in_review", "taqrizda", "taqriz_kelgan", "taqriz_kelib_tushgan"],
      fallbackStats.inReview
    ),
    accepted: pickStatsNumber(
      source,
      ["accepted", "qabul_qilingan", "qabul_qilindi", "tasdiqlangan"],
      fallbackStats.accepted
    ),
    rejected: pickStatsNumber(
      source,
      ["rejected", "rad_etilgan", "rad_qilingan", "bekor_qilingan"],
      fallbackStats.rejected
    ),
    published: pickStatsNumber(
      source,
      ["nashr_etilgan", "published", "nashr_qilingan"],
      fallbackStats.published ?? 0
    ),
    totalUsers: pickStatsNumber(
      source,
      ["mualliflar", "totalUsers", "total_users"],
      fallbackStats.totalUsers
    ),
    totalAdmins: pickStatsNumber(
      source,
      ["taqrizchilar", "totalAdmins", "total_admins"],
      fallbackStats.totalAdmins
    ),
    totalAuthors: pickStatsNumber(
      source,
      ["mualliflar", "totalAuthors"],
      fallbackStats.totalAuthors ?? fallbackStats.totalUsers
    ),
    totalReviewers: pickStatsNumber(
      source,
      ["taqrizchilar", "totalReviewers"],
      fallbackStats.totalReviewers ?? fallbackStats.totalAdmins
    ),
    totalStaffAdmins: pickStatsNumber(
      source,
      ["adminlar", "totalStaffAdmins"],
      fallbackStats.totalStaffAdmins
    ),
    totalAllUsers: pickStatsNumber(
      source,
      ["jami", "jami_foydalanuvchilar", "jami_userlar", "totalAllUsers", "jami_foydalanuvchi"],
      fallbackStats.totalAllUsers
    ),
    totalRevenue: pickStatsNumber(
      tolBlock || source,
      ["jami_daromad", "jamiDaromad", "total_revenue", "daromad"],
      fallbackStats.totalRevenue ?? 0
    ),
    revenueCurrency: pickStatsString(
      tolBlock || source,
      ["valyuta", "currency", "valyuta_kodi"],
      fallbackStats.revenueCurrency || "UZS"
    ),
  };
}

function SuperAdminDashboard({ userData, view = "articles" }) {
  const { refresh: refreshNotifications } = useNotifications();
  const { refresh: refreshAccessToken } = useContext(AuthContext);

  const loadArticlesFromApi = useCallback(async () => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base) {
      throw new Error("VITE_BASE_URL sozlanmagan");
    }

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

    if (!res.ok) {
      throw new Error(parseApiError(json, `${res.status} ${res.statusText || ""}`.trim()));
    }

    return normalizeMaqolalarList(json);
  }, [refreshAccessToken]);

  const loadUsersFromApi = useCallback(async () => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base) return [];

    const res = await fetchWithAuth(
      `${base}/admin/foydalanuvchilar/`,
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

    if (!res.ok) {
      throw new Error(parseApiError(json, `${res.status} ${res.statusText || ""}`.trim()));
    }

    const list = Array.isArray(json)
      ? json
      : Array.isArray(json?.results)
        ? json.results
        : Array.isArray(json?.data)
          ? json.data
          : [];

    return list.map((u) => {
      const rawRol = u.rol ?? u.role ?? "";
      const role = u.is_superuser ? ROLES.SUPERADMIN : normalizeRole(rawRol);
      return {
        ...u,
        id: u.id ?? u.pk,
        first_name: u.ism ?? u.first_name ?? "",
        last_name: u.familiya ?? u.last_name ?? "",
        email: u.email ?? "",
        phone_number: u.telefon ?? u.phone_number ?? u.telefon_raqam ?? "",
        role,
      };
    });
  }, [refreshAccessToken]);

  const loadTolovlarFromApi = useCallback(async () => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base) return [];

    const res = await fetchWithAuth(
      `${base}/admin/tolovlar/`,
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

    if (!res.ok) {
      throw new Error(parseApiError(json, `${res.status} ${res.statusText || ""}`.trim()));
    }

    return normalizeTolovlarListPayload(json);
  }, [refreshAccessToken]);

  const loadStatsFromApi = useCallback(async () => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base) return null;

    try {
      const res = await fetchWithAuth(
        `${base}/admin/statistika/`,
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

      if (!res.ok) {
        return null;
      }

      return json;
    } catch (err) {
      return null;
    }
  }, [refreshAccessToken]);

  const sendArticleMessage = useCallback(async (article, message) => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base) throw new Error("VITE_BASE_URL sozlanmagan");

    if (!article?.id) throw new Error("Maqola ID topilmadi");

    const res = await fetchWithAuth(
      `${base}/admin/xabar-yuborish/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maqola_id: article.id,
          matn: message,
        }),
      },
      getAccessToken,
      refreshAccessToken
    );
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    if (!res.ok) throw new Error(parseApiError(json, "Xabar yuborilmadi"));
    return json;
  }, [refreshAccessToken]);

  const sendToPayment = useCallback(async (article) => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base) throw new Error("VITE_BASE_URL sozlanmagan");
    if (!article?.id) throw new Error("Maqola ID topilmadi");

    const res = await fetchWithAuth(
      `${base}/admin/maqolalar/${article.id}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ harakat: "click_yuborish" }),
      },
      getAccessToken,
      refreshAccessToken
    );
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    if (!res.ok) throw new Error(parseApiError(json, "To'lovga yuborilmadi"));
    return json;
  }, [refreshAccessToken]);

  const [articles, setArticles] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [submittingToReviewerId, setSubmittingToReviewerId] = useState(null);
  const [taqrizIzohModalArticle, setTaqrizIzohModalArticle] = useState(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [finalDecisionModalOpen, setFinalDecisionModalOpen] = useState(false);
  const [finalDecisionDescription, setFinalDecisionDescription] = useState("");
  const [detailArticle, setDetailArticle] = useState(null);
  const [detailArticleId, setDetailArticleId] = useState(null);
  const [decisionDescription, setDecisionDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tolovlar, setTolovlar] = useState([]);
  const [tolovlarError, setTolovlarError] = useState("");
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [paymentSort, setPaymentSort] = useState({
    field: "yaratilgan",
    dir: "desc",
  });
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentRevenueYear, setPaymentRevenueYear] = useState("all");
  const PAYMENTS_PAGE_SIZE = 25;

  /** Tayinlash: GET rukn bo'yicha taqrizchilar, keyin POST maqola taqrizchi endpointi */
  const submitArticleToReviewerRequest = useCallback(
    async (article) => {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      const articleId = article?.id;
      if (articleId == null) throw new Error("Maqola ID topilmadi");

      if (!base || !getAccessToken()) {
        await fakeArticleApi.autoAssignReviewer(articleId);
        return;
      }

      const ruknId = article?.rukn?.id ?? article?.rukn_id;
      if (ruknId == null || ruknId === "") {
        throw new Error("Maqolada rukn (yo'nalish) aniqlanmagan — tayinlash uchun rukn kerak");
      }

      const qs = new URLSearchParams({ rukn_id: String(ruknId) });
      const getRes = await fetchWithAuth(
        `${base}/admin/taqrizchilar/?${qs.toString()}`,
        { method: "GET" },
        getAccessToken,
        refreshAccessToken
      );
      const getText = await getRes.text();
      let getJson = null;
      try {
        getJson = getText ? JSON.parse(getText) : null;
      } catch {
        getJson = null;
      }
      if (!getRes.ok) {
        throw new Error(parseApiError(getJson, `${getRes.status}`));
      }

      const list = (() => {
        if (!getJson) return [];
        if (Array.isArray(getJson)) return getJson;
        if (Array.isArray(getJson.results)) return getJson.results;
        if (Array.isArray(getJson.data)) return getJson.data;
        if (Array.isArray(getJson.taqrizchilar)) return getJson.taqrizchilar;
        if (getJson.data && typeof getJson.data === "object" && !Array.isArray(getJson.data)) {
          const d = getJson.data;
          if (Array.isArray(d.results)) return d.results;
        }
        return [];
      })();

      const pickTaqrizchiId = (row) => {
        if (row == null || typeof row !== "object") return null;
        return row.id ?? row.taqrizchi_id ?? row.user_id ?? row.pk ?? null;
      };

      const taqrizchiId = list.map(pickTaqrizchiId).find((id) => id != null);
      if (taqrizchiId == null) {
        throw new Error("Ushbu rukn uchun mos taqrizchi topilmadi");
      }

      const assignRes = await fetchWithAuth(
        `${base}/admin/maqolalar/${articleId}/taqrizchi/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taqrizchi_id: taqrizchiId }),
        },
        getAccessToken,
        refreshAccessToken
      );
      const assignText = await assignRes.text();
      let assignJson = null;
      try {
        assignJson = assignText ? JSON.parse(assignText) : null;
      } catch {
        assignJson = null;
      }
      if (!assignRes.ok) {
        throw new Error(parseApiError(assignJson, `${assignRes.status}`));
      }
    },
    [refreshAccessToken]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [articlesData, statsApiData, usersData] = await Promise.all([
        loadArticlesFromApi(),
        loadStatsFromApi(),
        loadUsersFromApi(),
      ]);
      const normalizedUsers = usersData;

      syncArticleStatusNotifications({
        articles: articlesData,
        userData,
        userRole: ROLES.SUPERADMIN,
        scope: "superadmin-dashboard",
      });
      setArticles(articlesData);
      setStatsData(statsApiData);
      setUsers(normalizedUsers);

      try {
        const tolRows = await loadTolovlarFromApi();
        setTolovlar(tolRows);
        setTolovlarError("");
      } catch (tolErr) {
        setTolovlar([]);
        setTolovlarError(tolErr?.message || "To'lovlar yuklanmadi");
      }
    } catch (error) {
      toast.error(
        "Ma'lumotlarni yuklashda xatolik" +
          (error?.message ? `: ${error.message}` : "")
      );
    } finally {
      setLoading(false);
    }
  }, [
    userData,
    loadArticlesFromApi,
    loadStatsFromApi,
    loadUsersFromApi,
    loadTolovlarFromApi,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleSubmitArticleToReviewer = async (article) => {
    if (!article?.id) return;
    setSubmittingToReviewerId(article.id);
    try {
      await submitArticleToReviewerRequest(article);
      toast.success(
        article.assignedTo ? "Maqola taqrizchiga qayta yuborildi." : "Maqola taqrizchiga yuborildi."
      );
      refreshNotifications();
      fetchData();
    } catch (error) {
      toast.error("Yuborishda xatolik: " + (error?.message || ""));
    } finally {
      setSubmittingToReviewerId(null);
    }
  };

  const handleQuickDecision = async (article, decision) => {
    const label = decision === "accept" ? "To'lovga yuborildi" : "Rad etildi";
    const message = decisionDescription.trim();
    if (decision === "reject" && !message) {
      toast.error("Rad etish sababini kiriting");
      return;
    }
    try {
      if (decision === "accept") {
        await sendToPayment(article);
        const authorEmail = getArticleAuthorEmail(article);
        if (authorEmail) {
          pushArticleStatusNotification({
            article,
            status: ARTICLE_STATUS.PAYMENT_PENDING,
            targetRole: "user",
            targetEmail: authorEmail,
            userRoleForLabel: ROLES.USER,
            title: "To'lov bosqichi ochildi",
            message: `"${article.articleTitle}" maqolangiz qabul qilindi. CLICK orqali to'lov qiling.`,
          });
        }
      } else {
        await sendArticleMessage(article, message);
        const authorEmail = getArticleAuthorEmail(article);
        if (authorEmail) {
          pushArticleStatusNotification({
            article,
            status: ARTICLE_STATUS.REJECTED,
            targetRole: "user",
            targetEmail: authorEmail,
            userRoleForLabel: ROLES.USER,
            title: "Maqolangiz rad etildi",
            message: message || `"${article.articleTitle}" dastlabki ko'rikdan o'tmadi.`,
          });
        }
      }
      toast.success(`Maqola "${label}"!`);
      refreshNotifications();
      setDecisionModalOpen(false);
      setSelectedArticle(null);
      setDecisionDescription("");
      fetchData();
    } catch (error) {
      toast.error("Xatolik: " + error.message);
    }
  };

  const handleFinalDecision = async (article, decision) => {
    const label = decision === "accept" ? "Qabul qilindi" : "Rad etildi";
    const message = finalDecisionDescription.trim();
    if (decision === "reject" && !message) {
      toast.error("Rad etish sababini kiriting");
      return;
    }
    try {
      await sendArticleMessage(
        article,
        message || "Maqola bo'yicha yakuniy qaror qabul qilindi."
      );
      const authorEmail = getArticleAuthorEmail(article);
      if (authorEmail) {
        pushArticleStatusNotification({
          article,
          status: decision === "accept" ? ARTICLE_STATUS.ACCEPTED : ARTICLE_STATUS.REJECTED,
          targetRole: "user",
          targetEmail: authorEmail,
          userRoleForLabel: ROLES.USER,
          title: decision === "accept" ? "Maqolangiz qabul qilindi" : "Maqolangiz rad etildi",
          message:
            message ||
            (decision === "accept"
              ? `"${article.articleTitle}" nashrga tavsiya etildi.`
              : `"${article.articleTitle}" rad etildi.`),
        });
      }
      toast.success(`Maqola yakuniy "${label}"!`);
      refreshNotifications();
      setFinalDecisionModalOpen(false);
      setSelectedArticle(null);
      setFinalDecisionDescription("");
      fetchData();
    } catch (error) {
      toast.error("Xatolik: " + error.message);
    }
  };

  const handleChangeUserRole = async (targetUser, newRole) => {
    if (!targetUser?.id || !newRole || newRole === targetUser.role) return;
    try {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      if (!base) throw new Error("VITE_BASE_URL sozlanmagan");

      const res = await fetchWithAuth(
        `${base}/admin/foydalanuvchilar/${targetUser.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rol: newRole }),
        },
        getAccessToken,
        refreshAccessToken
      );
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!res.ok) throw new Error(parseApiError(json, "Rolni o'zgartirishda xatolik"));

      toast.success("Rol o'zgartirildi");
      refreshNotifications();
      fetchData();
    } catch (error) {
      toast.error("Rolni o'zgartirishda xatolik: " + error.message);
    }
  };

  const dateFilteredArticles = useMemo(
    () => filterArticlesByDateRange(articles, dateFrom, dateTo),
    [articles, dateFrom, dateTo]
  );

  const fallbackStats = useMemo(
    () => computeSuperAdminStats(dateFilteredArticles, users),
    [dateFilteredArticles, users]
  );

  const revenueFromTolovlar = useMemo(() => {
    const paidCount = dateFilteredArticles.filter(
      (a) =>
        a.status === ARTICLE_STATUS.ACCEPTED &&
        a.holatKey !== "TOLOVSIZ_QABUL_QILINGAN"
    ).length;
    return paidCount * ACCEPTED_ARTICLE_PRICE;
  }, [dateFilteredArticles]);

  const dashboardStats = useMemo(
    () => normalizeStatistikaPayload(statsData, fallbackStats),
    [statsData, fallbackStats]
  );

  useEffect(() => {
  }, [statsData, fallbackStats, dashboardStats]);

  const filteredArticles = useMemo(
    () =>
      filterArticlesByDisplayStatus(
        dateFilteredArticles,
        searchQuery,
        filterStatus,
        SUPERADMIN_STATUS_DISPLAY
      ),
    [dateFilteredArticles, searchQuery, filterStatus]
  );

  const filteredSortedPayments = useMemo(() => {
    const q = paymentSearchQuery.trim().toLowerCase();
    let rows = Array.isArray(tolovlar) ? [...tolovlar] : [];
    if (q) {
      rows = rows.filter((p) => {
        const hay = [
          p.id,
          p.maqola_id,
          p.maqola_sarlavha,
          p.tolovchi_ism,
          p.tolovchi_telefon,
          p.tolovchi_email,
          p.holat,
          p.maqola_holat,
          p.click_trans_id,
          p.click_paydoc_id,
          p.chek_url,
          p.check_url,
        ]
          .map((x) => String(x ?? "").toLowerCase())
          .join(" ");
        return hay.includes(q);
      });
    }
    const { field, dir } = paymentSort;
    const mul = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const ta = new Date(a[field] || 0).getTime();
      const tb = new Date(b[field] || 0).getTime();
      const na = Number.isNaN(ta) ? 0 : ta;
      const nb = Number.isNaN(tb) ? 0 : tb;
      if (na !== nb) return (na - nb) * mul;
      return (Number(a.id || 0) - Number(b.id || 0)) * mul;
    });
    return rows;
  }, [tolovlar, paymentSearchQuery, paymentSort]);

  const revenueByMonthAll = useMemo(
    () => aggregateSuccessfulAdminRevenueByMonth(tolovlar, "UZS"),
    [tolovlar]
  );

  const paymentRevenueYears = useMemo(() => {
    const ys = new Set(revenueByMonthAll.map((r) => r.year));
    return [...ys].sort((a, b) => b - a);
  }, [revenueByMonthAll]);

  const revenueByMonthFiltered = useMemo(() => {
    if (paymentRevenueYear === "all") return revenueByMonthAll;
    const y = Number(paymentRevenueYear);
    return revenueByMonthAll.filter((r) => r.year === y);
  }, [revenueByMonthAll, paymentRevenueYear]);

  const paymentTotalPages = Math.max(
    1,
    Math.ceil(filteredSortedPayments.length / PAYMENTS_PAGE_SIZE)
  );

  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * PAYMENTS_PAGE_SIZE;
    return filteredSortedPayments.slice(start, start + PAYMENTS_PAGE_SIZE);
  }, [filteredSortedPayments, paymentPage]);

  useEffect(() => {
    setPaymentPage(1);
  }, [paymentSearchQuery, paymentSort]);

  useEffect(() => {
    setPaymentPage((p) => Math.min(Math.max(1, p), paymentTotalPages));
  }, [paymentTotalPages]);

  const togglePaymentSort = (field) => {
    setPaymentSort((prev) => {
      if (prev.field === field) {
        return { field, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { field, dir: "desc" };
    });
  };

  const filteredUsers = useMemo(() => {
    const searchLower = userSearchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !searchLower ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        (user.phone_number && user.phone_number.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      const r = normalizeRole(user.role);
      if (userRoleFilter === "all") return true;
      if (userRoleFilter === "author") return r === ROLES.USER;
      if (userRoleFilter === "reviewer") return r === ROLES.ADMIN;
      if (userRoleFilter === "admin") return r === ROLES.SUPERADMIN;
      return true;
    }).reverse();
  }, [users, userSearchQuery, userRoleFilter]);

  const getStatusDisplay = (actualStatus) =>
    SUPERADMIN_STATUS_DISPLAY[actualStatus] || actualStatus;

  const getStatusColor = (actualStatus) => {
    const displayStatus = SUPERADMIN_STATUS_DISPLAY[actualStatus] || actualStatus;
    return (
      SUPERADMIN_STATUS_COLORS[displayStatus] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getPaymentBadge = (article) => {
    if (articlePaymentLooksCompleted(article)) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (article.status === ARTICLE_STATUS.PAYMENT_PENDING) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const getPaymentLabel = (article) => {
    if (articlePaymentLooksCompleted(article)) return "To'langan";
    if (article.status === ARTICLE_STATUS.PAYMENT_PENDING) return "Kutilmoqda";
    return "Ochilmadi";
  };

  const uniqueStatuses = useMemo(
    () => uniqueDisplayStatuses(dateFilteredArticles, SUPERADMIN_STATUS_DISPLAY),
    [dateFilteredArticles]
  );

  useEffect(() => {
    const handleOpenArticle = async (event) => {
      const articleId = event.detail?.articleId;
      if (!articleId) return;
      let article = articles.find(
        (a) => a.id === articleId || String(a.id) === String(articleId)
      );
      if (!article) {
        const latest = await loadArticlesFromApi();
        setArticles(latest);
        article = latest.find(
          (a) => a.id === articleId || String(a.id) === String(articleId)
        );
      }
      if (!article) return;

      setDetailArticle(article);
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-article-row="${article.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };

    window.addEventListener("ktri:open-article", handleOpenArticle);
    return () => window.removeEventListener("ktri:open-article", handleOpenArticle);
  }, [articles, loadArticlesFromApi]);

  const showArticles = view === "articles";
  const showUsers = view === "users";
  const showPayments = view === "payments";
  const showDashboardChrome = showArticles || showUsers;

  /* ── Detail panel ── */
  if (detailArticleId) {
    return (
      <SuperAdminDetailPanel
        articleId={detailArticleId}
        onBack={() => setDetailArticleId(null)}
        onActionDone={() => { setDetailArticleId(null); fetchData(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header — maqolalar / foydalanuvchilar */}
      {showDashboardChrome && (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600">
                <FaThLarge className="text-white text-sm" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Monitoring Paneli</h2>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <FaCalendarAlt className="text-slate-400 text-xs" />
                <span className="text-xs font-semibold text-slate-500">Dan</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                />
                <span className="text-xs font-semibold text-slate-500">Gacha</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
              <span className="text-sm text-slate-500">
                {dateFrom || dateTo ? "Tanlangan sana oralig'i bo'yicha" : "Barcha sanalar bo'yicha"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap shrink-0 gap-2">
            <button
              onClick={() => {
                const today = getTodayStr();
                setDateFrom(today);
                setDateTo(today);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaCalendarAlt className="text-slate-400 text-xs" />
              Bugun
            </button>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Tozalash
              </button>
            )}
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaSyncAlt className="text-slate-400 text-xs" />
              Yangilash
            </button>
          </div>
        </div>
      </div>
      )}

      {showArticles && (
        <>
          {/* Articles Stats Section */}
          <div>
            <SectionHeader
              icon={<FaLayerGroup />}
              title="Maqolalar monitoringi"
              color="bg-emerald-500"
              iconColor="text-emerald-600"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatsCard
                icon={<FaNewspaper />}
                iconColor="text-emerald-500"
                title="Jami maqolalar"
                value={dashboardStats.totalArticles}
                badge="Jami"
                badgeColor="text-emerald-500"
                barColor="bg-emerald-500"
                progress={100}
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Barcha maqolalar
                  </span>
                }
              />
              <StatsCard
                icon={<FaClock />}
                iconColor="text-amber-500"
                title="Yangi materiallar"
                value={dashboardStats.newMaterials}
                total={dashboardStats.totalArticles}
                badge="Yangi"
                badgeColor="text-amber-500"
                barColor="bg-amber-400"
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Ko'rib chiqilmagan
                  </span>
                }
              />
              <StatsCard
                icon={<FaUserShield />}
                iconColor="text-indigo-500"
                title="Tayinlanganlar"
                value={dashboardStats.assigned}
                total={dashboardStats.totalArticles}
                badge="Tayinlangan"
                badgeColor="text-indigo-500"
                barColor="bg-indigo-500"
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Taqrizchida
                  </span>
                }
              />
            </div>
          </div>

          {/* Results Stats Section */}
          <div>
            <SectionHeader
              icon={<FaCheckCircle />}
              title="Yakuniy natijalar"
              color="bg-green-500"
              iconColor="text-green-600"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatsCard
                icon={<FaCheckCircle />}
                iconColor="text-green-500"
                title="Qabul qilindi"
                value={dashboardStats.accepted}
                total={dashboardStats.totalArticles}
                badge="Tasdiqlandi"
                badgeColor="text-green-500"
                barColor="bg-green-500"
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Nashrga qabul
                  </span>
                }
              />
              <StatsCard
                icon={<FaTimesCircle />}
                iconColor="text-red-400"
                title="Rad etildi"
                value={dashboardStats.rejected}
                total={dashboardStats.totalArticles}
                badge="Rad etildi"
                badgeColor="text-red-400"
                barColor="bg-red-400"
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Bekor qilingan
                  </span>
                }
              />
              <StatsCard
                icon={<FaCreditCard />}
                iconColor="text-amber-500"
                title="To'lov kutilmoqda"
                value={dashboardStats.paymentPending}
                total={dashboardStats.totalArticles}
                badge="To'lov"
                badgeColor="text-amber-500"
                barColor="bg-amber-400"
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    To'lov kutayotganlar
                  </span>
                }
              />
              <StatsCard
                icon={<FaBookOpen />}
                iconColor="text-teal-500"
                title="Nashr etilgan"
                value={dashboardStats.published}
                total={dashboardStats.totalArticles}
                badge="Nashr"
                badgeColor="text-teal-500"
                barColor="bg-teal-400"
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Jurnalda chop etilgan
                  </span>
                }
              />
              <StatsCard
                icon={<FaMoneyBillWave />}
                iconColor="text-emerald-600"
                title={`Jami daromad (${fallbackStats.revenueCurrency})`}
                value={formatMiqdorUZS(revenueFromTolovlar)}
                badge="Statistika"
                badgeColor="text-emerald-600"
                barColor="bg-emerald-500"
                progress={100}
                valueClassName="text-[1.85rem]"
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Umumiy muvaffaqiyatli to&apos;lovlar
                  </span>
                }
              />
            </div>
          </div>

          {/* Articles Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:mt-20">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FaNewspaper className="text-emerald-500" />
                    <h2 className="text-base font-black text-slate-900">Maqolalar boshqaruvi</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tayinlash, xulosa berish va muharrir xabarlarini boshqarish.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                    {filteredArticles.length} ta maqola
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row">
              <div className="relative flex-1">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Maqola nomi yoki muallif bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered w-full rounded-xl border-slate-200 bg-slate-50 pl-8 text-sm"
                />
              </div>
              <div className="w-full md:w-56">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="select select-bordered w-full rounded-xl border-slate-200 bg-slate-50 text-sm"
                >
                  <option value="all">Barcha statuslar</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th className="text-left">Maqola nomi</th>
                    <th className="text-left">Mualliflar</th>
                    <th className="max-w-28 text-left">Yo'nalish</th>
                    <th className="text-left">Yuborilgan</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">To'lov</th>
                    <th className="text-left">Taqrizchi</th>
                    <th className="w-[1%] whitespace-nowrap px-1 text-center">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center">
                        <span className="loading loading-spinner loading-lg text-emerald-500"></span>
                      </td>
                    </tr>
                  ) : filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FaNewspaper className="text-3xl opacity-30" />
                          <p className="text-sm">Maqolalar topilmadi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((article, idx) => (
                      <tr
                        key={article.id}
                        data-article-row={article.id}
                        className={`border-slate-50 transition hover:bg-slate-50/70 ${
                          article.status === ARTICLE_STATUS.IN_EDITING ? "bg-violet-50/40" : ""
                        }`}
                      >
                        <td className="text-center text-sm font-bold tabular-nums text-slate-500">{idx + 1}</td>
                        <td className="max-w-[180px]">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {article.articleTitle}
                          </p>
                        </td>
                        <td className="text-sm text-slate-500">{article.authorNames}</td>
                        <td className="max-w-28 align-top">
                          {article.category ? (
                            <span
                              className="flex min-w-0 items-start gap-1 text-xs text-slate-500"
                              title={article.category}
                            >
                              <FaTag className="mt-0.5 shrink-0 text-slate-300 text-[10px]" />
                              <span className="line-clamp-2 wrap-break-word leading-snug">{article.category}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="text-xs text-slate-500">
                          {formatDate(article.createdAt || article.submittedAt || article.submittedDate)}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusColor(article.status)}`}
                          >
                            {getStatusDisplay(article.status)}
                          </span>
                          {article.status === ARTICLE_STATUS.IN_EDITING && (
                            <span className="mt-0.5 block text-[10px] text-violet-500">
                              Taqriz tayyor ✓
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getPaymentBadge(article)}`}
                          >
                            {getPaymentLabel(article)}
                          </span>
                          {article.paidAt && (
                            <span className="mt-0.5 block text-[10px] text-slate-400">
                              {formatDate(article.paidAt)}
                            </span>
                          )}
                        </td>
                        <td className="text-xs text-slate-500">
                          {article.assignedTo ? (
                            <span>{article.assignedToName || article.assignedTo}</span>
                          ) : (
                            <span className="text-slate-300">Tayinlanmagan</span>
                          )}
                        </td>
                        <td className="align-middle px-1">
                          <div className="flex flex-nowrap items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setDetailArticleId(article.id)}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                              title="Batafsil"
                            >
                              <FaClipboardList className="text-sm" />
                            </button>
                            {article.articleFileUrl && (
                              <a
                                href={forceHttps(article.articleFileUrl)}
                                download={article.fileName}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                                title="Yuklab olish"
                              >
                                <FaDownload className="text-sm" />
                              </a>
                            )}
                            {canAssignReviewerAction(article) && !article.assignedTo && (
                              <button
                                type="button"
                                onClick={() => handleSubmitArticleToReviewer(article)}
                                disabled={submittingToReviewerId === article.id}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Taqrizchini tayinlash"
                              >
                                {submittingToReviewerId === article.id ? (
                                  <span className="loading loading-spinner loading-xs text-white" />
                                ) : (
                                  <FaUserPlus className="text-sm" />
                                )}
                              </button>
                            )}
                            {article.assignedTo && articleTaqrizKey(article) === "KUTILMOQDA" && (
                              <span
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700"
                                title="Taqriz javobi kutilmoqda"
                                role="status"
                              >
                                <FaClock className="text-sm" />
                              </span>
                            )}
                            {articleTaqrizKey(article) === "QABUL" &&
                              (article.taqrizIzohi?.trim() ? (
                                <button
                                  type="button"
                                  onClick={() => setTaqrizIzohModalArticle(article)}
                                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                                  title="Taqriz qabul — izohni ko'rish"
                                >
                                  <FaCheckCircle className="text-sm" />
                                </button>
                              ) : (
                                <span
                                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  title="Taqriz qabul (izoh yo'q)"
                                  role="status"
                                >
                                  <FaCheckCircle className="text-sm" />
                                </span>
                              ))}
                            {articleTaqrizKey(article) === "RAD" &&
                              (article.taqrizIzohi?.trim() ? (
                                <button
                                  type="button"
                                  onClick={() => setTaqrizIzohModalArticle(article)}
                                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                                  title="Taqriz rad — izohni ko'rish"
                                >
                                  <FaTimesCircle className="text-sm" />
                                </button>
                              ) : (
                                <span
                                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-700"
                                  title="Taqriz rad (izoh yo'q)"
                                  role="status"
                                >
                                  <FaTimesCircle className="text-sm" />
                                </span>
                              ))}
                            {article.status === ARTICLE_STATUS.SUBMITTED && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArticle(article);
                                  setDecisionDescription(article.finalDecisionDescription || "");
                                  setDecisionModalOpen(true);
                                }}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-amber-300 bg-amber-100 text-amber-800 transition hover:bg-amber-200"
                                title="Dastlabki xulosa"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                            )}
                            {article.status === ARTICLE_STATUS.IN_EDITING && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArticle(article);
                                  setFinalDecisionDescription("");
                                  setFinalDecisionModalOpen(true);
                                }}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700"
                                title="Yakuniy qaror"
                              >
                                <FaGavel className="text-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showPayments && (
        <>
          {/* To'lovlar jadvali */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave className="text-amber-600" />
                    <h2 className="text-base font-black text-slate-900">To&apos;lovlar</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    CLICK orqali amalga oshirilgan to&apos;lovlar (faqat ko&apos;rish).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
                    {filteredSortedPayments.length} ta yozuv
                  </span>
                  <button
                    type="button"
                    onClick={fetchData}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FaSyncAlt className="text-[10px] text-slate-400" />
                    Yangilash
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-emerald-100 bg-emerald-50/50 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-900">
                    Oy kesimida jami daromad
                  </p>
                  <p className="mt-0.5 max-w-xl text-[11px] leading-snug text-emerald-900/75">
                    Faqat <span className="font-semibold">muvaffaqiyatli</span> to&apos;lovlar;
                    sana — tranzaksiya{" "}
                    <span className="font-semibold">yaratilgan</span> vaqti bo&apos;yicha guruhlangan.
                  </p>
                </div>
                <select
                  value={paymentRevenueYear}
                  onChange={(e) => setPaymentRevenueYear(e.target.value)}
                  className="select select-bordered select-sm w-full max-w-[220px] shrink-0 rounded-xl border-emerald-200 bg-white text-sm font-semibold text-emerald-950"
                >
                  <option value="all">Barcha yillar</option>
                  {paymentRevenueYears.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}-yil
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 overflow-x-auto rounded-xl border border-emerald-100 bg-white shadow-sm">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/90 text-[11px] font-black uppercase tracking-widest text-emerald-900/70">
                      <th className="text-left">Oy</th>
                      <th className="text-right tabular-nums">Tranzaksiyalar</th>
                      <th className="text-right tabular-nums">Jami daromad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueByMonthFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-sm text-slate-400">
                          Tanlangan davr uchun ma&apos;lumot yo&apos;q
                        </td>
                      </tr>
                    ) : (
                      revenueByMonthFiltered.map((row) => (
                        <tr key={row.key} className="border-slate-50 hover:bg-emerald-50/40">
                          <td className="font-semibold text-slate-800">{row.label}</td>
                          <td className="text-right tabular-nums text-slate-600">{row.count}</td>
                          <td className="text-right tabular-nums text-sm font-black text-emerald-900">
                            {formatMiqdorUZS(row.sum)}{" "}
                            <span className="text-xs font-semibold text-emerald-700">
                              {row.currency}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
              <div className="relative flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  <input
                    type="text"
                    placeholder="ID, maqola, to'lovchi, email, holat..."
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    className="input input-bordered w-full rounded-xl border-slate-200 bg-slate-50 pl-8 text-sm"
                  />
                </div>
                <button
                  type="button"
                  className="btn shrink-0 rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Izlash
                </button>
              </div>
            </div>

            {tolovlarError ? (
              <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {tolovlarError}
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="text-left tabular-nums">ID</th>
                    <th className="text-left">Maqola</th>
                    <th className="text-left">To&apos;lovchi</th>
                    <th className="text-left">Miqdor (UZS)</th>
                    <th className="text-left">To&apos;lov holati</th>
                    <th className="text-left">Maqola holati</th>
                    <th className="text-left">CLICK tranzaksiya ID</th>
                    <th className="text-center">Chek</th>
                    <th className="text-left">
                      <button
                        type="button"
                        onClick={() => togglePaymentSort("yaratilgan")}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-black uppercase tracking-widest transition hover:bg-slate-200/80 ${
                          paymentSort.field === "yaratilgan"
                            ? "bg-slate-200 text-slate-700"
                            : ""
                        }`}
                      >
                        Yaratilgan
                        {paymentSort.field === "yaratilgan" ? (
                          <span className="text-[10px]">
                            {paymentSort.dir === "desc" ? "↓" : "↑"}
                          </span>
                        ) : null}
                      </button>
                    </th>
                    <th className="text-left">
                      <button
                        type="button"
                        onClick={() => togglePaymentSort("yangilangan")}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-black uppercase tracking-widest transition hover:bg-slate-200/80 ${
                          paymentSort.field === "yangilangan"
                            ? "bg-slate-200 text-slate-700"
                            : ""
                        }`}
                      >
                        Yangilangan
                        {paymentSort.field === "yangilangan" ? (
                          <span className="text-[10px]">
                            {paymentSort.dir === "desc" ? "↓" : "↑"}
                          </span>
                        ) : null}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center">
                        <span className="loading loading-spinner loading-lg text-emerald-500"></span>
                      </td>
                    </tr>
                  ) : paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FaCreditCard className="text-3xl opacity-30" />
                          <p className="text-sm">To&apos;lovlar topilmadi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((p) => {
                      const chekHref = resolveChekHref(p.chek_url ?? p.check_url);
                      return (
                      <tr
                        key={p.id ?? `${p.click_trans_id}-${p.yaratilgan}`}
                        className="border-slate-50 transition hover:bg-slate-50/70"
                      >
                        <td className="tabular-nums text-sm font-semibold text-slate-700">
                          {p.id ?? "—"}
                        </td>
                        <td className="max-w-[200px]">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {p.maqola_sarlavha || "—"}
                          </p>
                        </td>
                        <td className="text-sm">
                          <p className="font-bold text-slate-900">
                            {p.tolovchi_ism || "—"}
                          </p>
                          <p className="text-xs text-slate-600">
                            {p.tolovchi_telefon || "—"}
                          </p>
                          <p className="truncate text-xs text-slate-600">
                            {p.tolovchi_email || "—"}
                          </p>
                        </td>
                        <td className="tabular-nums text-sm text-slate-800">
                          {formatMiqdorUZS(p.miqdor)}
                        </td>
                        <td>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${paymentTransactionBadgeClass(p.holat)}`}
                          >
                            {prettyUpperSnakeLabel(p.holat)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${paymentArticleHolatBadgeClass(p.maqola_holat)}`}
                          >
                            {prettyUpperSnakeLabel(p.maqola_holat)}
                          </span>
                        </td>
                        <td className="tabular-nums text-xs text-slate-700">
                          {p.click_trans_id != null ? p.click_trans_id : "—"}
                        </td>
                        <td className="text-center align-middle">
                          {chekHref ? (
                            <a
                              href={chekHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-800 transition hover:bg-sky-100"
                              title="CLICK chek"
                            >
                              <FaExternalLinkAlt className="text-[10px]" />
                              Chek
                            </a>
                          ) : null}
                        </td>
                        <td className="text-xs text-slate-600">
                          {formatAdminTolovDateTime(p.yaratilgan)}
                        </td>
                        <td className="text-xs text-slate-600">
                          {formatAdminTolovDateTime(p.yangilangan)}
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && paymentTotalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Sahifa {paymentPage} / {paymentTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={paymentPage <= 1}
                    onClick={() =>
                      setPaymentPage((x) => Math.max(1, x - 1))
                    }
                    className="btn btn-sm rounded-xl border-slate-200 btn-outline"
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <button
                    type="button"
                    disabled={paymentPage >= paymentTotalPages}
                    onClick={() =>
                      setPaymentPage((x) =>
                        Math.min(paymentTotalPages, x + 1)
                      )
                    }
                    className="btn btn-sm rounded-xl border-slate-200 btn-outline"
                  >
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {showUsers && (
        <>
          {/* Users Section */}
          <div>
            <SectionHeader
              icon={<FaUserFriends />}
              title="Foydalanuvchilar nazorati"
              color="bg-blue-500"
              iconColor="text-blue-600"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatsCard
                icon={<FaUsers />}
                iconColor="text-blue-500"
                title="Mualliflar"
                value={dashboardStats.totalAuthors}
                badge="Muallif"
                badgeColor="text-blue-500"
                barColor="bg-blue-500"
                progress={100}
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Ro'yxatni ko'rish
                  </span>
                }
              />
              <StatsCard
                icon={<FaUserCog />}
                iconColor="text-amber-600"
                title="Taqrizchilar"
                value={dashboardStats.totalReviewers}
                badge="Taqrizchi"
                badgeColor="text-amber-600"
                barColor="bg-amber-500"
                progress={100}
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Tizim taqrizchilar
                  </span>
                }
              />
              <StatsCard
                icon={<FaUserFriends />}
                iconColor="text-teal-600"
                title="Jami foydalanuvchilar"
                value={dashboardStats.totalAllUsers}
                badge="Jami"
                badgeColor="text-teal-600"
                barColor="bg-teal-500"
                progress={100}
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Barcha akkauntlar
                  </span>
                }
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-blue-500" />
                    <h2 className="text-base font-black text-slate-900">Foydalanuvchilar boshqaruvi</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Mualliflar va taqrizchilar rollarini nazorat qilish.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                    {dashboardStats.totalAuthors} muallif
                  </span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-100">
                    {dashboardStats.totalReviewers} taqrizchi
                  </span>
                  {/* <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-100">
                    {dashboardStats.totalStaffAdmins} admin
                  </span> */}
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 ring-1 ring-teal-100">
                    {dashboardStats.totalAllUsers} jami
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Ism, familiya, email yoki telefon bo'yicha qidirish..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="input input-bordered w-full rounded-xl border-slate-200 bg-slate-50 pl-8 text-sm"
                />
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-56 sm:shrink-0">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="select select-bordered w-full rounded-xl border-slate-200 bg-slate-50 text-sm"
                >
                  <option value="all">Barcha rollar</option>
                  <option value="author">Muallif</option>
                  <option value="reviewer">Taqrizchi</option>
                  <option value="admin">Admin</option>
                </select>
                <span className="text-center text-[11px] font-semibold text-slate-500 sm:text-right">
                  Ko&apos;rsatilmoqda: {filteredUsers.length} ta
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th className="text-left">Ism Familiya</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Telefon</th>
                    <th className="text-left">Rol</th>
                    <th className="text-center">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FaUsers className="text-3xl opacity-30" />
                          <p className="text-sm">Foydalanuvchilar topilmadi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, idx) => (
                      <tr key={user.id ?? user.email} className="border-slate-50 transition hover:bg-slate-50/70">
                        <td className="text-center text-sm font-bold tabular-nums text-slate-500">{idx + 1}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600">
                              {(user.first_name?.[0] || "").toUpperCase()}{(user.last_name?.[0] || "").toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-900">
                              {user.first_name} {user.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="text-sm text-slate-500">{user.email}</td>
                        <td className="text-sm text-slate-500">{user.phone_number || "—"}</td>
                        <td>
                          {user.role === ROLES.ADMIN ? (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                              Taqrizchi
                            </span>
                          ) : user.role === ROLES.SUPERADMIN ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                              Muallif
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeUserRole(user, e.target.value)}
                            disabled={user.email === userData?.email}
                            className="select select-bordered select-sm rounded-xl border-slate-200 bg-slate-50 text-xs font-semibold"
                            title={user.email === userData?.email ? "O'zingizning rolingizni o'zgartirib bo'lmaydi" : "Rolni o'zgartirish"}
                          >
                            <option value={ROLES.USER}>Muallif</option>
                            <option value={ROLES.ADMIN}>Taqrizchi</option>
                            <option value={ROLES.SUPERADMIN}>Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Taqriz izohi (faqat qabul/rad + izoh mavjud bo'lganda tugma orqali) */}
      <Modal
        isOpen={taqrizIzohModalArticle != null}
        onClose={() => setTaqrizIzohModalArticle(null)}
        title={
          articleTaqrizKey(taqrizIzohModalArticle) === "RAD"
            ? "Taqriz rad — izoh"
            : "Taqriz qabul — izoh"
        }
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500">
            {taqrizIzohModalArticle?.articleTitle}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {taqrizIzohModalArticle?.taqrizIzohi?.trim() || "—"}
          </p>
          <div className="flex justify-end pt-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setTaqrizIzohModalArticle(null)}>
              Yopish
            </button>
          </div>
        </div>
      </Modal>

      {/* Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => {
          setDecisionModalOpen(false);
          setSelectedArticle(null);
          setDecisionDescription("");
        }}
        title="Dastlabki xulosa berish"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Maqola:</h3>
            <p className="text-gray-600">{selectedArticle?.articleTitle}</p>
          </div>

          {selectedArticle?.reviewFile && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2">
                <FaFileUpload className="text-purple-600" />
                <p className="font-semibold text-purple-900 text-sm">Taqrizchi xulosasi</p>
              </div>
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-purple-400 shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Fayl: </span>
                  <span className="font-medium">{selectedArticle.reviewFile}</span>
                </p>
              </div>
              {selectedArticle.reviewFileUrl && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={forceHttps(selectedArticle.reviewFileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-sm font-medium"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                    Faylni ko'rish
                  </a>
                  <a
                    href={forceHttps(selectedArticle.reviewFileUrl)}
                    download={selectedArticle.reviewFile}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <FaDownload className="text-xs" />
                    Yuklab olish
                  </a>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Muallif uchun izoh <span className="text-red-500">(rad etishda majburiy)</span>
            </label>
            <textarea
              value={decisionDescription}
              onChange={(e) => setDecisionDescription(e.target.value)}
              className="textarea textarea-bordered w-full h-28"
              placeholder="Masalan: Qo'shimcha hujjat kerak."
            />
          </div>

          <p className="text-sm text-gray-600">
            To'lovga yuborilganda maqola holati to'lov kutilmoqda bo'ladi. Rad etilganda sabab majburiy.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleQuickDecision(selectedArticle, "accept")}
              className="btn btn-success flex-1 gap-2"
            >
              <FaCheckCircle />
              To'lovga yuborish
            </button>
            <button
              onClick={() => handleQuickDecision(selectedArticle, "reject")}
              className="btn btn-error flex-1 gap-2"
            >
              <FaTimesCircle />
              Rad etish
            </button>
          </div>
        </div>
      </Modal>

      {/* Final Decision Modal — taqrizchi xulosasi kelgandan keyin */}
      <Modal
        isOpen={finalDecisionModalOpen}
        onClose={() => {
          setFinalDecisionModalOpen(false);
          setSelectedArticle(null);
          setFinalDecisionDescription("");
        }}
        title="Yakuniy qaror"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Maqola</p>
            <p className="mt-1 font-semibold text-slate-800">{selectedArticle?.articleTitle}</p>
          </div>

          {/* Taqrizchi xulosasi */}
          {selectedArticle?.reviewConclusion && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-purple-600" />
                <p className="font-semibold text-purple-900 text-sm">Taqrizchi xulosasi</p>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selectedArticle.reviewDecision === "review_accepted"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {selectedArticle.reviewDecision === "review_accepted" ? "✓ Qabul tavsiya" : "✗ Rad tavsiya"}
                </span>
              </div>
              <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-purple-100 leading-relaxed">
                {selectedArticle.reviewConclusion}
              </p>
              {selectedArticle.reviewFile && (
                <div className="flex items-center gap-2 text-xs text-purple-600">
                  <FaFileUpload className="text-[10px]" />
                  {selectedArticle.reviewFile}
                  {selectedArticle.reviewFileUrl && (
                    <a href={forceHttps(selectedArticle.reviewFileUrl)} download className="ml-1 underline hover:text-purple-800">
                      Yuklab olish
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Muallif uchun xabar <span className="text-red-500">(rad etishda majburiy)</span>
            </label>
            <textarea
              value={finalDecisionDescription}
              onChange={(e) => setFinalDecisionDescription(e.target.value)}
              className="textarea textarea-bordered w-full h-24 text-sm"
              placeholder="Masalan: Qo'shimcha hujjat kerak."
            />
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Yakuniy qarordan so'ng muallif SMS va bildirishnoma oladi. Bu qaror qaytarib bo'lmaydi.
          </p>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleFinalDecision(selectedArticle, "accept")}
              className="btn btn-success flex-1 gap-2"
            >
              <FaCheckCircle />Qabul qilish
            </button>
            <button
              onClick={() => handleFinalDecision(selectedArticle, "reject")}
              className="btn btn-error flex-1 gap-2"
            >
              <FaTimesCircle />Rad etish
            </button>
          </div>
        </div>
      </Modal>

      <ArticleDetailModal
        isOpen={detailArticle !== null}
        onClose={() => setDetailArticle(null)}
        article={detailArticle}
        role="superadmin"
      />
    </div>
  );
}

export default SuperAdminDashboard;
