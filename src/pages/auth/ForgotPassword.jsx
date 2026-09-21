import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import SEO from "../../components/SEO";
import { parseApiError } from "../../utils/apiError";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldError("");

    if (!email.trim()) {
      setFieldError("Email kiritilishi shart");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldError("Email noto'g'ri formatda");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/auth/forgot-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      let data;
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        setSent(true);
        setResendCooldown(60);
      } else {
        setError(parseApiError(data, "So'rov bajarilmadi"));
      }
    } catch {
      setError("Xatolik yuz berdi. Iltimos qayta urinib ko'ring");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/auth/forgot-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      let data;
      try { data = await response.json(); } catch { data = {}; }
      if (response.ok) {
        setResendCooldown(60);
      } else {
        setError(parseApiError(data, "So'rov bajarilmadi"));
      }
    } catch {
      setError("Xatolik yuz berdi. Iltimos qayta urinib ko'ring");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO noindex
        title="Parolni tiklash | KTRI Jurnali"
        description="Kasbiy ta'limni rivojlantirish instituti jurnali - parolni tiklash"
        keywords="parolni tiklash, forgot password, KTRI, jurnal"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/">
              <img
                src="/new_logo_blue_2026.png"
                alt="KTRI Logo"
                className="mx-auto h-20 w-auto mb-4"
              />
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Parolni tiklash
            </h2>
            <p className="text-gray-600">
              {sent
                ? "Emailingizni tekshiring"
                : "Emailingizni kiriting — tiklash havolasini yuboramiz"}
            </p>
          </div>

          <div className="bg-white shadow-2xl rounded-2xl p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {sent ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <FiCheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Havola yuborildi!
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium text-blue-700">{email}</span> manziliga parol tiklash havolasi yuborildi.
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Emaildagi havolani bosib yangi parolni o'rnating. Havola 1 soat amal qiladi.
                </p>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-blue-600 border border-blue-300 hover:bg-blue-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading
                    ? "Yuborilmoqda..."
                    : resendCooldown > 0
                    ? `Qayta yuborish (${resendCooldown}s)`
                    : "Havolani qayta yuborish"}
                </button>

                <button
                  type="button"
                  onClick={() => { setSent(false); setResendCooldown(0); }}
                  className="mt-3 w-full py-2.5 px-4 rounded-lg text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Emailni o'zgartirish
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className={`h-5 w-5 ${fieldError ? "text-red-400" : "text-gray-400"}`} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldError(""); setError(""); }}
                      className={`block w-full pl-10 pr-3 py-2.5 border ${fieldError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                      placeholder="example@gmail.com"
                    />
                  </div>
                  {fieldError && (
                    <p className="mt-1 text-sm text-red-600">{fieldError}</p>
                  )}
                </div>

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
                    <span>Havola yuborish</span>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                <FiArrowLeft />
                Kirish sahifasiga qaytish
              </Link>
            </div>
          </div>

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
