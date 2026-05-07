import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaNewspaper,
  FaUsers,
  FaUserShield,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaUserTimes,
  FaSearch,
  FaTag,
  FaFileUpload,
  FaFileAlt,
  FaDownload,
  FaExternalLinkAlt,
  FaClock,
  FaCommentDots,
  FaSyncAlt,
  FaCalendarAlt,
  FaArrowRight,
  FaThLarge,
  FaLayerGroup,
  FaUserFriends,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import {
  ROLES,
  normalizeRole,
  ARTICLE_STATUS,
  SUPERADMIN_STATUS_DISPLAY,
  SUPERADMIN_STATUS_COLORS,
} from "../../../constants/roles.js";
import { fakeArticleApi } from "../../../utils/fakeArticleApi.js";
import {
  filterArticlesByDisplayStatus,
  uniqueDisplayStatuses,
} from "../../../utils/articleDashboardHelpers.js";

const UZ_DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateUz(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${UZ_DAYS[d.getDay()]} holatiga ko'ra`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function computeSuperAdminStats(submittedArticles, allUsers, adminUsers) {
  return {
    totalArticles: submittedArticles.length,
    newMaterials: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.SUBMITTED).length,
    assigned: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.ASSIGNED).length,
    inReview: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.IN_EDITING).length,
    accepted: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.ACCEPTED).length,
    rejected: submittedArticles.filter((a) => a.status === ARTICLE_STATUS.REJECTED).length,
    totalUsers: allUsers.filter((u) => normalizeRole(u.role) === ROLES.USER).length,
    totalAdmins: adminUsers.length,
  };
}

function SectionHeader({ icon, title, color = "bg-blue-500", iconColor = "text-blue-500" }) {
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

function SuperAdminDashboard({ userData, view = "articles" }) {
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [detailArticle, setDetailArticle] = useState(null);
  const [messageArticle, setMessageArticle] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [decisionDescription, setDecisionDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [stats, setStats] = useState({
    totalArticles: 0,
    newMaterials: 0,
    assigned: 0,
    inReview: 0,
    accepted: 0,
    rejected: 0,
    totalUsers: 0,
    totalAdmins: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [articlesData, usersData] = await Promise.all([
        fakeArticleApi.getArticles(),
        fakeArticleApi.getUsers(userData),
      ]);
      const normalizedUsers = usersData.map((u) => ({
        ...u,
        role: normalizeRole(u.role),
      }));
      const adminUsers = normalizedUsers.filter((u) => u.role === ROLES.ADMIN);

      setArticles(articlesData);
      setUsers(normalizedUsers);
      setAdmins(adminUsers);
      setStats(computeSuperAdminStats(articlesData, normalizedUsers, adminUsers));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [userData]);

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
    const label = decision === "accept" ? "PAYME to'loviga yuborildi" : "Rad etildi";

    try {
      await fakeArticleApi.setInitialDecision(article.id, decision, decisionDescription.trim());
      toast.success(`Maqola "${label}"!`);
      setDecisionModalOpen(false);
      setSelectedArticle(null);
      setDecisionDescription("");
      fetchData();
    } catch (error) {
      console.error("Error making decision:", error);
      toast.error("Xatolik: " + error.message);
    }
  };

  const handleToggleAdminRole = async (targetUser) => {
    const isAdmin = normalizeRole(targetUser.role) === ROLES.ADMIN;
    const confirmMessage = isAdmin
      ? `${targetUser.first_name} ${targetUser.last_name} dan taqrizchi huquqini olib qo'yasizmi?`
      : `${targetUser.first_name} ${targetUser.last_name} ni taqrizchi qilasizmi?`;

    if (!confirm(confirmMessage)) return;

    try {
      await fakeArticleApi.toggleAdminRole(targetUser);
      toast.success(isAdmin ? "Taqrizchi huquqi olib qo'yildi!" : "Taqrizchi huquqi berildi!");
      fetchData();
    } catch (error) {
      console.error("Error toggling admin role:", error);
      toast.error("Rolni o'zgartirishda xatolik: " + error.message);
    }
  };

  const filteredArticles = useMemo(
    () =>
      filterArticlesByDisplayStatus(
        articles,
        searchQuery,
        filterStatus,
        SUPERADMIN_STATUS_DISPLAY
      ),
    [articles, searchQuery, filterStatus]
  );

  const filteredUsers = users.filter((user) => {
    const searchLower = userSearchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      (user.phone_number && user.phone_number.includes(searchLower))
    );
  });

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
    () => uniqueDisplayStatuses(articles, SUPERADMIN_STATUS_DISPLAY),
    [articles]
  );

  const showArticles = view !== "users";
  const showUsers = view !== "articles";

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
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <FaCalendarAlt className="text-slate-400 text-xs" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
              <span className="text-sm text-slate-500">
                {formatDateUz(selectedDate)}
              </span>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                icon={<FaNewspaper />}
                iconColor="text-emerald-500"
                title="Jami maqolalar"
                value={stats.totalArticles}
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
                value={stats.newMaterials}
                total={stats.totalArticles}
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
                value={stats.assigned}
                total={stats.totalArticles}
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
              <StatsCard
                icon={<FaFileAlt />}
                iconColor="text-violet-500"
                title="Taqriz kelgan"
                value={stats.inReview}
                total={stats.totalArticles}
                badge="Taqrizda"
                badgeColor="text-violet-500"
                barColor="bg-violet-500"
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Xulosa kutilmoqda
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                icon={<FaCheckCircle />}
                iconColor="text-green-500"
                title="Qabul qilindi"
                value={stats.accepted}
                total={stats.totalArticles}
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
                value={stats.rejected}
                total={stats.totalArticles}
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
                icon={<FaUsers />}
                iconColor="text-blue-500"
                title="Jami foydalanuvchilar"
                value={stats.totalUsers}
                badge="Muallif"
                badgeColor="text-blue-500"
                barColor="bg-blue-500"
                progress={70}
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Ro'yxatni ko'rish
                  </span>
                }
              />
              <StatsCard
                icon={<FaUserShield />}
                iconColor="text-purple-500"
                title="Taqrizchilar"
                value={stats.totalAdmins}
                badge="Taqrizchi"
                badgeColor="text-purple-500"
                barColor="bg-purple-500"
                progress={50}
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Boshqarish
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
                    <th className="text-left">Maqola nomi</th>
                    <th className="text-left">Mualliflar</th>
                    <th className="text-left">Yo'nalish</th>
                    <th className="text-left">Yuborilgan</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">To'lov</th>
                    <th className="text-left">Taqrizchi</th>
                    <th className="text-center">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center">
                        <span className="loading loading-spinner loading-lg text-emerald-500"></span>
                      </td>
                    </tr>
                  ) : filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FaNewspaper className="text-3xl opacity-30" />
                          <p className="text-sm">Maqolalar topilmadi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((article) => (
                      <tr
                        key={article.id}
                        className={`border-slate-50 transition hover:bg-slate-50/70 ${
                          article.status === ARTICLE_STATUS.IN_EDITING ? "bg-violet-50/40" : ""
                        }`}
                      >
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
                          {new Date(
                            article.createdAt || article.submittedAt || article.submittedDate
                          ).toLocaleDateString("uz-UZ")}
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
                              {new Date(article.paidAt).toLocaleDateString("uz-UZ")}
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
                              onClick={() => setDetailArticle(article)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-blue-500 transition hover:bg-blue-50"
                              title="Ko'rish"
                            >
                              <FaEye className="text-sm" />
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
                            {article.finalDecisionDescription && (
                              <button
                                onClick={() => setMessageArticle(article)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-emerald-500 transition hover:bg-emerald-50"
                                title="Muharrir xabari"
                              >
                                <FaCommentDots className="text-sm" />
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatsCard
                icon={<FaUsers />}
                iconColor="text-blue-500"
                title="Jami mualliflar"
                value={stats.totalUsers}
                badge="Muallif"
                badgeColor="text-blue-500"
                barColor="bg-blue-500"
                progress={70}
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Ro'yxatni ko'rish
                  </span>
                }
              />
              <StatsCard
                icon={<FaUserShield />}
                iconColor="text-purple-500"
                title="Taqrizchilar"
                value={stats.totalAdmins}
                badge="Taqrizchi"
                badgeColor="text-purple-500"
                barColor="bg-purple-500"
                progress={50}
                footer={
                  <span className="flex items-center gap-1.5">
                    <FaArrowRight className="text-[9px]" />
                    Boshqarish
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
                <div className="flex gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                    {stats.totalUsers} muallif
                  </span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-100">
                    {stats.totalAdmins} taqrizchi
                  </span>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Ism, familiya, email yoki telefon bo'yicha qidirish..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="input input-bordered w-full rounded-xl border-slate-200 bg-slate-50 pl-8 text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
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
                      <td colSpan="5" className="py-12 text-center">
                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FaUsers className="text-3xl opacity-30" />
                          <p className="text-sm">Foydalanuvchilar topilmadi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.email} className="border-slate-50 transition hover:bg-slate-50/70">
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600">
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
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                              Muallif
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          {user.role !== ROLES.SUPERADMIN && user.email !== userData?.email && (
                            <button
                              onClick={() => handleToggleAdminRole(user)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                user.role === ROLES.ADMIN
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                            >
                              {user.role === ROLES.ADMIN ? (
                                <>
                                  <FaUserTimes />
                                  Taqrizchi rolini olish
                                </>
                              ) : (
                                <>
                                  <FaUserShield />
                                  Taqrizchi qilish
                                </>
                              )}
                            </button>
                          )}
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
              Muallif uchun izoh
            </label>
            <textarea
              value={decisionDescription}
              onChange={(e) => setDecisionDescription(e.target.value)}
              className="textarea textarea-bordered w-full h-28"
              placeholder="Masalan: Maqola dastlabki ko'rikdan o'tdi. Nashr jarayonini davom ettirish uchun PAYME orqali to'lov qiling..."
            />
          </div>

          <p className="text-sm text-gray-600">
            Qabul qilinganda muallif panelida PAYME test to'lov havolasi ochiladi. Rad etilganda jarayon yakunlanadi.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleQuickDecision(selectedArticle, "accept")}
              className="btn btn-success flex-1 gap-2"
            >
              <FaCheckCircle />
              PAYMEga yuborish
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

      <ArticleDetailModal
        isOpen={detailArticle !== null}
        onClose={() => setDetailArticle(null)}
        article={detailArticle}
        role="superadmin"
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

export default SuperAdminDashboard;
