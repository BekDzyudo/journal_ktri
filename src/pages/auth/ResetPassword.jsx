import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import SEO from "../../components/SEO";
import { parseApiError } from "../../utils/apiError";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFieldErrors({
      ...fieldErrors,
      [name]: "",
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    // Validatsiya
    const errors = {};
    
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

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      if (!token) {
        setError("Token topilmadi. Iltimos, emaildan kelgan havolani ishlating");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/auth/password-reset-confirm/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password: formData.password,
            confirm_password: formData.confirm_password,
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch {
        setError("Server javobi noto'g'ri formatda");
        return;
      }

      if (response.ok) {
        setSuccess(true);
        const msg =
          typeof data?.message === "string"
            ? data.message
            : "Parol muvaffaqiyatli o'zgartirildi!";
        setTimeout(() => {
          navigate("/login", { replace: true, state: { message: msg } });
        }, 3000);
      } else {
        setError(parseApiError(data, "Parolni o'rnatib bo'lmadi"));
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
        title="Yangi parol o'rnatish | KTRI Jurnali"
        description="Kasbiy ta'limni rivojlantirish instituti jurnali - yangi parol o'rnatish"
        keywords="yangi parol, reset password, KTRI, jurnal"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo va Sarlavha */}
          <div className="text-center mb-8">
            <Link to="/">
              <img
                src="/new_logo_white.png"
                alt="KTRI Logo"
                className="mx-auto h-20 w-auto mb-4"
              />
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Yangi parol o'rnatish</h2>
            <p className="text-gray-600">Hisobingiz uchun yangi parol kiriting</p>
          </div>

          {/* Form */}
          <div className="bg-white shadow-2xl rounded-2xl p-8">
            {success ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Parol muvaffaqiyatli o'zgartirildi!</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Parolingiz yangilandi. Endi yangi parol bilan tizimga kirishingiz mumkin.
                </p>
                <p className="text-xs text-gray-500">3 soniyadan keyin login sahifasiga yo'naltirilasiz...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Yangi parol
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
                      <span>Parolni o'rnatish</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Back to Home */}
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

export default ResetPassword;
