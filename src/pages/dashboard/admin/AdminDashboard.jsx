import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import {
  FaNewspaper, FaClock, FaCheckCircle,
  FaFileAlt, FaSearch, FaSyncAlt, FaCalendarAlt,
  FaArrowRight, FaLayerGroup, FaUserSecret,
  FaDownload,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal.jsx";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import { ARTICLE_STATUS, ADMIN_STATUS_DISPLAY, ADMIN_STATUS_COLORS } from "../../../constants/roles.js";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import { parseApiError } from "../../../utils/apiError.js";
import { normalizeTaqrizchiMaqolalarList } from "../../../utils/maqolaApi.js";
import { AuthContext } from "../../../context/AuthContext.jsx";
import {
  filterArticlesByDisplayStatus,
  filterArticlesByDateRange,
  uniqueDisplayStatuses,
  formatDate,
} from "../../../utils/articleDashboardHelpers.js";
import { useNotifications } from "../../../context/NotificationContext.jsx";
import { syncArticleStatusNotifications } from "../../../utils/articleStatusNotifications.js";

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
/** Maqola asosiy fayli (.fayl) — nisbiy yo'l bo'lsa VITE_BASE_URL ga qo'shiladi */
function forceHttps(url) {
  return url ? String(url).replace(/^http:\/\//i, "https://") : url;
}

function resolveArticleFileHref(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return forceHttps(s);
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const resolved = s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
  return forceHttps(resolved);
}

function hasSubmittedTaqrizDecision(article) {
  const th = article?.taqrizHolati;
  return th === "QABUL" || th === "RAD";
}

function needsTaqrizQarorAction(article) {
  if (hasSubmittedTaqrizDecision(article)) return false;
  if (article?.reviewFile) return false;
  /* Muallif paneli holati (masalan QABUL_QILINGAN → accepted) taqrizchi qarorini bloklamasligi kerak */
  return true;
}

function SectionHeader({ icon, title, color = "bg-purple-500", iconColor = "text-purple-600" }) {
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

function AdminDashboard({ userData }) {
  const { refresh: refreshNotifications } = useNotifications();
  const { refresh: refreshAccessToken } = useContext(AuthContext);

  const [articles,          setArticles]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [searchQuery,       setSearchQuery]       = useState("");
  const [filterStatus,      setFilterStatus]      = useState("all");
  const [selectedArticle,   setSelectedArticle]   = useState(null);
  const [qarorModal, setQarorModal] = useState(null);
  const [qarorIzoh, setQarorIzoh] = useState("");
  const [isSubmittingQaror, setIsSubmittingQaror] = useState(false);
  const [dateFrom,          setDateFrom]          = useState("");
  const [dateTo,            setDateTo]            = useState("");

  const loadTaqrizchiMaqolalar = useCallback(async () => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base || !getAccessToken()) {
      throw new Error("Backend konfiguratsiyasi yoki token mavjud emas");
    }
    const res = await fetchWithAuth(
      `${base}/taqrizchi/maqolalar/`,
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
      throw new Error(parseApiError(json, `${res.status}`));
    }
    return normalizeTaqrizchiMaqolalarList(json);
  }, [refreshAccessToken]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadTaqrizchiMaqolalar();
      syncArticleStatusNotifications({
        articles: data,
        userData,
        userRole: "admin",
        scope: "admin-dashboard",
      });
      setArticles(data);
    } catch (err) {
      toast.error(err?.message || "Maqolalarni yuklashda xatolik");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [userData, loadTaqrizchiMaqolalar]);

  const postTaqrizQaror = useCallback(
    async (articleId, qaror, izoh) => {
      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
      if (!base || !getAccessToken()) {
        throw new Error("Backend konfiguratsiyasi yoki token mavjud emas");
      }
      const body = { qaror };
      const trimmed = (izoh ?? "").trim();
      if (trimmed) body.izoh = trimmed;
      const res = await fetchWithAuth(
        `${base}/taqrizchi/maqolalar/${articleId}/qaror/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
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
      return json;
    },
    [refreshAccessToken]
  );

  const openQarorModal = (article, qaror) => {
    setSelectedArticle(article);
    setQarorModal(qaror);
    setQarorIzoh("");
  };

  const closeQarorModal = () => {
    setSelectedArticle(null);
    setQarorModal(null);
    setQarorIzoh("");
  };

  const handleSubmitQaror = async () => {
    if (!selectedArticle?.id || !qarorModal) return;
    setIsSubmittingQaror(true);
    try {
      await postTaqrizQaror(selectedArticle.id, qarorModal, qarorIzoh);
      toast.success(qarorModal === "qabul" ? "Qabul qilindi." : "Rad etildi.");
      refreshNotifications();
      closeQarorModal();
      fetchArticles();
    } catch (err) {
      toast.error(err?.message || "Qaror yuborishda xatolik");
    } finally {
      setIsSubmittingQaror(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchArticles, 0);
    return () => clearTimeout(t);
  }, [fetchArticles]);

  const dateFilteredArticles = useMemo(
    () => filterArticlesByDateRange(articles, dateFrom, dateTo),
    [articles, dateFrom, dateTo]
  );

  const dashboardStats = useMemo(() => ({
    total: dateFilteredArticles.length,
    newAssigned: dateFilteredArticles.filter((a) => a.status === ARTICLE_STATUS.ASSIGNED).length,
    reviewed: dateFilteredArticles.filter(
      (a) => hasSubmittedTaqrizDecision(a) || Boolean(a.reviewFile)
    ).length,
    pending: dateFilteredArticles.filter(
      (a) =>
        !hasSubmittedTaqrizDecision(a) &&
        !a.reviewFile
    ).length,
  }), [dateFilteredArticles]);

  const filteredArticles = useMemo(
    () => filterArticlesByDisplayStatus(dateFilteredArticles, searchQuery, filterStatus, ADMIN_STATUS_DISPLAY),
    [dateFilteredArticles, searchQuery, filterStatus]
  );

  const getStatusDisplay = (article) => {
    const s = article?.status;
    return article?.holatNomi?.trim() || ADMIN_STATUS_DISPLAY[s] || s || "—";
  };
  const getStatusColor = (s) => {
    const d = ADMIN_STATUS_DISPLAY[s] || s;
    return ADMIN_STATUS_COLORS[d] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const uniqueStatuses = useMemo(
    () => uniqueDisplayStatuses(dateFilteredArticles, ADMIN_STATUS_DISPLAY),
    [dateFilteredArticles]
  );

  useEffect(() => {
    const handleOpenArticle = async (event) => {
      const articleId = event.detail?.articleId;
      if (!articleId) return;
      let article = articles.find((a) => a.id === articleId);
      if (!article) {
        const latest = await loadTaqrizchiMaqolalar();
        setArticles(latest);
        article = latest.find(
          (a) => a.id === articleId || String(a.id) === String(articleId)
        );
      }
      if (!article) return;

      requestAnimationFrame(() => {
        document
          .querySelector(`[data-article-row="${articleId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };

    window.addEventListener("ktri:open-article", handleOpenArticle);
    return () => window.removeEventListener("ktri:open-article", handleOpenArticle);
  }, [articles, loadTaqrizchiMaqolalar]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-600">
                <FaFileAlt className="text-white text-sm" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Taqrizchi Paneli</h2>
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
              <FaCalendarAlt className="text-slate-400 text-xs" />Bugun
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
              onClick={fetchArticles}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaSyncAlt className="text-slate-400 text-xs" />Yangilash
            </button>
          </div>
        </div>
      </div>

      {/* Blind review banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-3">
        <FaUserSecret className="shrink-0 text-indigo-400 text-lg" />
        <p className="text-sm text-indigo-700">
          <strong>Yopiq taqriz rejimi:</strong> Muallif ma'lumotlari maxfiy saqlanmoqda. Siz faqat maqola mazmunini ko'rasiz.
        </p>
      </div>

      {/* Stats */}
      <div>
        <SectionHeader icon={<FaLayerGroup />} title="Taqriz monitoringi" color="bg-purple-500" iconColor="text-purple-600" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard icon={<FaNewspaper />}   iconColor="text-purple-500" title="Jami tayinlangan" value={dashboardStats.total}       badge="Jami"      badgeColor="text-purple-500" barColor="bg-purple-500" progress={100}
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Barcha maqolalar</span>} />
          <StatsCard icon={<FaClock />}        iconColor="text-cyan-500"   title="Yangi kelgan"    value={dashboardStats.newAssigned} total={dashboardStats.total} badge="Yangi"   badgeColor="text-cyan-500"   barColor="bg-cyan-400"
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Ko'rib chiqish kerak</span>} />
          <StatsCard icon={<FaCheckCircle />}  iconColor="text-green-500"  title="Taqrizlangan"   value={dashboardStats.reviewed}    total={dashboardStats.total} badge="Yuborildi" badgeColor="text-green-500" barColor="bg-green-500"
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Xulosa yuborilgan</span>} />
          <StatsCard icon={<FaFileAlt />}      iconColor="text-amber-500"  title="Kutilmoqda"     value={dashboardStats.pending}     total={dashboardStats.total} badge="Pending"  badgeColor="text-amber-500"  barColor="bg-amber-400"
            footer={<span className="flex items-center gap-1.5"><FaArrowRight className="text-[9px]" />Taqriz kerak</span>} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-purple-500" />
                <h2 className="text-base font-black text-slate-900">Taqriz jadvali</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Maqola nomi va annotatsiyasi ko'rsatiladi — muallif ma'lumotlari yashirilgan.</p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-100">
              {filteredArticles.length} ta maqola
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row">
          <div className="relative flex-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Maqola nomi bo'yicha qidirish..."
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
              {uniqueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="text-left">Maqola nomi</th>
                <th className="text-left">Yo'nalish</th>
                <th className="text-left">Tayinlangan</th>
                <th className="text-left">Status</th>
                <th className="text-left">Taqriz holati</th>
                <th className="text-center">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-12 text-center"><span className="loading loading-spinner loading-lg text-purple-500"></span></td></tr>
              ) : filteredArticles.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FaFileAlt className="text-3xl opacity-30" />
                    <p className="text-sm">Sizga tayinlangan maqolalar yo'q</p>
                  </div>
                </td></tr>
              ) : (
                filteredArticles.map((article) => {
                  const fileHref = resolveArticleFileHref(article.articleFileUrl);
                  return (
                  <tr
                    key={article.id}
                    data-article-row={article.id}
                    className="border-slate-50 transition hover:bg-slate-50/70"
                  >
                    <td className="max-w-[220px]">
                      <p className="truncate text-sm font-semibold text-slate-900">{article.articleTitle}</p>
                      {/* Muallif ko'rsatilmaydi — blind review */}
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <FaUserSecret className="text-[10px]" />Anonim muallif
                      </p>
                    </td>
                    <td className="text-xs text-slate-500">{article.category || "—"}</td>
                    <td className="text-xs text-slate-500">
                      {article.assignedAt ? formatDate(article.assignedAt) : "—"}
                    </td>
                    <td>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusColor(article.status)}`}>
                        {getStatusDisplay(article)}
                      </span>
                    </td>
                    <td>
                      {article.taqrizHolati === "QABUL" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                          <FaCheckCircle className="text-[10px]" />Qabul
                        </span>
                      ) : article.taqrizHolati === "RAD" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                          Rad
                        </span>
                      ) : article.taqrizHolati === "KUTILMOQDA" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          Kutilmoqda
                        </span>
                      ) : article.reviewFile ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600">
                          <FaCheckCircle className="text-[10px]" />Yuborildi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          Kutilmoqda
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {fileHref ? (
                          <a
                            href={fileHref}
                            download={article.fileName || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                            title="Maqola faylini yuklab olish"
                          >
                            <FaDownload className="text-[11px]" />
                            Fayl
                          </a>
                        ) : null}
                        {needsTaqrizQarorAction(article) && (
                          <>
                            <button
                              type="button"
                              onClick={() => openQarorModal(article, "qabul")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                              title="Qabul"
                            >
                              Qabul
                            </button>
                            <button
                              type="button"
                              onClick={() => openQarorModal(article, "rad")}
                              className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-red-700"
                              title="Rad etish"
                            >
                              Rad
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Taqriz qarori — POST /taqrizchi/maqolalar/:id/qaror/ */}
      <Modal
        isOpen={qarorModal !== null && selectedArticle !== null}
        onClose={closeQarorModal}
        title={qarorModal === "rad" ? "Taqriz — rad etish" : "Taqriz — qabul qilish"}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Maqola sarlavhasi:</p>
            <p className="mt-0.5 font-semibold text-slate-800">{selectedArticle?.articleTitle}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-500">
              <FaUserSecret />Muallif ma&apos;lumotlari yashirilgan (yopiq taqriz)
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Izoh <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
            </label>
            <textarea
              value={qarorIzoh}
              onChange={(e) => setQarorIzoh(e.target.value)}
              className="textarea textarea-bordered w-full min-h-[88px] text-sm"
              placeholder={
                qarorModal === "rad"
                  ? "Rad sababi yoki mulohazalar (ixtiyoriy)..."
                  : "Qabul bilan bog'liq izoh (ixtiyoriy)..."
              }
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={closeQarorModal} className="btn btn-ghost" disabled={isSubmittingQaror}>
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSubmitQaror}
              className={`btn gap-2 text-white border-none ${
                qarorModal === "rad" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              disabled={isSubmittingQaror}
            >
              {isSubmittingQaror ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Yuborilmoqda...
                </>
              ) : qarorModal === "rad" ? (
                "Rad etishni tasdiqlash"
              ) : (
                "Qabul qilishni tasdiqlash"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminDashboard;
