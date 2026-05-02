import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaNewspaper, FaClock, FaCheckCircle, FaUpload, FaEye, FaFileAlt, FaCommentDots } from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import { ARTICLE_STATUS, ADMIN_STATUS_DISPLAY, ADMIN_STATUS_COLORS } from "../../../constants/roles.js";
import { fakeArticleApi } from "../../../utils/fakeArticleApi.js";
import {
  filterArticlesByDisplayStatus,
  uniqueDisplayStatuses,
} from "../../../utils/articleDashboardHelpers.js";

function AdminDashboard({ userData }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [detailArticle, setDetailArticle] = useState(null);
  const [messageArticle, setMessageArticle] = useState(null);
  const [reviewFile, setReviewFile] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewDecision, setReviewDecision] = useState("accept");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    newAssigned: 0,
    reviewed: 0,
    pending: 0,
  });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fakeArticleApi.getAssignedArticles(userData);
      setArticles(data);

      const statsData = {
        total: data.length,
        newAssigned: data.filter((a) => a.status === ARTICLE_STATUS.ASSIGNED).length,
        reviewed: data.filter((a) => a.reviewFile).length,
        pending: data.filter((a) => !a.reviewFile).length,
      };
      setStats(statsData);
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

  const handleReviewFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'doc' || fileExtension === 'docx' || fileExtension === 'pdf') {
        setReviewFile(file);
      } else {
        toast.error('Faqat .doc, .docx yoki .pdf formatdagi fayllarni yuklash mumkin');
        e.target.value = null;
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewFile) {
      toast.error('Taqriz faylini yuklang');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await fakeArticleApi.submitReview({
        articleId: selectedArticle.id,
        reviewer: userData,
        reviewFile,
        reviewComment,
        decision: reviewDecision,
      });

      toast.success("Taqriz xulosasi superadminga yuborildi!");
      setSelectedArticle(null);
      setReviewFile(null);
      setReviewComment("");
      setReviewDecision("accept");
      fetchArticles();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error('Taqriz yuborishda xatolik: ' + error.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredArticles = useMemo(
    () =>
      filterArticlesByDisplayStatus(articles, searchQuery, filterStatus, ADMIN_STATUS_DISPLAY),
    [articles, searchQuery, filterStatus]
  );

  // Status ni admin ko'radigan holatda qaytarish
  const getStatusDisplay = (actualStatus) => {
    return ADMIN_STATUS_DISPLAY[actualStatus] || actualStatus;
  };

  const getStatusColor = (actualStatus) => {
    const displayStatus = ADMIN_STATUS_DISPLAY[actualStatus] || actualStatus;
    return ADMIN_STATUS_COLORS[displayStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const uniqueStatuses = useMemo(
    () => uniqueDisplayStatuses(articles, ADMIN_STATUS_DISPLAY),
    [articles]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600">Taqrizchi paneli</p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-950">
              <FaFileAlt className="text-purple-600" />
              Tayinlangan maqolalar monitoringi
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sizga biriktirilgan maqolalar, taqriz fayllari va tahririyat bilan muloqot.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-100">
            {filteredArticles.length} ta maqola
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<FaNewspaper />}
          title="Jami maqolalar"
          value={stats.total}
          gradient="from-purple-50 to-purple-100"
          iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatsCard
          icon={<FaClock />}
          title="Yangi kelgan"
          value={stats.newAssigned}
          gradient="from-cyan-50 to-cyan-100"
          iconBg="bg-gradient-to-br from-cyan-500 to-cyan-600"
        />
        <StatsCard
          icon={<FaCheckCircle />}
          title="Taqrizlangan"
          value={stats.reviewed}
          gradient="from-green-50 to-green-100"
          iconBg="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatsCard
          icon={<FaFileAlt />}
          title="Kutilmoqda"
          value={stats.pending}
          gradient="from-yellow-50 to-yellow-100"
          iconBg="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
      </div>

      <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)]">
        <div className="mb-4">
          <h3 className="text-base font-black text-slate-950">Qidiruv va filter</h3>
          <p className="text-sm text-slate-500">Maqola nomi, muallif yoki status bo‘yicha ishlang.</p>
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
            <h3 className="text-base font-black text-slate-950">Taqriz jadvali</h3>
            <p className="text-sm text-slate-500">Taqriz holati va tezkor amallar.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="text-left">Maqola nomi</th>
                <th className="text-left">Mualliflar</th>
                <th className="text-left">Tayinlangan vaqti</th>
                <th className="text-left">Status</th>
                <th className="text-left">Taqriz</th>
                <th className="text-center">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Sizga tayinlangan maqolalar yo'q
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="border-slate-100 hover:bg-slate-50/80">
                    <td className="font-medium text-gray-900">{article.articleTitle}</td>
                    <td className="text-gray-600">{article.authorNames}</td>
                    <td className="text-gray-600">
                      {new Date(article.assignedAt || article.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(article.status)}`}>
                        {getStatusDisplay(article.status)}
                      </span>
                    </td>
                    <td>
                      {article.reviewFile ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <FaCheckCircle />
                          <span className="text-xs">Yuklangan</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Yuklanmagan</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => setDetailArticle(article)}
                          className="btn btn-sm btn-ghost rounded-xl text-blue-600"
                          title="Ko'rish"
                        >
                          <FaEye />
                        </button>
                        {article.finalDecisionDescription && (
                          <button
                            onClick={() => setMessageArticle(article)}
                            className="btn btn-sm btn-ghost rounded-xl text-emerald-600"
                            title="Muharrir xabari"
                          >
                            <FaCommentDots />
                          </button>
                        )}
                        {!article.reviewFile && (
                          <button
                            onClick={() => setSelectedArticle(article)}
                            className="btn btn-sm gap-1 rounded-xl bg-[#0d4ea3] text-white hover:bg-blue-700"
                            title="Taqriz yuklash"
                          >
                            <FaUpload />
                            Taqriz
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

      {/* Review Modal */}
      <Modal
        isOpen={selectedArticle !== null}
        onClose={() => {
          setSelectedArticle(null);
          setReviewFile(null);
          setReviewComment('');
          setReviewDecision("accept");
        }}
        title="Taqriz yuklash"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Maqola:</h3>
            <p className="text-gray-600">{selectedArticle?.articleTitle}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taqriz fayli (doc, docx, pdf)
            </label>
            <input
              type="file"
              accept=".doc,.docx,.pdf"
              onChange={handleReviewFileChange}
              className="file-input file-input-bordered w-full"
            />
            {reviewFile && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <FaCheckCircle />
                {reviewFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Izoh (ixtiyoriy)
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="textarea textarea-bordered w-full h-24"
              placeholder="Taqriz bo'yicha izohlar..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taqrizchi xulosasi
            </label>
            <select
              value={reviewDecision}
              onChange={(e) => setReviewDecision(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="accept">Qabul qilishga tavsiya qilaman</option>
              <option value="reject">Rad etishga tavsiya qilaman</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setSelectedArticle(null);
                setReviewFile(null);
                setReviewComment('');
                setReviewDecision("accept");
              }}
              className="btn btn-ghost"
              disabled={isSubmittingReview}
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSubmitReview}
              className="btn btn-primary"
              disabled={!reviewFile || isSubmittingReview}
            >
              {isSubmittingReview ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <FaUpload />
                  Yuborish
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
      <ArticleDetailModal
        isOpen={detailArticle !== null}
        onClose={() => setDetailArticle(null)}
        article={detailArticle}
        role="admin"
      />
      <ArticleDetailModal
        isOpen={messageArticle !== null}
        onClose={() => setMessageArticle(null)}
        article={messageArticle}
        role="user"
      />
    </div>
  );
}

export default AdminDashboard;
