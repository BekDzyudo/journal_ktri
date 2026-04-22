import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaUser, FaEnvelope, FaCalendar, FaNewspaper, FaCog, FaSignOutAlt, FaPhone, FaEdit, FaLock, FaTrash } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import useGetFetchProfile from "../../hooks/useGetFetchProfile";
import Modal from "../../components/Modal";
import { formatPhoneNumber } from "../../utils/phoneFormatter";

function AdminPanel() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    phone_number: "",
  });
  
  // Password form state
  const [passwordFormData, setPasswordFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading and error states
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});

  const { data: user } = useGetFetchProfile(
    `${import.meta.env.VITE_BASE_URL}/user-data/`
  );

  React.useEffect(() => {
    if (!auth) {
      navigate("/login");
    }
    if (user?.phone_number) {
      setEditFormData({
        phone_number: user.phone_number,
      });
    }
  }, [auth, navigate, user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        const userIndex = mockUsers.findIndex(u => u.email === currentUserData.email);
        if (userIndex !== -1) {
          mockUsers[userIndex].phone_number = editFormData.phone_number;
          localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
          
          const updatedUserData = { ...currentUserData, phone_number: editFormData.phone_number };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
        }
        
        setUpdateSuccess("Ma'lumotlar muvaffaqiyatli yangilandi!");
        setTimeout(() => {
          setEditModalOpen(false);
          window.location.reload();
        }, 1500);
        setUpdateLoading(false);
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
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
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        const userIndex = mockUsers.findIndex(u => u.email === currentUserData.email);
        if (userIndex !== -1) {
          if (mockUsers[userIndex].password !== passwordFormData.old_password) {
            setPasswordFieldErrors({ old_password: "Eski parol noto'g'ri" });
            setUpdateLoading(false);
            return;
          }
          
          mockUsers[userIndex].password = passwordFormData.new_password;
          localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
        }
        
        setUpdateSuccess("Parol muvaffaqiyatli o'zgartirildi!");
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordFormData({
            old_password: "",
            new_password: "",
            confirm_password: "",
          });
        }, 1500);
        setUpdateLoading(false);
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
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

  const menuItems = [
    { id: "profile", label: "Profil", icon: <FaUser /> },
    { id: "articles", label: "Maqolalar", icon: <FaNewspaper /> },
    { id: "settings", label: "Sozlamalar", icon: <FaCog /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto flex mb-16 sm:mb-20">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] bg-white shadow-xl border-r border-gray-200 sticky top-4 md:top-6 rounded-l-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="p-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 cursor-pointer ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            <hr className="my-4 border-gray-200" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
            >
              <FaSignOutAlt className="text-lg" />
              <span className="font-medium">Chiqish</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 bg-white rounded-r-2xl shadow-xl min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 md:mb-8 font-serif">
              {menuItems.find(item => item.id === activeTab)?.label}
            </h1>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div className="space-y-5 md:space-y-6">
                  <div className="flex items-start justify-between pb-6 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Shaxsiy ma'lumotlar</h2>
                      <p className="text-sm text-gray-600">Sizning hisob ma'lumotlaringiz</p>
                    </div>
                    <button
                      onClick={handleOpenEditModal}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <FaEdit />
                      <span>Tahrirlash</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <FaUser className="text-blue-600 text-xl" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ism</p>
                        <p className="font-medium text-gray-900">{user?.first_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <FaUser className="text-blue-600 text-xl" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Familiya</p>
                        <p className="font-medium text-gray-900">{user?.last_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <FaEnvelope className="text-blue-600 text-xl" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="font-medium text-gray-900">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <FaPhone className="text-blue-600 text-xl" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Telefon</p>
                        <p className="font-medium text-gray-900">{user?.phone_number || "Kiritilmagan"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
                      <FaCalendar className="text-blue-600 text-xl" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ro'yxatdan o'tgan sana</p>
                        <p className="font-medium text-gray-900">
                          {user?.date_joined ? new Date(user.date_joined).toLocaleDateString("uz-UZ") : "Ma'lumot yo'q"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Tab */}
            {activeTab === "articles" && (
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div className="text-center py-8 md:py-12">
                  <FaNewspaper className="mx-auto text-6xl text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Maqolalar topilmadi</h3>
                  <p className="text-gray-600 mb-6">Siz hali hech qanday maqola yubormadingiz</p>
                  <button
                    onClick={() => navigate("/send-article")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
                  >
                    Maqola yuborish
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-5 md:space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-5 md:mb-6">Xavfsizlik sozlamalari</h2>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => setPasswordModalOpen(true)}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FaLock className="text-blue-600 text-xl" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Parolni o'zgartirish</p>
                          <p className="text-sm text-gray-500">Hisobingiz xavfsizligini oshiring</p>
                        </div>
                      </div>
                      <span className="text-gray-400">→</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-red-200">
                  <h2 className="text-xl font-semibold text-red-600 mb-5 md:mb-6">Xavfli zona</h2>
                  
                  <button className="w-full flex items-center justify-between p-4 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FaTrash className="text-red-600 text-xl" />
                      <div className="text-left">
                        <p className="font-medium text-red-600">Hisobni o'chirish</p>
                        <p className="text-sm text-red-500">Barcha ma'lumotlar o'chiriladi</p>
                      </div>
                    </div>
                    <span className="text-red-400">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Profilni tahrirlash"
      >
        {updateSuccess && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-700 text-sm">{updateSuccess}</p>
          </div>
        )}

        {updateError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{updateError}</p>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon raqam
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="text-gray-400" />
              </div>
              <input
                type="tel"
                value={editFormData.phone_number}
                onChange={handlePhoneChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+998 XX XXX XX XX"
                maxLength="17"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={updateLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {updateLoading ? "Saqlanmoqda..." : "Saqlash"}
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
        {updateSuccess && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-700 text-sm">{updateSuccess}</p>
          </div>
        )}

        {updateError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{updateError}</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eski parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className={`${passwordFieldErrors.old_password ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type={showOldPassword ? "text" : "password"}
                name="old_password"
                value={passwordFormData.old_password}
                onChange={handlePasswordChange}
                className={`block w-full pl-10 pr-10 py-3 border ${passwordFieldErrors.old_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showOldPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {passwordFieldErrors.old_password && (
              <p className="mt-1 text-sm text-red-600">{passwordFieldErrors.old_password}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yangi parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className={`${passwordFieldErrors.new_password ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                name="new_password"
                value={passwordFormData.new_password}
                onChange={handlePasswordChange}
                className={`block w-full pl-10 pr-10 py-3 border ${passwordFieldErrors.new_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showNewPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {passwordFieldErrors.new_password && (
              <p className="mt-1 text-sm text-red-600">{passwordFieldErrors.new_password}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yangi parolni tasdiqlang
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className={`${passwordFieldErrors.confirm_password ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={passwordFormData.confirm_password}
                onChange={handlePasswordChange}
                className={`block w-full pl-10 pr-10 py-3 border ${passwordFieldErrors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showConfirmPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {passwordFieldErrors.confirm_password && (
              <p className="mt-1 text-sm text-red-600">{passwordFieldErrors.confirm_password}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={updateLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {updateLoading ? "O'zgartirilmoqda..." : "O'zgartirish"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminPanel;
