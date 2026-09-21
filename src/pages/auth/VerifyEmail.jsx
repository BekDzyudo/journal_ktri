import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import SEO from "../../components/SEO";
import { parseApiError } from "../../utils/apiError";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [verifyState, setVerifyState] = useState(token ? "loading" : "waiting");
  // verifyState: "waiting" | "loading" | "success" | "error"
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Token URL'da bo'lsa, avtomatik tasdiqlash
  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/auth/verify-email/${token}/`,
          { method: "GET" },
        );
        let data;
        try { data = await response.json(); } catch { data = {}; }

        if (response.ok) {
          setVerifyState("success");
          setTimeout(() => {
            navigate("/login", {
              replace: true,
              state: { message: "Email muvaffaqiyatli tasdiqlandi! Tizimga kirishingiz mumkin." },
            });
          }, 2500);
        } else {
          setVerifyState("error");
          setError(parseApiError(data, "Havolani tasdiqlashda xatolik yuz berdi."));
        }
      } catch {
        setVerifyState("error");
        setError("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleResend = async () => {
    setResendMessage("");
    setError("");

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Avval to'g'ri email kiriting");
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/auth/resend-verification/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      let data;
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        setResendMessage("Yangi havola emailingizga yuborildi.");
        setResendCooldown(60);
      } else {
        setError(parseApiError(data, "Havolani qayta yuborishda xatolik"));
      }
    } catch {
      setError("Xatolik yuz berdi. Iltimos qayta urinib ko'ring");
    } finally {
      setResendLoading(false);
    }
  };

  const renderContent = () => {
    if (verifyState === "loading") {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Email tasdiqlanmoqda...</p>
        </div>
      );
    }

    if (verifyState === "success") {
      return (
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <FiCheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Email muvaffaqiyatli tasdiqlandi!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Hisobingiz faollashtirildi. Tizimga kiring.
          </p>
          <p className="text-xs text-gray-400">
            2 soniyadan keyin kirish sahifasiga yo'naltirilasiz...
          </p>
        </div>
      );
    }

    if (verifyState === "error") {
      return (
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <FiAlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tasdiqlashda xatolik
          </h3>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            Yangi tasdiqlash havolasini so'rang:
          </p>
          {renderResendForm()}
        </div>
      );
    }

    // waiting — ro'yxatdan o'tgandan keyin ko'rsatiladigan sahifa
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <FiMail className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Emailingizni tekshiring
        </h3>
        <p className="text-gray-600 text-sm mb-2">
          {emailParam
            ? <><span className="font-medium text-blue-700">{emailParam}</span> manziliga tasdiqlash havolasi yuborildi.</>
            : "Emailingizga tasdiqlash havolasi yuborildi."}
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Emaildagi havolani bosib ro'yxatdan o'tishni yakunlang. Havola 24 soat amal qiladi.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded text-left">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {resendMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-3 rounded text-left">
            <p className="text-green-700 text-sm">{resendMessage}</p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-3">Havola kelmadimi?</p>
        {renderResendForm()}
      </div>
    );
  };

  const renderResendForm = () => (
    <div className="space-y-3">
      {!emailParam && (
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="example@gmail.com"
        />
      )}
      <button
        type="button"
        onClick={handleResend}
        disabled={resendLoading || resendCooldown > 0}
        className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-blue-600 border border-blue-300 hover:bg-blue-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {resendLoading
          ? "Yuborilmoqda..."
          : resendCooldown > 0
          ? `Qayta yuborish (${resendCooldown}s)`
          : "Havolani qayta yuborish"}
      </button>
    </div>
  );

  return (
    <>
      <SEO
        title="Email tasdiqlash | KTRI Jurnali"
        description="Kasbiy ta'limni rivojlantirish instituti jurnali - email tasdiqlash"
        keywords="email tasdiqlash, verify email, KTRI, jurnal"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Email tasdiqlash</h2>
          </div>

          <div className="bg-white shadow-2xl rounded-2xl p-8">
            {renderContent()}

            {verifyState !== "loading" && (
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  <FiArrowLeft />
                  Kirish sahifasiga qaytish
                </Link>
              </div>
            )}
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

export default VerifyEmail;
