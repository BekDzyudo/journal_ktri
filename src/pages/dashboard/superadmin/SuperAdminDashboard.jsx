import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import {
  FaNewspaper, FaUsers, FaUserShield, FaCheckCircle, FaTimesCircle,
  FaSearch, FaTag, FaFileAlt,
  FaDownload, FaExternalLinkAlt, FaClock,
  FaSyncAlt, FaCalendarAlt, FaArrowRight, FaThLarge, FaLayerGroup,
  FaUserFriends, FaGavel, FaUserCog, FaArrowLeft, FaUser,
  FaBookOpen, FaBan, FaHashtag, FaBook, FaQuoteLeft, FaJournalWhills,
  FaCreditCard, FaClipboardList,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import { fakeArticleApi } from "../../../utils/fakeArticleApi.js";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { normalizeMaqolalarList, inferMuallifHolatKeyForPanel, normalizeMaqolaForDashboard } from "../../../utils/maqolaApi.js";
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

function resolveAdminMediaUrl(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
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

          {/* Taqrizchi */}
          {normalizedArticle?.assignedTo && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaClipboardList />} title="Taqrizchi" color="bg-rose-500" iconColor="text-rose-600" />
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoBlock label="Taqrizchi" value={normalizedArticle.assignedToName || normalizedArticle.assignedTo} />
              </div>
            </div>
          )}

          {/* Fayl */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionHeader icon={<FaFileAlt />} title="Fayl" color="bg-sky-500" iconColor="text-sky-600" />
            {pdfUrl ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open(pdfUrl, "_blank", "noopener,noreferrer");
                    if (!win) toast.info("Yangi oynani ochib bo'lmadi. Yuklab oling.");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <FaExternalLinkAlt className="text-xs" />
                  Faylni ko'rish
                </button>
                <a
                  href={pdfUrl}
                  download=""
                  target="_blank"
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
    totalAuthors: authors.length,
    totalReviewers: reviewers.length,
    totalStaffAdmins: staffAdmins.length,
    totalAllUsers: allUsers.length,
    totalUsers: authors.length,
    totalAdmins: reviewers.length,
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

function normalizeStatistikaPayload(raw, fallbackStats) {
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

  /** Admin API: { maqolalar: { jami, yangi, ... }, foydalanuvchilar: { mualliflar, taqrizchilar } } */
  if (maq || usersBlock) {
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
        console.warn(
          "[admin/statistika/] xatolik:",
          parseApiError(json, `${res.status} ${res.statusText || ""}`.trim())
        );
        return null;
      }

      return json;
    } catch (err) {
      console.warn("[admin/statistika/] so'rov xatoligi:", err?.message);
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
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [finalDecisionModalOpen, setFinalDecisionModalOpen] = useState(false);
  const [finalDecisionDescription, setFinalDecisionDescription] = useState("");
  const [detailArticle, setDetailArticle] = useState(null);
  const [detailArticleId, setDetailArticleId] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [decisionDescription, setDecisionDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [articlesData, statsApiData, usersData] = await Promise.all([
        loadArticlesFromApi(),
        loadStatsFromApi(),
        loadUsersFromApi(),
      ]);
      const normalizedUsers = usersData;
      const adminUsers = normalizedUsers.filter((u) => u.role === ROLES.ADMIN);

      syncArticleStatusNotifications({
        articles: articlesData,
        userData,
        userRole: ROLES.SUPERADMIN,
        scope: "superadmin-dashboard",
      });
      setArticles(articlesData);
      setStatsData(statsApiData);
      setUsers(normalizedUsers);
      setAdmins(adminUsers);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(
        "Ma'lumotlarni yuklashda xatolik" +
          (error?.message ? `: ${error.message}` : "")
      );
    } finally {
      setLoading(false);
    }
  }, [userData, loadArticlesFromApi, loadStatsFromApi, loadUsersFromApi]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleAssignToAdmin = async () => {
    if (!selectedAdmin) {
      toast.error("Taqrizchini tanlang");
      return;
    }
    try {
      await fakeArticleApi.assignReviewer(selectedArticle.id, selectedAdmin);
      toast.success("Taqrizchi muvaffaqiyatli tayinlandi!");
      refreshNotifications();
      setAssignModalOpen(false);
      setSelectedArticle(null);
      setSelectedAdmin("");
      fetchData();
    } catch (error) {
      console.error("Error assigning article:", error);
      toast.error("Tayinlashda xatolik: " + error.message);
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
      console.error("Error making decision:", error);
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
      console.error("Error final decision:", error);
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
      console.error("Error changing user role:", error);
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

  const dashboardStats = useMemo(
    () => normalizeStatistikaPayload(statsData, fallbackStats),
    [statsData, fallbackStats]
  );

  useEffect(() => {
    console.log("[statistika] API (statsData)", statsData);
    console.log("[statistika] fallback (maqola/ro'yxatdan)", fallbackStats);
    console.log("[statistika] panel (kartalar uchun)", dashboardStats);
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
    });
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
    if (article.paymentStatus === "paid" || article.paidAt) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (article.status === ARTICLE_STATUS.PAYMENT_PENDING) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const getPaymentLabel = (article) => {
    if (article.paymentStatus === "paid" || article.paidAt) return "To'langan";
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

  const showArticles = view !== "users";
  const showUsers = view !== "articles";

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
      {/* Dashboard Header */}
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

          <div className="flex shrink-0 gap-2">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </div>

          {/* Articles Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
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
                    <th className="text-left">Yo'nalish</th>
                    <th className="text-left">Yuborilgan</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">To'lov</th>
                    <th className="text-left">Taqrizchi</th>
                    <th className="text-center">Rolni o'zgartirish</th>
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
                        <td>
                          {article.category ? (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <FaTag className="text-slate-300 text-[10px]" />
                              {article.category}
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
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setDetailArticleId(article.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                              title="Batafsil ko'rish"
                            >
                              <FaClipboardList className="text-[11px]" />
                              Batafsil
                            </button>
                            {article.articleFileUrl && (
                              <a
                                href={article.articleFileUrl}
                                download={article.fileName}
                                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-50"
                                title="Yuklab olish"
                              >
                                <FaDownload className="text-sm" />
                              </a>
                            )}
                            {[ARTICLE_STATUS.PAID, ARTICLE_STATUS.ASSIGNED].includes(article.status) && (
                              <button
                                onClick={() => {
                                  setSelectedArticle(article);
                                  setSelectedAdmin(article.assignedTo || "");
                                  setAssignModalOpen(true);
                                }}
                                className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
                                title={article.assignedTo ? "Taqrizchini almashtirish" : "Taqrizchiga tayinlash"}
                              >
                                <FaUserShield className="text-sm" />
                              </button>
                            )}
                            {article.status === ARTICLE_STATUS.SUBMITTED && (
                              <button
                                onClick={() => {
                                  setSelectedArticle(article);
                                  setDecisionDescription(article.finalDecisionDescription || "");
                                  setDecisionModalOpen(true);
                                }}
                                className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-200"
                                title="Dastlabki xulosa berish"
                              >
                                Xulosa
                              </button>
                            )}
                            {article.status === ARTICLE_STATUS.IN_EDITING && (
                              <button
                                onClick={() => {
                                  setSelectedArticle(article);
                                  setFinalDecisionDescription("");
                                  setFinalDecisionModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-700"
                                title="Taqrizchi xulosasiga asosan yakuniy qaror"
                              >
                                <FaGavel className="text-[10px]" />
                                Qaror
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
                value={dashboardStats.totalStaffAdmins}
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
                    {dashboardStats.totalStaffAdmins} taqrizchi
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

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedArticle(null);
          setSelectedAdmin("");
        }}
        title={selectedArticle?.assignedTo ? "Taqrizchini almashtirish" : "Taqrizchiga tayinlash"}
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Maqola:</h3>
            <p className="text-gray-600">{selectedArticle?.articleTitle}</p>
            {selectedArticle?.assignedTo && (
              <p className="text-xs text-gray-500 mt-1">Joriy taqrizchi: {selectedArticle.assignedTo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taqrizchini tanlang
            </label>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">Taqrizchini tanlang...</option>
              {admins.map((admin) => (
                <option key={admin.email} value={admin.email}>
                  {admin.first_name} {admin.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setAssignModalOpen(false);
                setSelectedArticle(null);
                setSelectedAdmin("");
              }}
              className="btn btn-ghost"
            >
              Bekor qilish
            </button>
            <button onClick={handleAssignToAdmin} className="btn btn-primary" disabled={!selectedAdmin}>
              Saqlash
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
                    href={selectedArticle.reviewFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-sm font-medium"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                    Faylni ko'rish
                  </a>
                  <a
                    href={selectedArticle.reviewFileUrl}
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
                    <a href={selectedArticle.reviewFileUrl} download className="ml-1 underline hover:text-purple-800">
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
