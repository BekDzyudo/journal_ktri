import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaNewspaper, FaCheckCircle, FaTimesCircle,
  FaPlus, FaCreditCard, FaArrowLeft, FaDownload, FaExternalLinkAlt,
  FaSearch, FaSyncAlt, FaCalendarAlt, FaArrowRight, FaLayerGroup,
  FaUser, FaFileAlt, FaBookOpen, FaBan, FaGlobe, FaQuoteLeft,
  FaJournalWhills, FaHashtag, FaBook,
} from "react-icons/fa";
import { useNotifications } from "../../../context/NotificationContext.jsx";
import { toast } from "react-toastify";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import {
  ARTICLE_STATUS,
  MUALLIF_API_HOLAT_LABELS,
  MUALLIF_API_HOLAT_COLORS,
  MUALLIF_API_HOLAT,
} from "../../../constants/roles.js";
import { inferMuallifHolatKeyForPanel, normalizeMaqolaForDashboard, normalizeMaqolalarList } from "../../../utils/maqolaApi.js";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import {
  filterArticlesByDateRange,
  articleMatchesSearch,
  getArticleDate,
  formatArticleDateTime,
  formatDate,
} from "../../../utils/articleDashboardHelpers.js";
import { syncArticleStatusNotifications } from "../../../utils/articleStatusNotifications.js";
import useGetFetch from "../../../hooks/useGetFetch.jsx";

const MUALLIF_HOLAT_FILTER_ORDER = Object.values(MUALLIF_API_HOLAT);

function resolveMediaUrl(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  if (!base) return s;
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** To'lov uchun id resolver - maqola obyektidan ID ni chiqarib olish */
function resolveArticleIdForPayment(input) {
  if (input == null) return null;
  if (typeof input !== "object" || Array.isArray(input)) return input;
  const id = input.id ?? input.pk ?? input.uuid;
  return id != null && id !== "" ? id : null;
}

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
  if (!value) return null;
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50 p-4 ${className}`}>
      <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 leading-relaxed">{value}</p>
    </div>
  );
}

function ArticleDetailPanel({ articleId, profilePayload, onBack, onPay, enableTestClickPay = false }) {
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
          `${base}/profil/maqolalar/${articleId}/`,
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

  const holat = data?.holat ?? "";
  const holatKey = inferMuallifHolatKeyForPanel({ holat, status: holat?.toLowerCase() });
  const badgeClass = MUALLIF_API_HOLAT_COLORS[holatKey] || "bg-gray-100 text-gray-800 border-gray-200";
  const badgeLabel = MUALLIF_API_HOLAT_LABELS[holatKey] || holat || "—";

  const pdfUrl = resolveMediaUrl(data?.pdf || data?.fayl || data?.articleFileUrl || null);

  const downloadFile = async () => {
    if (!pdfUrl) return;
    try {
      const res = await fetchWithAuth(pdfUrl, { method: "GET" }, getAccessToken, refreshAccessToken);
      if (!res.ok) throw new Error("fetch_failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = data?.fayl_nomi || data?.fileName || "maqola.doc";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      // CORS yoki xatolik: to'g'ridan-to'g'ri URL orqali yuklab olish
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = data?.fayl_nomi || data?.fileName || "maqola.doc";
      // a.target = "_blank";
      a.rel = "noreferrer noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

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
          <span className="loading loading-spinner loading-lg text-blue-600" />
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
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600">
                  <FaNewspaper className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Maqola tafsilotlari · #{data.id}</p>
                  <h2 className="mt-1 text-xl font-black leading-snug text-slate-900">{data.sarlavha || "Nomsiz maqola"}</h2>
                </div>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}>
                {badgeLabel}
              </span>
            </div>

            {/* Meta chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {data.rukn?.nom && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
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
                  <FaCalendarAlt className="text-[9px]" />{formatArticleDateTime(data.yuborilgan_vaqt)}
                </span>
              )}
              {data.nashr_sanasi && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  Nashr: {formatDate(data.nashr_sanasi)}
                </span>
              )}
            </div>
          </div>

          {/* Authors */}
          {Array.isArray(data.muallif) && data.muallif.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaUser />} title="Mualliflar" color="bg-violet-500" iconColor="text-violet-600" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[...data.muallif]
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

          {/* Journal issue */}
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

          {/* Keywords */}
          {(data.kalit_sozlar_list?.length > 0 || data.kalit_sozlar) && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaHashtag />} title="Kalit so'zlar" color="bg-amber-500" iconColor="text-amber-600" />
              <div className="flex flex-wrap gap-2">
                {(data.kalit_sozlar_list?.length > 0
                  ? data.kalit_sozlar_list
                  : data.kalit_sozlar.split(",").map((s) => s.trim()).filter(Boolean)
                ).map((kw, i) => (
                  <span key={i} className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Annotation */}
          {data.annotatsiya && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaBookOpen />} title="Annotatsiya" color="bg-blue-500" iconColor="text-blue-600" />
              <p className="text-sm leading-7 text-slate-700">{data.annotatsiya}</p>
            </div>
          )}

          {/* References */}
          {data.adabiyotlar && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaBook />} title="Adabiyotlar" color="bg-indigo-500" iconColor="text-indigo-600" />
              <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">{data.adabiyotlar}</p>
            </div>
          )}

          {/* How to cite */}
          {/* {data.how_to_cite && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeader icon={<FaQuoteLeft />} title="Iqtibos keltirish" color="bg-slate-500" iconColor="text-slate-600" />
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm italic leading-7 text-slate-600">{data.how_to_cite}</p>
              </div>
            </div>
          )} */}

          {/* Rejection reason */}
          {data.rad_sababi && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FaBan className="text-red-500" />
                <p className="text-sm font-black uppercase tracking-wider text-red-600">Rad etilish sababi</p>
              </div>
              <p className="text-sm leading-6 text-red-700">{data.rad_sababi}</p>
            </div>
          )}

          {/* File + payment */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionHeader icon={<FaFileAlt />} title="Fayl va amallar" color="bg-sky-500" iconColor="text-sky-600" />
            <div className="flex flex-wrap gap-3">
              {enableTestClickPay && data.holat === "TOLOV_KUTILMOQDA" && (
                <button
                  onClick={() => onPay({ id: data.id, articleTitle: data.sarlavha })}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  <FaCreditCard />
                  CLICK orqali to'lash
                </button>
              )}
              {pdfUrl && (
                <button
                  type="button"
                  onClick={downloadFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <FaDownload className="text-xs" />
                  Yuklab olish
                </button>
              )}
              {!pdfUrl && data.holat !== "TOLOV_KUTILMOQDA" && (
                <p className="text-sm text-slate-400">Fayl hali yuklanmagan.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserDashboard({ userData, profilePayload: initialProfilePayload = null }) {
  const navigate = useNavigate();
  const { refresh: refreshAccessToken } = useContext(AuthContext);
  const { refresh: refreshNotifications } = useNotifications();
  const [articles, setArticles] = useState([]);
  const [profilePayload, setProfilePayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [stats, setStats] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Statistika — alohida, mustaqil fetch
  useEffect(() => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base || !getAccessToken()) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${base}/profil/statistika/`, { method: "GET" }, getAccessToken, refreshAccessToken);
        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
        if (!cancelled) {
          if (res.ok) {
            if (json) setStats(json);
          }
        }
      } catch (e) {
        // Silent error
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refreshAccessToken]);

  // Yagona maqolalar fetch funksiyasi — profil/maqolalar/ → profil/ zaxirasi
  const fetchArticles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

    if (!base || !getAccessToken()) {
      setArticles([]);
      setLoading(false);
      return;

    }

    try {
      let list = null;

      // profil/ dan maqolalar olamiz
      const profilRes = await fetchWithAuth(`${base}/profil/`, { method: "GET" }, getAccessToken, refreshAccessToken);
      const t = await profilRes.text();
      let j = null;
      try { j = t ? JSON.parse(t) : null; } catch { j = null; }
      if (profilRes.ok && j) {
        setProfilePayload(j);
        list = normalizeMaqolalarList(j);
      } else {
        toast.error(parseApiError(j, "Maqolalar ro'yxatini yuklashda xatolik"));
        list = [];
      }

      syncArticleStatusNotifications({
        articles: list,
        userData,
        userRole: "user",
        scope: "user-dashboard",
      });
      setArticles(list);
    } catch (err) {
      toast.error("Maqolalarni yuklashda xatolik yuz berdi");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [userData, refreshAccessToken]);

  // Profil info AdminPanel dan kelsa — faqat profilePayload saqlaymiz (articles emas)
  useEffect(() => {
    if (initialProfilePayload) {
      setProfilePayload(initialProfilePayload);
    }
  }, [initialProfilePayload]);

  // Birinchi yuklash — token tayyor bo'lganda
  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateFilteredArticles = useMemo(
    () => filterArticlesByDateRange(articles, dateFrom, dateTo),
    [articles, dateFrom, dateTo]
  );

  const localStats = useMemo(() => ({
    total: articles.length,
    submitted: articles.filter((a) => a.holat === "YUBORILGAN" || a.status === ARTICLE_STATUS.SUBMITTED).length,
    paymentPending: articles.filter((a) => a.holat === "TOLOV_KUTILMOQDA" || a.status === ARTICLE_STATUS.PAYMENT_PENDING).length,
    accepted: articles.filter((a) => a.status === ARTICLE_STATUS.ACCEPTED).length,
    rejected: articles.filter((a) => a.status === ARTICLE_STATUS.REJECTED).length,
    nashrEtilgan: articles.filter((a) => a.status === ARTICLE_STATUS.PUBLISHED).length,
  }), [articles]);

  const dashboardStats = useMemo(() => {
    if (!stats) return { ...localStats };
    return {
      total: stats.jami ?? localStats.total,
      submitted: stats.yuborilgan ?? localStats.submitted,
      paymentPending: stats.tolov_kutilmoqda ?? localStats.paymentPending,
      accepted: stats.qabul_qilingan ?? localStats.accepted,
      rejected: stats.rad_etilgan ?? localStats.rejected,
      nashrEtilgan: stats.nashr_etilgan ?? localStats.nashrEtilgan,
    };
  }, [stats, localStats]);

  const filteredArticles = useMemo(
    () =>
      dateFilteredArticles.filter((article) => {
        if (!articleMatchesSearch(article, searchQuery)) return false;
        const holatKey = inferMuallifHolatKeyForPanel(article);
        return filterStatus === "all" || filterStatus === holatKey;
      }),
    [dateFilteredArticles, searchQuery, filterStatus]
  );

  const viteBase = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

  const muallifHolatBadgeClass = (article) =>
    MUALLIF_API_HOLAT_COLORS[inferMuallifHolatKeyForPanel(article)] || "bg-gray-100 text-gray-800 border-gray-200";

  const muallifHolatLabel = (article) => {
    const holatKey = inferMuallifHolatKeyForPanel(article);
    return MUALLIF_API_HOLAT_LABELS[holatKey] || article?.holat || article?.status || "—";
  };

  const handlePay = async (article) => {
    const payId = resolveArticleIdForPayment(article);
    if (payId == null || payId === "") {
      toast.error("Maqola ID topilmadi — ro'yxat yoki ma'lumotlarni yangilang.");
      return;
    }

    if (!viteBase || !getAccessToken()) {
      toast.error("Backend konfiguratsiyasi yoki token mavjud emas.");
      return;
    }

    try {
      // Real CLICK to'lov API ga so'rov yuborish (GET metodi)
      const res = await fetchWithAuth(
        `${viteBase}/v1/tolov/boshlash/${payId}/`,
        { method: "GET" },
        getAccessToken,
        refreshAccessToken
      );
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      
      if (!res.ok) {
        throw new Error(parseApiError(json, "To'lovni boshlashda xatolik"));
      }
      
      // Backend dan CLICK URL qaytishi kerak
      if (json?.click_url) {
        // CLICK ga borishdan oldin maqola ID ni saqlash (return_url da kerak bo'ladi)
        sessionStorage.setItem('pending_payment_article_id', payId);
        // CLICK to'lov sahifasiga yo'naltirish
        window.location.href = json.click_url;
      } else if (json?.payment_url) {
        sessionStorage.setItem('pending_payment_article_id', payId);
        window.location.href = json.payment_url;
      } else {
        toast.success("To'lov so'rovi yuborildi. Iltimos, kuting...");
        // To'lov holati tekshirish
        setTimeout(() => {
          refreshNotifications();
          fetchArticles();
          setSelectedArticle(null);
        }, 2000);
      }
    } catch (e) {
      toast.error(e?.message || "To'lovni boshlashda xatolik");
    }
  };

  const handleSelectArticle = (article) => {
    setSelectedArticle(article.id ?? article);
  };

  /* ---- Detail view ---- */
  if (selectedArticle) {
    return (
      <ArticleDetailPanel
        articleId={selectedArticle}
        profilePayload={profilePayload}
        onBack={() => setSelectedArticle(null)}
        onPay={handlePay}
        enableTestClickPay={true}
      />
    );
  }

  /* ---- List view ---- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600">
                <FaNewspaper className="text-white text-sm" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Muallif Paneli</h2>
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

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              onClick={() => { const t = getTodayStr(); setDateFrom(t); setDateTo(t); }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaCalendarAlt className="text-slate-400 text-xs" />
              Bugun
            </button>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Tozalash
              </button>
            )}
            <button
              onClick={fetchArticles}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaSyncAlt className="text-slate-400 text-xs" />
              Yangilash
            </button>
            <button
              onClick={() => navigate("/send-article")}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <FaPlus className="text-xs" />
              Yangi maqola
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <SectionHeader icon={<FaLayerGroup />} title="Maqolalar monitoringi" color="bg-blue-500" iconColor="text-blue-600" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatsCard icon={<FaNewspaper />} iconColor="text-blue-500" title="Jami" value={dashboardStats.total}
            badge="Hammasi" badgeColor="text-blue-500" barColor="bg-blue-500" progress={100}
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Barcha</span>} />
          <StatsCard icon={<FaArrowRight />} iconColor="text-sky-500" title="Yuborilgan" value={dashboardStats.submitted}
            total={dashboardStats.total} badge="Yangi" badgeColor="text-sky-500" barColor="bg-sky-400"
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Ko'rilmagan</span>} />
          <StatsCard icon={<FaCreditCard />} iconColor="text-amber-500" title="To'lov kutilmoqda" value={dashboardStats.paymentPending}
            total={dashboardStats.total} badge="To'lov" badgeColor="text-amber-500" barColor="bg-amber-400"
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />To'lov kutilmoqda</span>} />
          <StatsCard icon={<FaCheckCircle />} iconColor="text-green-500" title="Qabul qilindi" value={dashboardStats.accepted}
            total={dashboardStats.total} badge="Tasdiqlandi" badgeColor="text-green-500" barColor="bg-green-500"
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Tasdiqlangan</span>} />
          <StatsCard icon={<FaTimesCircle />} iconColor="text-red-400" title="Rad etildi" value={dashboardStats.rejected}
            total={dashboardStats.total} badge="Qaytarildi" badgeColor="text-red-400" barColor="bg-red-400"
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Bekor</span>} />
          <StatsCard icon={<FaGlobe />} iconColor="text-teal-500" title="Nashr etilgan" value={dashboardStats.nashrEtilgan}
            total={dashboardStats.total} badge="Nashr" badgeColor="text-teal-500" barColor="bg-teal-400"
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Chop etilgan</span>} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <FaNewspaper className="text-blue-500" />
            <h2 className="text-base font-black text-slate-900">Maqolalar ro'yxati</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{filteredArticles.length} ta yozuv ko'rsatilmoqda</p>
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
              {MUALLIF_HOLAT_FILTER_ORDER.map((holatKey) => (
                <option key={holatKey} value={holatKey}>{MUALLIF_API_HOLAT_LABELS[holatKey]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="text-left">Maqola nomi</th>
                <th className="text-left">Mualliflar</th>
                <th className="text-left">Yuborilgan vaqt</th>
                <th className="text-left">Status</th>
                <th className="text-center">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <span className="loading loading-spinner loading-lg text-blue-500"></span>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FaNewspaper className="text-3xl opacity-30" />
                      <p className="text-sm">Maqolalar topilmadi</p>
                      <button
                        onClick={() => navigate("/send-article")}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        <FaPlus className="text-[10px]" />
                        Birinchi maqolani yuborish
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-slate-50 transition hover:bg-slate-50/70"
                  >
                    <td className="max-w-[220px]">
                      <p className="truncate text-sm font-semibold text-slate-900">{article.articleTitle}</p>
                    </td>
                    <td className="text-sm text-slate-500 max-w-[160px]">
                      <p className="truncate">{article.authorNames}</p>
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {formatArticleDateTime(getArticleDate(article))}
                    </td>
                    <td>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${muallifHolatBadgeClass(article)}`}>
                        {muallifHolatLabel(article)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        {article.status === ARTICLE_STATUS.PAYMENT_PENDING && (
                          <button
                            onClick={() => handlePay(article)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                          >
                            <FaCreditCard className="text-[10px]" />
                            CLICK
                          </button>
                        )}
                        <button
                          onClick={() => handleSelectArticle(article)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          Batafsil
                          <FaArrowRight className="text-[10px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
