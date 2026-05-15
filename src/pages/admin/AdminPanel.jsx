import React, { useContext, useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaUser, FaCog, FaUsers, FaChartLine, FaPhone, FaEdit, FaLock, FaNewspaper, FaBook } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { getAccessToken } from "../../utils/authStorage";
import { ROLES, normalizeRole } from "../../constants/roles.js";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import UserDashboard from "../dashboard/user/UserDashboard.jsx";
import AdminDashboard from "../dashboard/admin/AdminDashboard.jsx";
import SuperAdminDashboard from "../dashboard/superadmin/SuperAdminDashboard.jsx";
import MaqolalarView from "../dashboard/superadmin/MaqolalarView.jsx";
import JurnalSonlariView from "../dashboard/superadmin/JurnalSonlariView.jsx";
import JurnalSonQoshish from "../dashboard/superadmin/JurnalSonQoshish.jsx";
import Modal from "../../components/Modal.jsx";
import { NotificationProvider } from "../../context/NotificationContext.jsx";
import { fetchWithAuth } from "../../utils/authenticatedFetch.js";
import { parseApiError } from "../../utils/apiError.js";

function normalizeProfilUser(payload) {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload.malumotlar || payload.user || {};
  if (!raw || typeof raw !== "object") return null;

  return {
    ...raw,
    id: raw.id ?? payload.user?.id,
    first_name: raw.first_name ?? raw.ism ?? payload.user?.ism ?? "",
    last_name: raw.last_name ?? raw.familiya ?? payload.user?.familiya ?? "",
    email: raw.email ?? payload.user?.email ?? "",
    phone_number: raw.phone_number ?? raw.telefon ?? payload.user?.telefon ?? "",
    role: normalizeRole(payload.rol ?? payload.user?.rol ?? raw.role),
    tip: payload.tip,
    tashkilot: raw.tashkilot ?? payload.user?.tashkilot ?? "",
  };
}

function AdminPanel() {
  const { auth, userData, logout, userRole: contextUserRole, refresh: refreshAccessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "dashboard");

  // CLICK to'lovdan qaytganda redirect qilish
  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status");
    const paymentId = searchParams.get("payment_id");
    
    // Agar CLICK parametrlari mavjud bo'lsa, payment-result ga yo'naltirish
    if (paymentStatus && paymentId) {
      // SessionStorage dan maqola_id ni olish (handlePay da saqlangan)
      const articleId = sessionStorage.getItem('pending_payment_article_id');
      
      // Maqola ID bilan birga payment-result ga yo'naltirish
      if (articleId) {
        navigate(`/payment-result?maqola_id=${articleId}&payment_id=${paymentId}&payment_status=${paymentStatus}`, { replace: true });
        // Tozalash
        sessionStorage.removeItem('pending_payment_article_id');
      } else {
        // Maqola ID topilmasa, faqat payment ma'lumotlari bilan
        navigate(`/payment-result?payment_id=${paymentId}&payment_status=${paymentStatus}`, { replace: true });
      }
    }
  }, [searchParams, navigate]);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profilPayload, setProfilPayload] = useState(null);
  const [profilError, setProfilError] = useState("");

  // Profile edit states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    phone_number: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});

  const profilUser = useMemo(() => normalizeProfilUser(profilPayload), [profilPayload]);
  const profileUser = profilUser || userData || {};
  const userRole = normalizeRole(profilPayload?.rol || contextUserRole || profileUser?.role || userData?.role);

  useEffect(() => {
    if (!auth) return;
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    const token = getAccessToken();
    if (!base || !token) return;

    let cancelled = false;
    const loadProfil = async () => {
      try {
        setProfilError("");
        const res = await fetchWithAuth(
          `${base}/profil/`,
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
          throw new Error(parseApiError(json, "Profil ma'lumotlarini yuklab bo'lmadi"));
        }
        if (!cancelled) setProfilPayload(json);
      } catch (error) {
        if (!cancelled) {
          setProfilError(error.message || "Profil ma'lumotlarini yuklab bo'lmadi");
        }
      }
    };

    loadProfil();
    return () => {
      cancelled = true;
    };
  }, [auth, refreshAccessToken]);

  useEffect(() => {
    if (!auth) {
      navigate("/login");
    } else if (profileUser?.is_verified === false) {
      navigate("/verify");
    }
  }, [auth, navigate, profileUser]);

  const roleConfig = useMemo(() => {
    switch (userRole) {
      case ROLES.ADMIN:
        return {
          title: "Taqrizchi paneli",
          subtitle: "Maqolalarni baholang",
          gradient: "bg-[#f6f8fc]",
          headerGradient: "from-purple-500 to-indigo-600"
        };
      case ROLES.SUPERADMIN:
        return {
          title: "Admin paneli",
          subtitle: "Barcha ma'lumotlarni boshqaring",
          gradient: "bg-[#f6f8fc]",
          headerGradient: "from-emerald-500 to-teal-600"
        };
      default:
        return {
          title: "Muallif paneli",
          subtitle: "Maqolalaringizni boshqaring",
          gradient: "bg-[#f6f8fc]",
          headerGradient: "from-blue-500 to-indigo-600"
        };
    }
  }, [userRole]);

  const menuItems = useMemo(() => {
    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: <FaChartLine /> },
      { id: "profile", label: "Profil", icon: <FaUser /> },
      { id: "settings", label: "Sozlamalar", icon: <FaCog /> },
    ];

    if (userRole === ROLES.SUPERADMIN) {
      baseItems.splice(1, 0, { id: "users", label: "Foydalanuvchilar", icon: <FaUsers /> });
      baseItems.splice(2, 0, { id: "maqolalar", label: "Maqolalar", icon: <FaNewspaper /> });
      baseItems.splice(3, 0, { id: "jurnal-sonlar", label: "Jurnal sonlari", icon: <FaBook /> });
    }

    return baseItems;
  }, [userRole]);

  // Profile update handlers
  const handleOpenEditModal = () => {
    setEditFormData({
      phone_number: profileUser?.phone_number || profileUser?.telefon || "",
    });
    setUpdateError("");
    setUpdateSuccess("");
    setEditModalOpen(true);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setEditFormData({
      phone_number: formatted,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/user-data/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
        body: JSON.stringify({
          phone_number: editFormData.phone_number,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUpdateSuccess("Ma'lumotlar muvaffaqiyatli yangilandi!");
        setTimeout(() => {
          setEditModalOpen(false);
          window.location.reload();
        }, 1500);
      } else {
        setUpdateError("Xatolik yuz berdi: " + (data.detail || JSON.stringify(data)));
      }
    } catch (err) {
      setUpdateError("Xatolik yuz berdi: " + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
    setPasswordFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setUpdateError("");
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordFormData.old_password) {
      errors.old_password = "Eski parolni kiriting";
    }
    
    if (!passwordFormData.new_password) {
      errors.new_password = "Yangi parolni kiriting";
    } else if (passwordFormData.new_password.length < 8) {
      errors.new_password = "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
    }
    
    if (!passwordFormData.confirm_password) {
      errors.confirm_password = "Parolni tasdiqlang";
    } else if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      errors.confirm_password = "Parollar mos kelmadi";
    }
    
    setPasswordFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError("");
    setUpdateSuccess("");
    setPasswordFieldErrors({});

    if (!validatePasswordForm()) {
      setUpdateLoading(false);
      return;
    }

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
        body: JSON.stringify({
          old_password: passwordFormData.old_password,
          new_password: passwordFormData.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUpdateSuccess("Parol muvaffaqiyatli o'zgartirildi!");
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordFormData({
            old_password: "",
            new_password: "",
            confirm_password: "",
          });
        }, 1500);
      } else {
        setUpdateError("Xatolik yuz berdi: " + (data.detail || data.old_password?.[0] || JSON.stringify(data)));
      }
    } catch (err) {
      setUpdateError("Xatolik yuz berdi: " + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Render appropriate dashboard based on role
  const renderDashboard = () => {
    switch (userRole) {
      case ROLES.ADMIN:
        return <AdminDashboard userData={profileUser} />;
      case ROLES.SUPERADMIN:
        return <SuperAdminDashboard userData={profileUser} view="articles" />;
      default:
        return <UserDashboard userData={profileUser} profilePayload={profilPayload} />;
    }
  };

  return (
    <NotificationProvider userData={profileUser} userRole={userRole}>
    <div className={`min-h-screen ${roleConfig.gradient}`}>
      <AdminHeader
        userRole={userRole}
        userData={profileUser}
        roleConfig={roleConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
        profileDropdownOpen={profileDropdownOpen}
        setProfileDropdownOpen={setProfileDropdownOpen}
        onLogout={handleLogout}
      />

      <main className="px-4 pb-10 sm:pb-20 pt-28 sm:px-6 lg:ml-72 lg:px-8 lg:pt-24">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && renderDashboard()}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Akkaunt</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Profil ma'lumotlari</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {profileUser?.email || "Profil"}
              </span>
            </div>
            
            <div className="space-y-6">
              {profilError && userRole === ROLES.USER && (
                <div className="alert alert-warning">
                  <span>{profilError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ism</label>
                  <input
                    type="text"
                    value={profileUser?.first_name || profileUser?.ism || ""}
                    readOnly
                    className="input input-bordered w-full bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Familiya</label>
                  <input
                    type="text"
                    value={profileUser?.last_name || profileUser?.familiya || ""}
                    readOnly
                    className="input input-bordered w-full bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileUser?.email || ""}
                    readOnly
                    className="input input-bordered w-full bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="text"
                    value={profileUser?.phone_number || profileUser?.telefon || ""}
                    readOnly
                    className="input input-bordered w-full bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tashkilot</label>
                  <input
                    type="text"
                    value={profileUser?.tashkilot || profileUser?.taskilot || ""}
                    readOnly
                    className="input input-bordered w-full bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                  <input
                    type="text"
                    value={profilPayload?.rol || profileUser?.role || ""}
                    readOnly
                    className="input input-bordered w-full bg-slate-50"
                  />
                </div>
                {userRole === ROLES.USER && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maqolalar soni</label>
                    <input
                      type="text"
                      value={`${profilPayload?.maqolalar?.length ?? 0} ta`}
                      readOnly
                      className="input input-bordered w-full bg-slate-50"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  disabled
                  className="btn btn-primary gap-2 opacity-50 cursor-not-allowed"
                >
                  <FaEdit />
                  Ma'lumotlarni tahrirlash
                </button>
                <button
                  disabled
                  className="btn btn-secondary gap-2 opacity-50 cursor-not-allowed"
                >
                  <FaLock />
                  Parolni o'zgartirish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="rounded-[1.35rem] border border-slate-200 bg-white p-8 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0d4ea3]">Konfiguratsiya</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Sozlamalar</h2>
            <p className="mt-4 text-gray-600">Sozlamalar bo'limi ishlab chiqilmoqda...</p>
          </div>
        )}

        {/* Foydalanuvchilar — faqat SUPERADMIN uchun (dashboard bilan bir xil SuperAdminDashboard) */}
        {activeTab === "users" && userRole === ROLES.SUPERADMIN && (
          <SuperAdminDashboard userData={profileUser} view="users" />
        )}

        {activeTab === "maqolalar" && userRole === ROLES.SUPERADMIN && (
          <MaqolalarView />
        )}

        {activeTab === "jurnal-sonlar" && userRole === ROLES.SUPERADMIN && (
          <JurnalSonlariView onAddNew={() => setActiveTab("jurnal-son-qoshish")} />
        )}

        {activeTab === "jurnal-son-qoshish" && userRole === ROLES.SUPERADMIN && (
          <JurnalSonQoshish
            onBack={() => setActiveTab("jurnal-sonlar")}
            onSuccess={() => setActiveTab("jurnal-sonlar")}
          />
        )}
      </main>

      {/* Edit Profile Modal */}

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Profilni tahrirlash"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {updateError && (
            <div className="alert alert-error">
              <span>{updateError}</span>
            </div>
          )}
          {updateSuccess && (
            <div className="alert alert-success">
              <span>{updateSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaPhone className="inline mr-2" />
              Telefon raqami
            </label>
            <input
              type="text"
              value={editFormData.phone_number}
              onChange={handlePhoneChange}
              placeholder="+998 (__) ___-__-__"
              className="input input-bordered w-full"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="btn btn-ghost"
              disabled={updateLoading}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateLoading}
            >
              {updateLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saqlanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Parolni o'zgartirish"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {updateError && (
            <div className="alert alert-error">
              <span>{updateError}</span>
            </div>
          )}
          {updateSuccess && (
            <div className="alert alert-success">
              <span>{updateSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eski parol
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                name="old_password"
                value={passwordFormData.old_password}
                onChange={handlePasswordChange}
                className={`input input-bordered w-full pr-12 ${passwordFieldErrors.old_password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showOldPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {passwordFieldErrors.old_password && (
              <p className="text-red-500 text-xs mt-1">{passwordFieldErrors.old_password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yangi parol
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="new_password"
                value={passwordFormData.new_password}
                onChange={handlePasswordChange}
                className={`input input-bordered w-full pr-12 ${passwordFieldErrors.new_password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {passwordFieldErrors.new_password && (
              <p className="text-red-500 text-xs mt-1">{passwordFieldErrors.new_password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parolni tasdiqlang
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={passwordFormData.confirm_password}
                onChange={handlePasswordChange}
                className={`input input-bordered w-full pr-12 ${passwordFieldErrors.confirm_password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {passwordFieldErrors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">{passwordFieldErrors.confirm_password}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="btn btn-ghost"
              disabled={updateLoading}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateLoading}
            >
              {updateLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  O'zgartirilmoqda...
                </>
              ) : (
                "O'zgartirish"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
    </NotificationProvider>
  );
}

export default AdminPanel;
