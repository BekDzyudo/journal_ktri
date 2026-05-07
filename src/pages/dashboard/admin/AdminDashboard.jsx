import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaNewspaper,
  FaClock,
  FaCheckCircle,
  FaUpload,
  FaEye,
  FaFileAlt,
  FaCommentDots,
  FaSearch,
  FaSyncAlt,
  FaCalendarAlt,
  FaArrowRight,
  FaLayerGroup,
} from "react-icons/fa";
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

const UZ_DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateUz(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${UZ_DAYS[d.getDay()]} holatiga ko'ra`;
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
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
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
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (["doc", "docx", "pdf"].includes(fileExtension)) {
        setReviewFile(file);
      } else {
        toast.error("Faqat .doc, .docx yoki .pdf formatdagi fayllarni yuklash mumkin");
        e.target.value = null;
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewFile) {
      toast.error("Taqriz faylini yuklang");
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
      toast.error("Taqriz yuborishda xatolik: " + error.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredArticles = useMemo(
    () => filterArticlesByDisplayStatus(articles, searchQuery, filterStatus, ADMIN_STATUS_DISPLAY),
    [articles, searchQuery, filterStatus]
  );

  const getStatusDisplay = (actualStatus) => ADMIN_STATUS_DISPLAY[actualStatus] || actualStatus;

  const getStatusColor = (actualStatus) => {
    const displayStatus = ADMIN_STATUS_DISPLAY[actualStatus] || actualStatus;
    return ADMIN_STATUS_COLORS[displayStatus] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const uniqueStatuses = useMemo(
    () => uniqueDisplayStatuses(articles, ADMIN_STATUS_DISPLAY),
    [articles]
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
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
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <FaCalendarAlt className="text-slate-400 text-xs" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
              <span className="text-sm text-slate-500">{formatDateUz(selectedDate)}</span>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setSelectedDate(getTodayStr())}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaCalendarAlt className="text-slate-400 text-xs" />
              Bugun
            </button>
            <button
              onClick={fetchArticles}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaSyncAlt className="text-slate-400 text-xs" />
              Yangilash
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div>
        <SectionHeader
          icon={<FaLayerGroup />}
          title="Taqriz monitoringi"
          color="bg-purple-500"
          iconColor="text-purple-600"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            icon={<FaNewspaper />}
            iconColor="text-purple-500"
            title="Jami tayinlangan"
            value={stats.total}
            badge="Jami"
            badgeColor="text-purple-500"
            barColor="bg-purple-500"
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
            iconColor="text-cyan-500"
            title="Yangi kelgan"
            value={stats.newAssigned}
            total={stats.total}
            badge="Yangi"
            badgeColor="text-cyan-500"
            barColor="bg-cyan-400"
            footer={
              <span className="flex items-center gap-1.5">
                <FaArrowRight className="text-[9px]" />
                Ko'rib chiqish kerak
              </span>
            }
          />
          <StatsCard
            icon={<FaCheckCircle />}
            iconColor="text-green-500"
            title="Taqrizlangan"
            value={stats.reviewed}
            total={stats.total}
            badge="Yuborildi"
            badgeColor="text-green-500"
            barColor="bg-green-500"
            footer={
              <span className="flex items-center gap-1.5">
                <FaArrowRight className="text-[9px]" />
                Taqriz yuborilgan
              </span>
            }
          />
          <StatsCard
            icon={<FaFileAlt />}
            iconColor="text-amber-500"
            title="Kutilmoqda"
            value={stats.pending}
            total={stats.total}
            badge="Pending"
            badgeColor="text-amber-500"
            barColor="bg-amber-400"
            footer={
              <span className="flex items-center gap-1.5">
                <FaArrowRight className="text-[9px]" />
                Taqriz kerak
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
                <FaFileAlt className="text-purple-500" />
                <h2 className="text-base font-black text-slate-900">Taqriz jadvali</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Sizga biriktirilgan maqolalar va taqriz holati.
              </p>
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
                <th className="text-left">Tayinlangan vaqti</th>
                <th className="text-left">Status</th>
                <th className="text-left">Taqriz holati</th>
                <th className="text-center">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <span className="loading loading-spinner loading-lg text-purple-500"></span>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FaFileAlt className="text-3xl opacity-30" />
                      <p className="text-sm">Sizga tayinlangan maqolalar yo'q</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="border-slate-50 transition hover:bg-slate-50/70">
                    <td className="max-w-[200px]">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {article.articleTitle}
                      </p>
                    </td>
                    <td className="text-sm text-slate-500">{article.authorNames}</td>
                    <td className="text-xs text-slate-500">
                      {new Date(article.assignedAt || article.createdAt).toLocaleDateString("uz-UZ")}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusColor(article.status)}`}
                      >
                        {getStatusDisplay(article.status)}
                      </span>
                    </td>
                    <td>
                      {article.reviewFile ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600">
                          <FaCheckCircle className="text-[10px]" />
                          Yuklangan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
                          Yuklanmagan
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailArticle(article)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-blue-500 transition hover:bg-blue-50"
                          title="Ko'rish"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        {article.finalDecisionDescription && (
                          <button
                            onClick={() => setMessageArticle(article)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-emerald-500 transition hover:bg-emerald-50"
                            title="Muharrir xabari"
                          >
                            <FaCommentDots className="text-sm" />
                          </button>
                        )}
                        {!article.reviewFile && (
                          <button
                            onClick={() => setSelectedArticle(article)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-700"
                            title="Taqriz yuklash"
                          >
                            <FaUpload className="text-[10px]" />
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
          setReviewComment("");
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
                setReviewComment("");
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
