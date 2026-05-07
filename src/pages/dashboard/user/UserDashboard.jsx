import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaNewspaper, FaClock, FaCheckCircle, FaTimesCircle,
  FaEye, FaPlus, FaCreditCard,
  FaSearch, FaSyncAlt, FaCalendarAlt, FaArrowRight, FaLayerGroup,
} from "react-icons/fa";
import { useNotifications } from "../../../context/NotificationContext.jsx";
import { toast } from "react-toastify";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import { ARTICLE_STATUS, USER_STATUS_DISPLAY, USER_STATUS_COLORS } from "../../../constants/roles.js";
import { fakeArticleApi } from "../../../utils/fakeArticleApi.js";
import {
  filterArticlesByDisplayStatus,
  filterArticlesByDateRange,
  uniqueDisplayStatuses,
} from "../../../utils/articleDashboardHelpers.js";

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

function UserDashboard({ userData }) {
  const navigate = useNavigate();
  const { refresh: refreshNotifications } = useNotifications();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailArticle, setDetailArticle] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fakeArticleApi.getMyArticles(userData);
      setArticles(data);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Maqolalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (!userData?.email) return;
    const t = setTimeout(() => {
      fetchArticles();
    }, 0);
    return () => clearTimeout(t);
  }, [userData?.email, fetchArticles]);

  const dateFilteredArticles = useMemo(
    () => filterArticlesByDateRange(articles, dateFrom, dateTo),
    [articles, dateFrom, dateTo]
  );

  const dashboardStats = useMemo(() => ({
    total: dateFilteredArticles.length,
    submitted: dateFilteredArticles.filter(
      (a) =>
        ![ARTICLE_STATUS.ACCEPTED, ARTICLE_STATUS.REJECTED, ARTICLE_STATUS.REVISION_REQUIRED].includes(a.status)
    ).length,
    accepted: dateFilteredArticles.filter((a) => a.status === ARTICLE_STATUS.ACCEPTED).length,
    rejected: dateFilteredArticles.filter((a) => a.status === ARTICLE_STATUS.REJECTED).length,
  }), [dateFilteredArticles]);

  const filteredArticles = useMemo(
    () => filterArticlesByDisplayStatus(dateFilteredArticles, searchQuery, filterStatus, USER_STATUS_DISPLAY),
    [dateFilteredArticles, searchQuery, filterStatus]
  );

  const getStatusDisplay = (actualStatus) => USER_STATUS_DISPLAY[actualStatus] || actualStatus;

  const getStatusColor = (actualStatus) => {
    const displayStatus = USER_STATUS_DISPLAY[actualStatus] || actualStatus;
    return USER_STATUS_COLORS[displayStatus] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const uniqueStatuses = useMemo(
    () => uniqueDisplayStatuses(dateFilteredArticles, USER_STATUS_DISPLAY),
    [dateFilteredArticles]
  );

  useEffect(() => {
    const handleOpenArticle = async (event) => {
      const articleId = event.detail?.articleId;
      if (!articleId) return;
      let article = articles.find((a) => a.id === articleId);
      if (!article && userData?.email) {
        const latest = await fakeArticleApi.getMyArticles(userData);
        setArticles(latest);
        article = latest.find((a) => a.id === articleId);
      }
      if (!article) return;

      setDetailArticle(article);
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-article-row="${articleId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };

    window.addEventListener("ktri:open-article", handleOpenArticle);
    return () => window.removeEventListener("ktri:open-article", handleOpenArticle);
  }, [articles, userData]);

  const handlePay = async (article) => {
    await fakeArticleApi.payArticle(article.id);
    toast.success("CLICK test to'lovi muvaffaqiyatli bajarildi. Maqola superadminga yuborildi.");
    refreshNotifications();
    fetchArticles();
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
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

      {/* Stats Section */}
      <div>
        <SectionHeader
          icon={<FaLayerGroup />}
          title="Maqolalar monitoringi"
          color="bg-blue-500"
          iconColor="text-blue-600"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            icon={<FaNewspaper />}
            iconColor="text-blue-500"
            title="Jami maqolalar"
            value={dashboardStats.total}
            badge="Hammasi"
            badgeColor="text-blue-500"
            barColor="bg-blue-500"
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
            title="Jarayonda"
            value={dashboardStats.submitted}
            total={dashboardStats.total}
            badge="Kutilmoqda"
            badgeColor="text-amber-500"
            barColor="bg-amber-400"
            footer={
              <span className="flex items-center gap-1.5">
                <FaArrowRight className="text-[9px]" />
                Ko'rib chiqilmoqda
              </span>
            }
          />
          <StatsCard
            icon={<FaCheckCircle />}
            iconColor="text-green-500"
            title="Qabul qilindi"
            value={dashboardStats.accepted}
            total={dashboardStats.total}
            badge="Tasdiqlandi"
            badgeColor="text-green-500"
            barColor="bg-green-500"
            footer={
              <span className="flex items-center gap-1.5">
                <FaArrowRight className="text-[9px]" />
                Tasdiqlangan
              </span>
            }
          />
          <StatsCard
            icon={<FaTimesCircle />}
            iconColor="text-red-400"
            title="Rad etildi"
            value={dashboardStats.rejected}
            total={dashboardStats.total}
            badge="Qaytarildi"
            badgeColor="text-red-400"
            barColor="bg-red-400"
            footer={
              <span className="flex items-center gap-1.5">
                <FaArrowRight className="text-[9px]" />
                Bekor qilingan
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
                <FaNewspaper className="text-blue-500" />
                <h2 className="text-base font-black text-slate-900">Maqolalar ro'yxati</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {filteredArticles.length} ta yozuv ko'rsatilmoqda
              </p>
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
                <th className="text-left">Maqola nomi</th>
                <th className="text-left">Mualliflar</th>
                <th className="text-left">Yuborilgan sana</th>
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
                    data-article-row={article.id}
                    className="border-slate-50 transition hover:bg-slate-50/70"
                  >
                    <td className="max-w-[200px]">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {article.articleTitle}
                      </p>
                    </td>
                    <td className="text-sm text-slate-500">{article.authorNames}</td>
                    <td className="text-xs text-slate-500">
                      {new Date(article.createdAt || article.submittedAt).toLocaleDateString("uz-UZ")}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusColor(article.status)}`}
                      >
                        {getStatusDisplay(article.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {article.status === ARTICLE_STATUS.PAYMENT_PENDING && (
                          <button
                            onClick={() => handlePay(article)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                            title="CLICK orqali to'lash"
                          >
                            <FaCreditCard className="text-[10px]" />
                            CLICK
                          </button>
                        )}
                        <button
                          onClick={() => setDetailArticle(article)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-blue-500 transition hover:bg-blue-50"
                          title="Ko'rish"
                        >
                          <FaEye className="text-sm" />
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

      <ArticleDetailModal
        isOpen={detailArticle !== null}
        onClose={() => setDetailArticle(null)}
        article={detailArticle}
        role="user"
      />
    </div>
  );
}

export default UserDashboard;
