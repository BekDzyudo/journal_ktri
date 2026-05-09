import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaEnvelope,
  FaFileAlt,
  FaLayerGroup,
  FaNewspaper,
  FaTag,
  FaUser,
} from "react-icons/fa";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { getAccessToken } from "../../../utils/authStorage.js";
import { fetchWithAuth } from "../../../utils/authenticatedFetch.js";
import { parseApiError } from "../../../utils/apiError.js";
import {
  inferMuallifHolatKeyForPanel,
  normalizeMaqolalarList,
} from "../../../utils/maqolaApi.js";
import {
  MUALLIF_API_HOLAT_COLORS,
  MUALLIF_API_HOLAT_LABELS,
} from "../../../constants/roles.js";
import { formatArticleDateTime, getArticleDate } from "../../../utils/articleDashboardHelpers.js";

function DetailRow({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>
      <p className="wrap-break-word text-sm font-bold text-slate-800">{value || "—"}</p>
    </div>
  );
}

function getAuthorInfo(payload) {
  const raw = payload?.malumotlar || payload?.user || {};
  const name = [raw?.ism || raw?.first_name, raw?.familiya || raw?.last_name].filter(Boolean).join(" ");
  return {
    name,
    email: raw?.email || payload?.user?.email || "",
    phone: raw?.telefon || raw?.phone_number || payload?.user?.telefon || "",
    role: payload?.rol || payload?.user?.rol || "MUALLIF",
  };
}

function UserArticleDetail() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { refresh: refreshAccessToken } = useContext(AuthContext);
  const [profilePayload, setProfilePayload] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
    const token = getAccessToken();
    if (!base || !token) {
      setError("Profil ma'lumotlarini olish uchun tizimga kiring.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
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
        const found = normalizeMaqolalarList(json).find((item) => String(item.id) === String(articleId));
        if (!found) {
          throw new Error("Maqola topilmadi.");
        }
        if (!cancelled) {
          setProfilePayload(json);
          setArticle(found);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Maqolani yuklashda xatolik");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [articleId, refreshAccessToken]);

  const statusInfo = useMemo(() => {
    if (!article) return { label: "—", className: "bg-gray-100 text-gray-800 border-gray-200" };
    const key = inferMuallifHolatKeyForPanel(article);
    return {
      label: MUALLIF_API_HOLAT_LABELS[key] || article.holat || "—",
      className: MUALLIF_API_HOLAT_COLORS[key] || "bg-gray-100 text-gray-800 border-gray-200",
    };
  }, [article]);

  const authorInfo = useMemo(() => getAuthorInfo(profilePayload), [profilePayload]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
          <p className="mt-4 text-sm font-semibold text-slate-500">Maqola yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
          <button
            onClick={() => navigate("/profile")}
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <FaArrowLeft className="text-xs" />
            Panelga qaytish
          </button>
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          onClick={() => navigate("/profile")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <FaArrowLeft className="text-xs" />
          Panelga qaytish
        </button>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700">
                  <FaNewspaper />
                  Maqola tafsilotlari
                </div>
                <h1 className="text-2xl font-black leading-tight text-slate-950">
                  {article.articleTitle || "Maqola"}
                </h1>
              </div>
              <span className={`inline-flex w-max items-center rounded-full border px-3 py-1 text-xs font-bold ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <DetailRow icon={<FaUser />} label="Mualliflar" value={article.authorNames} />
            <DetailRow icon={<FaCalendarAlt />} label="Yuborilgan vaqt" value={formatArticleDateTime(getArticleDate(article))} />
            <DetailRow icon={<FaTag />} label="Holat kaliti" value={article.holat || article.holatKey} />
            <DetailRow icon={<FaLayerGroup />} label="Rukn" value={article.category || article.rukn?.nom} />
            <DetailRow icon={<FaUser />} label="Profil egasi" value={authorInfo.name} />
            <DetailRow icon={<FaEnvelope />} label="Email" value={authorInfo.email} />
          </div>

          {(article.annotatsiya || article.annotation) && (
            <div className="border-t border-slate-100 p-6">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Annotatsiya</p>
              <p className="text-sm leading-7 text-slate-700">{article.annotatsiya || article.annotation}</p>
            </div>
          )}

          {article.articleFileUrl && (
            <div className="border-t border-slate-100 p-6">
              <a
                href={article.articleFileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                <FaFileAlt />
                Faylni ko'rish
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default UserArticleDetail;
