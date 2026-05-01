import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaUser, FaCog, FaUsers, FaChartLine, FaPhone, FaEdit, FaLock } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";
import useGetFetchProfile from "../../hooks/useGetFetchProfile";
import { formatPhoneNumber } from "../../utils/phoneFormatter";
import { getAccessToken } from "../../utils/authStorage";
import { ROLES } from "../../constants/roles.js";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import UserDashboard from "../dashboard/user/UserDashboard.jsx";
import AdminDashboard from "../dashboard/admin/AdminDashboard.jsx";
import SuperAdminDashboard from "../dashboard/superadmin/SuperAdminDashboard.jsx";
import Modal from "../../components/Modal.jsx";

function AdminPanel() {
  const { auth, userData, logout, userRole: contextUserRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Get user role from context or userData
  const userRole = contextUserRole || userData?.role || ROLES.USER;
  
  // Debug: Console da rolni ko'rsatish
  useEffect(() => {
    console.log('👤 Current User Role:', userRole);
    console.log('📋 User Data:', userData);
    console.log('🔐 Context Role:', contextUserRole);
  }, [userRole, userData, contextUserRole]);

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

  const { data: user } = useGetFetchProfile(
    `${import.meta.env.VITE_BASE_URL}/user-data/`
  );

  useEffect(() => {
    if (!auth) {
      navigate("/login");
    } else if (user && user.is_verified === false) {
      navigate("/verify");
    }
  }, [auth, navigate, user]);

  // Get role-specific configuration
  const getRoleConfig = () => {
    switch (userRole) {
      case ROLES.ADMIN:
        return {
          title: "Taqrizchi paneli",
          subtitle: "Maqolalarni baholang",
          gradient: "from-purple-50 via-white to-indigo-50",
          headerGradient: "from-purple-500 to-indigo-600"
        };
      case ROLES.SUPERADMIN:
        return {
          title: "Super Admin paneli",
          subtitle: "Barcha ma'lumotlarni boshqaring",
          gradient: "from-emerald-50 via-white to-teal-50",
          headerGradient: "from-emerald-500 to-teal-600"
        };
      default:
        return {
          title: "Muallif paneli",
          subtitle: "Maqolalaringizni boshqaring",
          gradient: "from-slate-50 via-white to-blue-50",
          headerGradient: "from-blue-500 to-indigo-600"
        };
    }
  };

  const roleConfig = getRoleConfig();

  // Menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: <FaChartLine /> },
      { id: "profile", label: "Profil", icon: <FaUser /> },
      { id: "settings", label: "Sozlamalar", icon: <FaCog /> },
    ];

    if (userRole === ROLES.SUPERADMIN) {
      baseItems.splice(1, 0, { id: "users", label: "Foydalanuvchilar", icon: <FaUsers /> });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  // Profile update handlers
  const handleOpenEditModal = () => {
    setEditFormData({
      phone_number: user?.phone_number || "",
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
    setPasswordFormData({
      ...passwordFormData,
      [name]: value,
    });
    setPasswordFieldErrors({
      ...passwordFieldErrors,
      [name]: "",
    });
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
        return <AdminDashboard userData={userData} auth={auth} />;
      case ROLES.SUPERADMIN:
        return <SuperAdminDashboard userData={userData} auth={auth} />;
      default:
        return <UserDashboard userData={userData} auth={auth} />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${roleConfig.gradient} mt-20`}>
      <AdminHeader
        userRole={userRole}
        userData={userData}
        roleConfig={roleConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
        profileDropdownOpen={profileDropdownOpen}
        setProfileDropdownOpen={setProfileDropdownOpen}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && renderDashboard()}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profil ma'lumotlari</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ism</label>
                  <input
                    type="text"
                    value={user?.first_name || ""}
                    readOnly
                    className="input input-bordered w-full bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Familiya</label>
                  <input
                    type="text"
                    value={user?.last_name || ""}
                    readOnly
                    className="input input-bordered w-full bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="input input-bordered w-full bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="text"
                    value={user?.phone_number || ""}
                    readOnly
                    className="input input-bordered w-full bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleOpenEditModal}
                  className="btn btn-primary gap-2"
                >
                  <FaEdit />
                  Ma'lumotlarni tahrirlash
                </button>
                <button
                  onClick={() => setPasswordModalOpen(true)}
                  className="btn btn-secondary gap-2"
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
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar</h2>
            <p className="text-gray-600">Sozlamalar bo'limi ishlab chiqilmoqda...</p>
          </div>
        )}

        {/* Users Tab (SuperAdmin only) - Rendered by SuperAdminDashboard */}
        {activeTab === "users" && userRole === ROLES.SUPERADMIN && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <SuperAdminDashboard userData={userData} auth={auth} />
          </div>
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
  );
}

export default AdminPanel;
