import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaNewspaper, FaClock, FaCheckCircle, FaTimesCircle, FaEye, FaPlus, FaCommentDots } from "react-icons/fa";
import { toast } from "react-toastify";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import { ARTICLE_STATUS, USER_STATUS_DISPLAY, USER_STATUS_COLORS } from "../../../constants/roles.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import {
  filterArticlesByDisplayStatus,
  uniqueDisplayStatuses,
} from "../../../utils/articleDashboardHelpers.js";

function UserDashboard({ userData }) {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailArticle, setDetailArticle] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    accepted: 0,
    rejected: 0,
  });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/articles/my-articles/`, {
        headers: { Authorization: "Bearer " + accessToken },
      });
      if (response.ok) {
        const data = await response.json();
        setArticles(data);

        const statsData = {
          total: data.length,
          submitted: data.filter(
            (a) => a.status === ARTICLE_STATUS.SUBMITTED || a.status === ARTICLE_STATUS.ASSIGNED
          ).length,
          accepted: data.filter((a) => a.status === ARTICLE_STATUS.ACCEPTED).length,
          rejected: data.filter((a) => a.status === ARTICLE_STATUS.REJECTED).length,
        };
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Maqolalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userData?.email) return;

    const t = setTimeout(() => {
      fetchArticles();
    }, 0);
    return () => clearTimeout(t);
  }, [userData?.email, fetchArticles]);

  const filteredArticles = useMemo(
    () => filterArticlesByDisplayStatus(articles, searchQuery, filterStatus, USER_STATUS_DISPLAY),
    [articles, searchQuery, filterStatus]
  );

  // Status ni user ko'radigan holatda qaytarish
  const getStatusDisplay = (actualStatus) => {
    return USER_STATUS_DISPLAY[actualStatus] || actualStatus;
  };

  const getStatusColor = (actualStatus) => {
    const displayStatus = USER_STATUS_DISPLAY[actualStatus] || actualStatus;
    return USER_STATUS_COLORS[displayStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const uniqueStatuses = useMemo(
    () => uniqueDisplayStatuses(articles, USER_STATUS_DISPLAY),
    [articles]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Dashboard</p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-950">
              <FaNewspaper className="text-[#0d4ea3]" />
              Muallif monitoring paneli
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Maqolalaringiz holati, muharrir xabarlari va yuborilgan materiallar nazorati.
            </p>
          </div>
          <button
            onClick={() => navigate("/send-article")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d4ea3] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
          >
            <FaPlus />
            Yangi maqola yuborish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<FaNewspaper />}
          title="Jami maqolalar"
          value={stats.total}
          gradient="from-blue-50 to-blue-100"
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatsCard
          icon={<FaClock />}
          title="Jarayonda"
          value={stats.submitted}
          gradient="from-yellow-50 to-yellow-100"
          iconBg="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <StatsCard
          icon={<FaCheckCircle />}
          title="Qabul qilindi"
          value={stats.accepted}
          gradient="from-green-50 to-green-100"
          iconBg="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatsCard
          icon={<FaTimesCircle />}
          title="Rad etildi"
          value={stats.rejected}
          gradient="from-red-50 to-red-100"
          iconBg="bg-gradient-to-br from-red-500 to-red-600"
        />
      </div>

      <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">Qidiruv va filter</h3>
            <p className="text-sm text-slate-500">Maqola nomi, muallif yoki status bo‘yicha saralang.</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Maqola nomi yoki muallif bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full rounded-xl border-slate-200 bg-slate-50"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select select-bordered w-full rounded-xl border-slate-200 bg-slate-50"
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
      </div>

      <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">Maqolalar ro'yxati</h3>
            <p className="text-sm text-slate-500">{filteredArticles.length} ta yozuv ko‘rsatilmoqda</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                  <td colSpan="5" className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Maqolalar topilmadi
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="border-slate-100 hover:bg-slate-50/80">
                    <td className="font-medium text-gray-900">{article.articleTitle}</td>
                    <td className="text-gray-600">{article.authorNames}</td>
                    <td className="text-gray-600">
                      {new Date(article.createdAt || article.submittedAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(article.status)}`}>
                        {getStatusDisplay(article.status)}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setDetailArticle(article)}
                          className="btn btn-sm btn-ghost text-blue-600"
                          title="Ko'rish"
                        >
                          <FaEye />
                        </button>
                        {article.finalDecisionDescription && (
                          <button
                            onClick={() => setDetailArticle(article)}
                            className="btn btn-sm btn-ghost text-emerald-600"
                            title="Muharrir xabari"
                          >
                            <FaCommentDots />
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
