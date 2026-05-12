import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaFileInvoice,
  FaHome,
  FaNewspaper,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaArrowRight,
  FaDownload,
  FaSpinner,
} from "react-icons/fa";
import { fetchWithAuth } from "../../utils/authenticatedFetch.js";
import { getAccessToken } from "../../utils/authStorage.js";
import { parseApiError } from "../../utils/apiError.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import { toast } from "react-toastify";

function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh: refreshAccessToken } = React.useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);

  // URL parametrlarini olish
  // CLICK: ?payment_id=xxx&payment_status=2
  // Backend return_url: ?maqola_id=xxx
  let maqolaId = searchParams.get("maqola_id") || searchParams.get("article_id");
  const paymentId = searchParams.get("payment_id");
  const paymentStatus = searchParams.get("payment_status"); // CLICK status: 2=success, -1=error
  
  // Agar URL da maqola_id yo'q bo'lsa, sessionStorage dan olish
  if (!maqolaId) {
    maqolaId = sessionStorage.getItem('pending_payment_article_id');
  }
  
  // Backend so'rovi uchun ID (maqola_id kerak)
  const queryId = maqolaId;
  

  // To'lov holatini tekshirish (maqola_id orqali)
  const verifyPayment = useCallback(async () => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    if (!base || !queryId) {
      setLoading(false);
      
      // Agar maqola_id topilmasa lekin CLICK success status bo'lsa
      if (paymentStatus === "2") {
        setError("To'lov muvaffaqiyatli, lekin maqola ID topilmadi. Dashboard dan maqolangizni tekshiring.");
      } else {
        setError("To'lov ID si topilmadi");
      }
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
        setPaymentData(json);
      } else {
        setError(parseApiError(json, "To'lov ma'lumotlarini yuklashda xatolik"));
      }
    } catch (err) {
      setError(err.message || "To'lov ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [queryId, maqolaId, paymentStatus, refreshAccessToken]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  // Agar holat "KUTILMOQDA" bo'lsa, polling qilish (CLICK webhook kechikishi mumkin)
  useEffect(() => {
    if (!paymentData) return;
    
    const isPending = paymentData.holat === "KUTILMOQDA" || paymentData.status === "KUTILMOQDA";
    const maxPolls = 10; // Maksimum 10 marta tekshirish (30 soniya)
    
    if (isPending && pollingCount < maxPolls) {
      const timer = setTimeout(() => {
        setPollingCount(prev => prev + 1);
        verifyPayment();
      }, 3000); // Har 3 soniyada tekshirish
      
      return () => clearTimeout(timer);
    }
  }, [paymentData, pollingCount, verifyPayment]);

  // Backend dan kelgan holat: "MUVAFFAQIYATLI" yoki "KUTILMOQDA" yoki "XATOLIK"
  // CLICK payment_status: 2=success, -1=error, -2=cancelled
  const isSuccess = 
    paymentData?.holat === "MUVAFFAQIYATLI" || 
    paymentData?.status === "MUVAFFAQIYATLI" ||
    paymentStatus === "2"; // CLICK success
    
  const isPending = 
    (paymentData?.holat === "KUTILMOQDA" || paymentData?.status === "KUTILMOQDA") &&
    paymentStatus !== "2" && // Agar CLICK success desa, pending emas
    paymentStatus !== "-1"; // Agar CLICK error desa, pending emas
  
  // Maqola ID (URL dan yoki backend javobidan)
  const articleId = maqolaId || paymentData?.maqola_id || paymentData?.article_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-5xl mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">To'lov natijasi tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  // Agar holat "KUTILMOQDA" bo'lsa, pending UI ko'rsatish
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-yellow-50 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          {/* Pending Icon */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100">
              <FaClock className="animate-pulse text-yellow-600 text-6xl" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
              To'lov tasdiqlanmoqda...
            </h1>
            <p className="mt-2 text-slate-600">
              To'lovingiz qayta ishlanmoqda. Iltimos, kuting.
            </p>
          </div>

          {/* Info Card */}
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <FaSpinner className="animate-spin text-yellow-600 text-xl" />
              <h3 className="text-lg font-black text-slate-900">Nima bo'lyapti?</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <strong>1.</strong> To'lovingiz CLICK to'lov tizimi orqali amalga oshirildi.
              </p>
              <p>
                <strong>2.</strong> Endi to'lov tasdiqlanishi kutilmoqda (odatda 10-30 soniya).
              </p>
              <p>
                <strong>3.</strong> Tasdiqlangandan so'ng, maqolangiz avtomatik tarzda qabul qilinadi.
              </p>
            </div>
          </div>

          {/* Polling Status */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-sm text-slate-600">
              Avtomatik tekshirilmoqda... ({pollingCount}/10)
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(pollingCount / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Manual Refresh */}
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <FaInfoCircle className="text-blue-600" />
              <h3 className="text-sm font-black text-blue-900">Qo'lda yangilash</h3>
            </div>
            <p className="mb-4 text-sm text-blue-800">
              Agar kutish uzoq davom etsa, quyidagi tugmani bosing:
            </p>
            <button
              onClick={() => {
                setPollingCount(0);
                verifyPayment();
              }}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
            >
              Holatni yangilash
            </button>
          </div>

          {/* Support */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-black text-slate-900">Yordam kerakmi?</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FaEnvelope className="text-slate-400" />
                <a href="mailto:info@ktri.uz" className="font-semibold text-slate-700 hover:underline">
                  info@ktri.uz
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaPhone className="text-slate-400" />
                <a href="tel:+998712345678" className="font-semibold text-slate-700 hover:underline">
                  +998 (71) 234-56-78
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 mb-10">
        <div className="mx-auto max-w-3xl">
          {/* Success Icon */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <FaCheckCircle className="text-green-600 text-6xl" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
              To'lov muvaffaqiyatli amalga oshirildi!
            </h1>
            <p className="mt-2 text-slate-600">
              Maqolangiz uchun to'lov qabul qilindi. Rahmat!
            </p>
          </div>

          {/* Payment Details Card */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center gap-3">
                <FaFileInvoice className="text-white text-2xl" />
                <div>
                  <h2 className="text-xl font-black text-white">To'lov ma'lumotlari</h2>
                  <p className="text-blue-100 text-sm">Tranzaksiya tafsilotlari</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {(paymentData?.tranzaksiya_id || paymentData?.transaction_id || paymentId) && (
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Tranzaksiya raqami
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                      {paymentData?.tranzaksiya_id || paymentData?.transaction_id || paymentId}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const txId = paymentData?.tranzaksiya_id || paymentData?.transaction_id || paymentId;
                      navigator.clipboard.writeText(txId);
                      toast.success("Nusxalandi!");
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Nusxalash
                  </button>
                </div>
              )}

              {(paymentData?.summa || paymentData?.amount) && (
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    To'lov summasi
                  </p>
                  <p className="mt-1 text-2xl font-black text-green-600">
                    {Number(paymentData?.summa || paymentData?.amount).toLocaleString()} so'm
                  </p>
                </div>
              )}

              {articleId && (
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Maqola ID
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    #{articleId}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sana va vaqt
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {paymentData?.vaqt 
                    ? new Date(paymentData.vaqt).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date().toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </p>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
            >
              <FaHome className="text-sm" />
              Dashboard ga o'tish
            </button>
            {articleId && (
              <button
                onClick={() => navigate(`/profile?article=${articleId}`)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FaNewspaper className="text-sm" />
                Maqolani ko'rish
              </button>
            )}
          </div>

          {/* Support Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <FaInfoCircle className="text-amber-600" />
              <h3 className="text-sm font-black text-amber-900">Yordam kerakmi?</h3>
            </div>
            <p className="mb-4 text-sm text-amber-800">
              Agar to'lov yoki maqola holati bo'yicha savollaringiz bo'lsa, biz bilan bog'laning:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FaEnvelope className="text-amber-600" />
                <a
                  href="mailto:info@ktri.uz"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  info@ktri.uz
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaPhone className="text-amber-600" />
                <a
                  href="tel:+998712345678"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  +998 (71) 234-56-78
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error/Failed state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 py-12 px-4 mb-10">
      <div className="mx-auto max-w-2xl">
        {/* Error Icon */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <FaTimesCircle className="text-red-600 text-6xl" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
            To'lov amalga oshmadi
          </h1>
          <p className="mt-2 text-slate-600">
            {error || "To'lov jarayonida xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."}
          </p>
        </div>

        {/* Error Details */}
        {(paymentData?.tranzaksiya_id || paymentData?.transaction_id || paymentId) && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
            <h3 className="mb-3 text-sm font-black text-slate-900">Tranzaksiya ma'lumotlari</h3>
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Tranzaksiya raqami:</span>{" "}
              <span className="font-mono">{paymentData?.tranzaksiya_id || paymentData?.transaction_id || paymentId}</span>
            </p>
          </div>
        )}

        {/* Troubleshooting */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-black text-slate-900">Nima qilish mumkin?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <FaArrowRight className="mt-1 text-blue-600 text-sm shrink-0" />
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Kartangizda mablag' borligini tekshiring</span> va
                qaytadan to'lovni amalga oshiring.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <FaArrowRight className="mt-1 text-blue-600 text-sm shrink-0" />
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Internet aloqangizni tekshiring</span> va sahifani
                yangilang.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <FaArrowRight className="mt-1 text-blue-600 text-sm shrink-0" />
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Boshqa to'lov kartasidan</span> foydalanib ko'ring.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <FaArrowRight className="mt-1 text-blue-600 text-sm shrink-0" />
              <p className="text-sm text-slate-700">
                Agar muammo davom etsa,{" "}
                <a href="mailto:info@ktri.uz" className="font-semibold text-blue-600 hover:underline">
                  qo'llab-quvvatlash xizmatiga
                </a>{" "}
                murojaat qiling.
              </p>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {articleId && (
            <button
              onClick={() => navigate(`/profile?article=${articleId}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
            >
              <FaClock className="text-sm" />
              Qaytadan to'lash
            </button>
          )}
          <button
            onClick={() => navigate("/profile")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FaHome className="text-sm" />
            Dashboard
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-black text-slate-900">Yordam kerakmi?</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FaEnvelope className="text-slate-400" />
              <a href="mailto:info@ktri.uz" className="font-semibold text-slate-700 hover:underline">
                info@ktri.uz
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FaPhone className="text-slate-400" />
              <a href="tel:+998712345678" className="font-semibold text-slate-700 hover:underline">
                +998 (71) 234-56-78
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentResult;
