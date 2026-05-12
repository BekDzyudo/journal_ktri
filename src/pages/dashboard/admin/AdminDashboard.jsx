import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaNewspaper, FaClock, FaCheckCircle, FaUpload, FaEye,
  FaFileAlt, FaSearch, FaSyncAlt, FaCalendarAlt,
  FaArrowRight, FaLayerGroup, FaUserSecret,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import { ARTICLE_STATUS, ADMIN_STATUS_DISPLAY, ADMIN_STATUS_COLORS } from "../../../constants/roles.js";
import { fakeArticleApi } from "../../../utils/fakeArticleApi.js";
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

  const [articles,          setArticles]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [searchQuery,       setSearchQuery]       = useState("");
  const [filterStatus,      setFilterStatus]      = useState("all");
  const [selectedArticle,   setSelectedArticle]   = useState(null);
  const [detailArticle,     setDetailArticle]     = useState(null);
  const [reviewFile,        setReviewFile]        = useState(null);
  const [reviewComment,     setReviewComment]     = useState("");
  const [reviewConclusion,  setReviewConclusion]  = useState("");
  const [reviewDecision,    setReviewDecision]    = useState("accept");
  const [isSubmittingReview,setIsSubmittingReview]= useState(false);
  const [dateFrom,          setDateFrom]          = useState("");
  const [dateTo,            setDateTo]            = useState("");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fakeArticleApi.getAssignedArticles(userData);
      syncArticleStatusNotifications({
        articles: data,
        userData,
        userRole: "admin",
        scope: "admin-dashboard",
      });
      setArticles(data);
    } catch (err) {

      toast.error("Maqolalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (!userData?.email) return;
    const t = setTimeout(fetchArticles, 0);
    return () => clearTimeout(t);
  }, [userData?.email, fetchArticles]);

  const handleReviewFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (["doc", "docx", "pdf"].includes(ext)) {
      setReviewFile(file);
    } else {
      toast.error("Faqat .doc, .docx yoki .pdf formatdagi fayllarni yuklash mumkin");
      e.target.value = null;
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewFile) {
      toast.error("Taqriz faylini yuklang");
      return;
    }
    if (reviewConclusion.trim().length < 20) {
      toast.error("Xulosa matni kamida 20 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await fakeArticleApi.submitReview({
        articleId:       selectedArticle.id,
        reviewer:        userData,
        reviewFile,
        reviewComment:   reviewComment,
        reviewConclusion: reviewConclusion,
        decision:        reviewDecision,
      });

      toast.success("Taqriz xulosasi superadminga yuborildi!");
      refreshNotifications();
      closeReviewModal();
      fetchArticles();
    } catch (err) {
      toast.error("Taqriz yuborishda xatolik: " + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const closeReviewModal = () => {
    setSelectedArticle(null);
    setReviewFile(null);
    setReviewComment("");
    setReviewConclusion("");
    setReviewDecision("accept");
  };

  const dateFilteredArticles = useMemo(
    () => filterArticlesByDateRange(articles, dateFrom, dateTo),
    [articles, dateFrom, dateTo]
  );

  const dashboardStats = useMemo(() => ({
    total: dateFilteredArticles.length,
    newAssigned: dateFilteredArticles.filter((a) => a.status === ARTICLE_STATUS.ASSIGNED).length,
    reviewed: dateFilteredArticles.filter((a) => a.reviewFile).length,
    pending: dateFilteredArticles.filter((a) => !a.reviewFile).length,
  }), [dateFilteredArticles]);

  const filteredArticles = useMemo(
    () => filterArticlesByDisplayStatus(dateFilteredArticles, searchQuery, filterStatus, ADMIN_STATUS_DISPLAY),
    [dateFilteredArticles, searchQuery, filterStatus]
  );

  const getStatusDisplay = (s) => ADMIN_STATUS_DISPLAY[s] || s;
  const getStatusColor   = (s) => {
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
      if (!article && userData?.email) {
        const latest = await fakeArticleApi.getAssignedArticles(userData);
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

  const reviewChecklist = [
    { label: "Taqriz fayli", done: Boolean(reviewFile) },
    { label: "Xulosa matni", done: reviewConclusion.trim().length >= 20 },
    { label: "Tavsiya", done: Boolean(reviewDecision) },
  ];

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
                filteredArticles.map((article) => (
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
                        {getStatusDisplay(article.status)}
                      </span>
                    </td>
                    <td>
                      {article.reviewFile ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600">
                          <FaCheckCircle className="text-[10px]" />Yuborildi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
                          Kutilmoqda
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
                        {!article.reviewFile && (
                          <button
                            onClick={() => setSelectedArticle(article)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-700"
                            title="Taqriz yuklash"
                          >
                            <FaUpload className="text-[10px]" />Taqriz
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
        onClose={closeReviewModal}
        title="Taqriz xulosasi yuborish"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Maqola sarlavhasi:</p>
            <p className="mt-0.5 font-semibold text-slate-800">{selectedArticle?.articleTitle}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-500">
              <FaUserSecret />Muallif ma'lumotlari yashirilgan (yopiq taqriz)
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              To'ldirilishi kerak bo'lgan punktlar
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {reviewChecklist.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                    item.done
                      ? "border-green-100 bg-green-50 text-green-700"
                      : "border-red-100 bg-red-50 text-red-700"
                  }`}
                >
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[10px]">
                    {item.done ? "✓" : "!"}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Taqriz fayli */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Taqriz fayli <span className="text-red-500">*</span> (.doc, .docx, .pdf)
            </label>
            <input
              type="file"
              accept=".doc,.docx,.pdf"
              onChange={handleReviewFileChange}
              className="file-input file-input-bordered w-full"
            />
            {reviewFile && (
              <p className="mt-1.5 flex items-center gap-1 text-sm text-green-600">
                <FaCheckCircle className="text-xs" />{reviewFile.name}
              </p>
            )}
          </div>

          {/* Xulosa matni — superadminga ko'rsatiladi */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Xulosa matni <span className="text-red-500">*</span>
              <span className="ml-1.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-normal text-amber-600">
                Superadminga ko'rinadi
              </span>
            </label>
            <textarea
              value={reviewConclusion}
              onChange={(e) => setReviewConclusion(e.target.value)}
              className={`textarea textarea-bordered w-full h-24 text-sm ${
                reviewConclusion.trim().length > 0 && reviewConclusion.trim().length < 20
                  ? "textarea-warning"
                  : ""
              }`}
              placeholder="Maqolaning asosiy kamchiliklari yoki afzalliklari haqida batafsil xulosa yozing. Bu matn superadmin qaror chiqarishda asos bo'ladi..."
            />
            <p className="mt-1 text-[11px] text-slate-400">Minimal 20 ta belgi. Rad etishda sabab ko'rsatish majburiy.</p>
          </div>

          {/* Qo'shimcha izoh */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Qo'shimcha izoh <span className="text-slate-400">(ixtiyoriy)</span>
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="textarea textarea-bordered w-full h-16 text-sm"
              placeholder="Texnik mulohazalar, formatlash, adabiyotlar haqida..."
            />
          </div>

          {/* Tavsiya */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Taqrizchi tavsiyasi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReviewDecision("accept")}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                  reviewDecision === "accept"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-green-300"
                }`}
              >
                ✓ Qabul tavsiya
              </button>
              <button
                type="button"
                onClick={() => setReviewDecision("reject")}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                  reviewDecision === "reject"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-red-300"
                }`}
              >
                ✗ Rad tavsiya
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Bu tavsiya — yakuniy qaror superadminda qoladi.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={closeReviewModal} className="btn btn-ghost" disabled={isSubmittingReview}>
              Bekor qilish
            </button>
            <button
              onClick={handleSubmitReview}
              className="btn btn-primary gap-2"
              disabled={!reviewFile || reviewConclusion.trim().length < 20 || isSubmittingReview}
            >
              {isSubmittingReview ? (
                <><span className="loading loading-spinner loading-sm"></span>Yuklanmoqda...</>
              ) : (
                <><FaUpload />Superadminga yuborish</>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <ArticleDetailModal isOpen={detailArticle !== null} onClose={() => setDetailArticle(null)} article={detailArticle} role="admin" />
    </div>
  );
}

export default AdminDashboard;
