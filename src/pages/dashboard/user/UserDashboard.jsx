import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaNewspaper, FaClock, FaCheckCircle, FaTimesCircle, FaEye, FaPlus, FaCommentDots } from "react-icons/fa";
import { toast } from "react-toastify";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import { ARTICLE_STATUS, USER_STATUS_DISPLAY, USER_STATUS_COLORS } from "../../../constants/roles.js";
import { getAccessToken } from "../../../utils/authStorage.js";

function UserDashboard({ userData }) {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailArticle, setDetailArticle] = useState(null);
  const [commentArticle, setCommentArticle] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    accepted: 0,
    rejected: 0,
  });

  useEffect(() => {
    // userData hali yuklanmagan bo'lsa kuting
    if (userData?.email) fetchArticles();
  }, [userData?.email]);

  const fetchArticles = async () => {
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
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.articleTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.authorNames?.toLowerCase().includes(searchQuery.toLowerCase());
    const displayStatus = USER_STATUS_DISPLAY[article.status] || article.status;
    const matchesFilter = filterStatus === "all" || displayStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Status ni user ko'radigan holatda qaytarish
  const getStatusDisplay = (actualStatus) => {
    return USER_STATUS_DISPLAY[actualStatus] || actualStatus;
  };

  const getStatusColor = (actualStatus) => {
    const displayStatus = USER_STATUS_DISPLAY[actualStatus] || actualStatus;
    return USER_STATUS_COLORS[displayStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Unique display statuses for filter
  const uniqueStatuses = [...new Set(articles.map(a => USER_STATUS_DISPLAY[a.status] || a.status))];

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* New Article Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/send-article")}
          className="btn btn-primary gap-2"
        >
          <FaPlus />
          Yangi maqola yuborish
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Maqola nomi yoki muallif bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select select-bordered w-full"
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

      {/* Articles Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
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
                  <tr key={article.id} className="hover:bg-gray-50">
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
                            onClick={() => setCommentArticle(article)}
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
      <ArticleDetailModal
        isOpen={commentArticle !== null}
        onClose={() => setCommentArticle(null)}
        article={commentArticle}
        role="user"
      />
    </div>
  );
}

export default UserDashboard;
