import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus, FiPhone } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import SEO from "../../components/SEO";
import { formatPhoneNumber, cleanPhoneNumber } from "../../utils/phoneFormatter";

function Register() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "+998 ",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth) {
      navigate("/admin");
    }
  }, [auth, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      const formatted = formatPhoneNumber(value);
      setFormData({
        ...formData,
        [name]: formatted,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    setFieldErrors({
      ...fieldErrors,
      [name]: "",
    });
    setError("");
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.first_name.trim()) {
      errors.first_name = "Ism kiritilishi shart";
    }
    
    if (!formData.last_name.trim()) {
      errors.last_name = "Familiya kiritilishi shart";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email kiritilishi shart";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email noto'g'ri formatda";
    }
    
    const cleanPhone = cleanPhoneNumber(formData.phone_number);
    if (cleanPhone.length < 12) {
      errors.phone_number = "Telefon raqam to'liq emas (12 ta raqam)";
    }
    
    if (!formData.password) {
      errors.password = "Parol kiritilishi shart";
    } else if (formData.password.length < 8) {
      errors.password = "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
    }
    
    if (!formData.confirm_password) {
      errors.confirm_password = "Parolni tasdiqlang";
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = "Parollar mos kelmadi";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        const userExists = mockUsers.find(u => u.email === formData.email);
        
        if (userExists) {
          setFieldErrors({ email: "Bu email allaqachon ro'yxatdan o'tgan" });
          setLoading(false);
          return;
        }
        
        mockUsers.push({
          id: Date.now(),
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          password: formData.password,
          date_joined: new Date().toISOString(),
        });
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
        
        navigate("/login", { state: { message: "Ro'yxatdan o'tdingiz! Endi tizimga kiring." } });
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login", { state: { message: "Ro'yxatdan o'tdingiz! Endi tizimga kiring." } });
      } else {
        const errorMessage = data.detail || data.email?.[0] || data.phone_number?.[0] || JSON.stringify(data) || "Xatolik yuz berdi";
        setError(errorMessage);
      }
    } catch (err) {
      setError("Xatolik yuz berdi. Iltimos qayta urinib ko'ring");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Ro'yxatdan o'tish | KTRI Jurnali"
        description="Kasbiy ta'limni rivojlantirish instituti jurnali - ro'yxatdan o'tish"
        keywords="ro'yxatdan o'tish, register, KTRI, jurnal"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/">
              <img
                src="/new_logo_white.png"
                alt="KTRI Logo"
                className="mx-auto h-20 w-auto mb-4"
              />
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Ro'yxatdan o'tish</h2>
            <p className="text-gray-600">Yangi hisob yaratish uchun ma'lumotlarni kiriting</p>
          </div>

          <div className="bg-white shadow-2xl rounded-2xl p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ism
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className={`h-5 w-5 ${fieldErrors.first_name ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${fieldErrors.first_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                    placeholder="Ismingizni kiriting"
                  />
                </div>
                {fieldErrors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Familiya
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className={`h-5 w-5 ${fieldErrors.last_name ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${fieldErrors.last_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                    placeholder="Familiyangizni kiriting"
                  />
                </div>
                {fieldErrors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.last_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className={`h-5 w-5 ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                    placeholder="example@mail.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon raqam
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className={`h-5 w-5 ${fieldErrors.phone_number ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${fieldErrors.phone_number ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                    placeholder="+998 XX XXX XX XX"
                    maxLength="17"
                  />
                </div>
                {fieldErrors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.phone_number}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Parol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
                {!fieldErrors.password && (
                  <p className="mt-1 text-xs text-gray-500">Kamida 8 ta belgidan iborat bo'lishi kerak</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                  Parolni tasdiqlang
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 ${fieldErrors.confirm_password ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border ${fieldErrors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
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
                {fieldErrors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirm_password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Yuklanmoqda...</span>
                  </>
                ) : (
                  <>
                    <FiUserPlus className="h-5 w-5" />
                    <span>Ro'yxatdan o'tish</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Hisobingiz bormi?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer"
                >
                  Tizimga kiring
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
            >
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;
