import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import SEO from "../../components/SEO";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setFieldError("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldError("");
    setLoading(true);

    // Validatsiya
    if (!email.trim()) {
      setFieldError("Email manzilni kiriting");
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldError("Email noto'g'ri formatda");
      setLoading(false);
      return;
    }

    try {
      // Mock rejimi
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Email mavjudligini tekshirish
        const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        const userExists = mockUsers.find(u => u.email === email);
        
        if (!userExists) {
          setError("Bu email bilan ro'yxatdan o'tilmagan");
          setLoading(false);
          return;
        }
        
        // Mock rejimda muvaffaqiyatli
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Haqiqiy API
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/password-reset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.detail || "Xatolik yuz berdi");
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
        title="Parolni tiklash | KTRI Jurnali"
        description="Kasbiy ta'limni rivojlantirish instituti jurnali - parolni tiklash"
        keywords="parolni tiklash, forgot password, KTRI, jurnal"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Parolni tiklash</h2>
            <p className="text-gray-600">
              Email manzilingizni kiriting va biz sizga parolni tiklash havolasini yuboramiz
            </p>
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
                {import.meta.env.VITE_USE_MOCK === 'true' ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Mock rejim</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800 mb-3">
                        🔧 <strong>Mock rejimda ishlayapsiz!</strong> Haqiqiy email yuborilmaydi.
                      </p>
                      <p className="text-sm text-blue-700 mb-2">
                        Parolni o'zgartirish uchun:
                      </p>
                      <ol className="text-sm text-blue-700 text-left list-decimal list-inside space-y-1">
                        <li>Eski parolingiz bilan tizimga kiring</li>
                        <li>Admin panelga o'ting</li>
                        <li>Sozlamalar → Parolni o'zgartirish</li>
                      </ol>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        to="/login"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 cursor-pointer"
                      >
                        Tizimga kirish
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Email yuborildi!</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Parolni tiklash havolasi emailingizga yuborildi. Iltimos, email qutingizni tekshiring.
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 cursor-pointer"
                    >
                      <FiArrowLeft />
                      Kirish sahifasiga qaytish
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className={`h-5 w-5 ${fieldError ? 'text-red-400' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        className={`block w-full pl-10 pr-3 py-3 border ${fieldError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                        placeholder="example@mail.com"
                      />
                    </div>
                    {fieldError && (
                      <p className="mt-1 text-sm text-red-600">{fieldError}</p>
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
                      <span>Havolani yuborish</span>
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    <FiArrowLeft />
                    Kirish sahifasiga qaytish
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;
