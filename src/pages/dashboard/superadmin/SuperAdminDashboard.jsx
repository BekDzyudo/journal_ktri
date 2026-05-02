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
  FaComments,
  FaCommentDots,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal.jsx";
import ArticleDetailModal from "../../../components/ArticleDetailModal.jsx";
import ArticleChatModal from "../../../components/ArticleChatModal.jsx";
import StatsCard from "../../../components/admin/StatsCard.jsx";
import {
  ROLES,
  normalizeRole,
  ARTICLE_STATUS,
  SUPERADMIN_STATUS_DISPLAY,
  SUPERADMIN_STATUS_COLORS,
} from "../../../constants/roles.js";
import { getAccessToken } from "../../../utils/authStorage.js";
import {
  filterArticlesByDisplayStatus,
  uniqueDisplayStatuses,
} from "../../../utils/articleDashboardHelpers.js";

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

function SuperAdminDashboard({ userData }) {
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
  const [chatArticle, setChatArticle] = useState(null);
  const [messageArticle, setMessageArticle] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [decisionDescription, setDecisionDescription] = useState("");
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
      const accessToken = getAccessToken();
      const articlesRes = await fetch(`${import.meta.env.VITE_BASE_URL}/articles/all/`, {
        headers: { Authorization: "Bearer " + accessToken },
      });
      const usersRes = await fetch(`${import.meta.env.VITE_BASE_URL}/users/all/`, {
        headers: { Authorization: "Bearer " + accessToken },
      });

      const articlesData = articlesRes.ok ? await articlesRes.json() : [];
      const usersData = usersRes.ok ? await usersRes.json() : [];
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
  }, []);

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
      const accessToken = getAccessToken();
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/articles/assign/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          adminId: selectedAdmin,
        }),
      });

      if (!response.ok) throw new Error("Xatolik yuz berdi");
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
    const newStatus =
      decision === "accept" ? ARTICLE_STATUS.ACCEPTED : ARTICLE_STATUS.REJECTED;
    const label = decision === "accept" ? "Qabul qilindi" : "Rad etildi";

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/articles/change-status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
        body: JSON.stringify({
          articleId: article.id,
          status: newStatus,
          description: decisionDescription.trim(),
        }),
      });
      if (!response.ok) throw new Error("Xatolik yuz berdi");

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
      const accessToken = getAccessToken();
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/users/toggle-admin/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          role: isAdmin ? ROLES.USER : ROLES.ADMIN,
        }),
      });
      if (!response.ok) throw new Error("Xatolik yuz berdi");

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

  const uniqueStatuses = useMemo(
    () => uniqueDisplayStatuses(articles, SUPERADMIN_STATUS_DISPLAY),
    [articles]
  );

  const chatUserIdentity = useMemo(
    () => ({
      email: userData?.email,
      name: userData?.first_name
        ? `${userData.first_name} ${userData?.last_name ?? ""}`.trim()
        : userData?.email,
      role: "superadmin",
    }),
    [userData]
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard icon={<FaNewspaper />} title="Jami maqolalar" value={stats.totalArticles} gradient="from-emerald-50 to-emerald-100" iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <StatsCard icon={<FaClock />} title="Yangi materiallar" value={stats.newMaterials} gradient="from-cyan-50 to-cyan-100" iconBg="bg-gradient-to-br from-cyan-500 to-cyan-600" />
        <StatsCard icon={<FaUserShield />} title="Tayinlanganlar" value={stats.assigned} gradient="from-indigo-50 to-indigo-100" iconBg="bg-gradient-to-br from-indigo-500 to-indigo-600" />
        <StatsCard icon={<FaFileUpload />} title="Taqriz kelgan" value={stats.inReview} gradient="from-violet-50 to-violet-100" iconBg="bg-gradient-to-br from-violet-500 to-violet-600" />
        <StatsCard icon={<FaCheckCircle />} title="Qabul qilindi" value={stats.accepted} gradient="from-green-50 to-green-100" iconBg="bg-gradient-to-br from-green-500 to-green-600" />
        <StatsCard icon={<FaTimesCircle />} title="Rad etildi" value={stats.rejected} gradient="from-red-50 to-red-100" iconBg="bg-gradient-to-br from-red-500 to-red-600" />
        <StatsCard icon={<FaUsers />} title="Jami foydalanuvchilar" value={stats.totalUsers} gradient="from-blue-50 to-blue-100" iconBg="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatsCard icon={<FaUserShield />} title="Taqrizchilar" value={stats.totalAdmins} gradient="from-purple-50 to-purple-100" iconBg="bg-gradient-to-br from-purple-500 to-purple-600" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FaNewspaper className="text-emerald-600" />
          Maqolalar boshqaruvi
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
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

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left">Maqola nomi</th>
                <th className="text-left">Mualliflar</th>
                <th className="text-left">Yo'nalish</th>
                <th className="text-left">Yuborilgan sana</th>
                <th className="text-left">Status</th>
                <th className="text-left">Taqrizchi</th>
                <th className="text-left">Tayinlangan vaqti</th>
                <th className="text-center">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    Maqolalar topilmadi
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className={`hover:bg-gray-50 ${article.status === ARTICLE_STATUS.IN_EDITING ? "bg-purple-50/40" : ""}`}>
                    <td className="font-medium text-gray-900">{article.articleTitle}</td>
                    <td className="text-gray-600">{article.authorNames}</td>
                    <td className="text-gray-600">
                      {article.category ? (
                        <span className="flex items-center gap-1 text-xs">
                          <FaTag className="text-gray-400" />
                          {article.category}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-gray-600">
                      {new Date(article.createdAt || article.submittedAt || article.submittedDate).toLocaleDateString("uz-UZ")}
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(article.status)}`}>
                        {getStatusDisplay(article.status)}
                      </span>
                      {article.status === ARTICLE_STATUS.IN_EDITING && (
                        <span className="block text-xs text-purple-600 mt-1">Taqriz tayyor ✓</span>
                      )}
                    </td>
                    <td className="text-gray-600">
                      {article.assignedTo ? (
                        <span className="text-xs">{article.assignedTo}</span>
                      ) : (
                        <span className="text-xs text-gray-400">Tayinlanmagan</span>
                      )}
                    </td>
                    <td className="text-gray-600 text-xs">
                      {article.assignedAt
                        ? new Date(article.assignedAt).toLocaleString("uz-UZ")
                        : "-"}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => setDetailArticle(article)}
                          className="btn btn-sm btn-ghost text-blue-600"
                          title="Ko'rish"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setSelectedAdmin(article.assignedTo || "");
                            setAssignModalOpen(true);
                          }}
                          className="btn btn-sm btn-primary"
                          title={article.assignedTo ? "Taqrizchini almashtirish" : "Taqrizchiga tayinlash"}
                        >
                          <FaUserShield />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setDecisionDescription(article.finalDecisionDescription || "");
                            setDecisionModalOpen(true);
                          }}
                          className="btn btn-sm btn-warning gap-1"
                          title="Xulosa berish"
                        >
                          Xulosa
                        </button>
                        <button
                          onClick={() => setChatArticle(article)}
                          className="btn btn-sm btn-ghost text-indigo-600"
                          title="Muhokama"
                        >
                          <FaComments />
                        </button>
                        {article.finalDecisionDescription && (
                          <button
                            onClick={() => setMessageArticle(article)}
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

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FaUsers className="text-emerald-600" />
          Foydalanuvchilar boshqaruvi
        </h2>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Ism, familiya, email yoki telefon bo'yicha qidirish..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="input input-bordered flex-1"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
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
                  <td colSpan="5" className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                    <td className="text-gray-600">{user.email}</td>
                    <td className="text-gray-600">{user.phone_number || "N/A"}</td>
                    <td>
                      {user.role === ROLES.ADMIN ? (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">Taqrizchi</span>
                      ) : user.role === ROLES.SUPERADMIN ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">Super Admin</span>
                      ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Muallif</span>
                      )}
                    </td>
                    <td className="text-center">
                      {user.role !== ROLES.SUPERADMIN && user.email !== userData?.email && (
                        <button
                          onClick={() => handleToggleAdminRole(user)}
                          className={`btn btn-sm ${user.role === ROLES.ADMIN ? "btn-error gap-1" : "btn-success gap-1"}`}
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
                  {admin.first_name} {admin.last_name} ({admin.email})
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

      <Modal
        isOpen={decisionModalOpen}
        onClose={() => {
          setDecisionModalOpen(false);
          setSelectedArticle(null);
          setDecisionDescription("");
        }}
        title="Xulosa berish"
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
                  <a href={selectedArticle.reviewFileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-sm font-medium">
                    <FaExternalLinkAlt className="text-xs" />
                    Faylni ko'rish
                  </a>
                  <a href={selectedArticle.reviewFileUrl} download={selectedArticle.reviewFile} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm font-medium">
                    <FaDownload className="text-xs" />
                    Yuklab olish
                  </a>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Muallif uchun izoh / description
            </label>
            <textarea
              value={decisionDescription}
              onChange={(e) => setDecisionDescription(e.target.value)}
              className="textarea textarea-bordered w-full h-28"
              placeholder="Masalan: Maqolangiz qabul qilindi. Keyingi bosqich uchun tahririyat siz bilan bog'lanadi..."
            />
          </div>

          <p className="text-sm text-gray-600">
            Superadmin bu yerda adminga yubormasdan ham o'zi yakuniy xulosa berishi mumkin.
          </p>

          <div className="flex gap-3 pt-2">
            <button onClick={() => handleQuickDecision(selectedArticle, "accept")} className="btn btn-success flex-1 gap-2">
              <FaCheckCircle />
              Qabul qilish
            </button>
            <button onClick={() => handleQuickDecision(selectedArticle, "reject")} className="btn btn-error flex-1 gap-2">
              <FaTimesCircle />
              Rad etish
            </button>
          </div>
        </div>
      </Modal>

      <ArticleDetailModal isOpen={detailArticle !== null} onClose={() => setDetailArticle(null)} article={detailArticle} role="superadmin" />
      <ArticleDetailModal isOpen={messageArticle !== null} onClose={() => setMessageArticle(null)} article={messageArticle} role="user" />
      <ArticleChatModal
        isOpen={chatArticle !== null}
        onClose={() => setChatArticle(null)}
        article={chatArticle}
        currentUser={chatUserIdentity}
      />
    </div>
  );
}

export default SuperAdminDashboard;
