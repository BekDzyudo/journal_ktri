import React, { useEffect, useRef, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { fetchWithAuth } from "../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../utils/authStorage.js";
import { parseApiError } from "../../utils/apiError.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import { toast } from "react-toastify";

function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh: refreshAccessToken } = useContext(AuthContext);
  const processedRef = useRef(false);

  useEffect(() => {
    // Guard: faqat bir marta ishlatilsin (React StrictMode uchun ham)
    if (processedRef.current) return;
    processedRef.current = true;

    const maqolaId =
      searchParams.get("maqola_id") ||
      searchParams.get("article_id") ||
      sessionStorage.getItem("pending_payment_article_id");
    const paymentStatus = searchParams.get("payment_status");

    // sessionStorage ni darhol tozalash
    sessionStorage.removeItem("pending_payment_article_id");

    const process = async () => {
      // Click xatosi yoki foydalanuvchi bekor qilgan
      if (paymentStatus === "-1") {
        toast.error("To'lov amalga oshmadi.");
        navigate("/profile");
        return;
      }

      const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

      if (!base || !maqolaId) {
        toast.error("To'lov ma'lumotlari topilmadi.");
        navigate("/profile");
        return;
      }

      try {
        const res = await fetchWithAuth(
          `${base}/v1/tolov/holati/${maqolaId}/`,
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

        if (res.ok && json) {
          const holat = (json.maqola_holat || json.holat || "").toUpperCase();
          const isSuccess =
            holat === "QABUL_QILINGAN" ||
            holat === "NASHR_ETILGAN" ||
            json.tolov_amalga_oshirildi === true;

          if (isSuccess) {
            toast.success("To'lov muvaffaqiyatli! Maqolangiz qabul qilindi.");
          } else {
            toast.info("Profilingizdan maqola holatini kuzatishingiz mumkin.");
          }
        } else {
          toast.error(parseApiError(json, "To'lov holatini tekshirishda xatolik."));
        }
      } catch (err) {
        toast.error(err.message || "To'lov jarayonida xatolik.");
      }

      navigate("/profile");
    };

    process().catch(() => navigate("/profile"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center">
        <FaSpinner className="animate-spin text-blue-600 text-5xl mx-auto mb-4" />
        <p className="text-slate-600 font-semibold">To'lov natijasi tekshirilmoqda...</p>
      </div>
    </div>
  );
}

export default PaymentResult;
