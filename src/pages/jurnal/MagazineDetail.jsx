import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaCalendar,
  FaEye,
  FaDownload,
  FaArrowLeft,
  FaFilePdf,
  FaUser,
  FaHashtag,
  FaBookOpen,
} from "react-icons/fa";
import { useHero } from "../../context/HeroContext";
import SEO from "../../components/SEO";
import useGetFetch from "../../hooks/useGetFetch";
import DOMPurify from "dompurify";

/** API dan kelgan HTML (masalan &lt;p&gt;...&lt;/p&gt;) dan meta uchun qisqa matn */
function stripHtmlToPlainText(html) {
  if (html == null || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function MagazineDetail() {
  const { id } = useParams();
  const { setOnHero } = useHero();

  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  const { data: magazine, isPending, error } = useGetFetch(
    `${import.meta.env.VITE_BASE_URL}/jurnal-sonlari/${id}/`,
  );
  // Sanani formatlash
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  // Ko'rishlar sonini formatlash
  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  const normalizeArticles = (raw) => {
    const list = Array.isArray(raw) ? raw : [];
    return list.map((a, idx) => {
      const title =
        a?.title ||
        a?.name ||
        a?.maqola_nomi ||
        a?.articleTitle ||
        `Maqola #${idx + 1}`;

      const rawAuthor =
        a?.author ??
        a?.authorName ??
        a?.authorNames ??
        a?.authors ??
        a?.muallif ??
        a?.mualliflar ??
        null;

      const resolveAuthorString = (val) => {
        if (!val) return "-";
        if (typeof val === "string") return val;
        if (Array.isArray(val)) {
          const names = val
            .map((m) => {
              if (typeof m === "string") return m;
              return m?.ism_familya || [m?.ism, m?.familiya].filter(Boolean).join(" ") || null;
            })
            .filter(Boolean);
          return names.length > 0 ? names.join(", ") : "-";
        }
        if (typeof val === "object") {
          return val?.ism_familya || [val?.ism, val?.familiya].filter(Boolean).join(" ") || "-";
        }
        return String(val);
      };

      const author = resolveAuthorString(rawAuthor);

      const pdfUrl =
        a?.pdf ||
        a?.pdfUrl ||
        a?.pdf_url ||
        a?.file ||
        a?.fileUrl ||
        a?.file_url ||
        a?.downloadUrl ||
        a?.download_url ||
        "";

      const startPage =
        a?.startPage ?? a?.start_page ?? a?.pageStart ?? a?.page_start ?? a?.fromPage ?? a?.from_page;
      const endPage =
        a?.endPage ?? a?.end_page ?? a?.pageEnd ?? a?.page_end ?? a?.toPage ?? a?.to_page;

      const pagesText =
        Number.isFinite(Number(startPage)) && Number.isFinite(Number(endPage))
          ? `${Number(startPage)}–${Number(endPage)}`
          : startPage || endPage
            ? `${startPage || "?"}–${endPage || "?"}`
            : (a?.pages || a?.bet || a?.betlar || "-");

      const id = a?.id ?? a?.pk ?? `${idx}`;

      return { id, title, author, pdfUrl, pagesText, raw: a };
    });
  };

  if (isPending) {
    return (
      <section className="relative min-h-screen w-full bg-gradient-to-b from-base-100 via-base-200 to-base-100 py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">
            Ma'lumotlar yuklanmoqda...
          </p>
        </div>
      </section>
    );
  }

  if (!magazine) {
    return (
      <section className="relative min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 py-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Jurnal topilmadi
          </h2>
          <Link
            to="/magazines"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaArrowLeft />
            Jurnallar ro'yxatiga qaytish
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO
        title={`${magazine.title} - KTRI`}
        description={stripHtmlToPlainText(magazine.description)}
        keywords={`ilmiy jurnal, ${magazine.year} yil, ${magazine.issue}-son, kasbiy ta'lim, KTRI jurnal`}
      />

      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 relative min-h-screen w-full py-16 sm:py-24">
        <div className="px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 mb-16 sm:mb-20">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              to="/magazines"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8 transition-colors group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span>Jurnallarga qaytish</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 lg:gap-12">
            {/* Left Side - Magazine Image */}
            <div className="order-2 lg:order-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4">
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={magazine.image}
                      alt={magazine.title}
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Information */}
            <div className="order-1 lg:order-2 w-full">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#0d4ea3] mb-4">
                    {magazine.title}
                  </h1>
                  {/* Date and Views */}
                  <div className="flex flex-wrap items-center gap-6 text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-blue-600" size={20} />
                      <span className="text-sm font-medium">
                        {formatDate(magazine.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaEye className="text-green-600" size={20} />
                      <span className="text-sm font-medium">
                        {formatViews(magazine.views)} ko'rildi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jurnal haqida */}
                <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-100 p-6 lg:p-8">
                  <div
                    className="prose prose-lg max-w-none text-gray-800 leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(magazine.description || "", {
                        USE_PROFILES: { html: true },
                      }),
                    }}
                  />
                </div>

                {/* Download Button */}
                <a
                  href={magazine.pdfUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  <FaFilePdf size={24} />
                  <span>Jurnalni yuklab olish (PDF)</span>
                  <FaDownload size={18} />
                </a>

                {/* Maqolalar list */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
                  <div className="p-6 sm:p-7 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gray-100">
                    <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                          <FaBookOpen className="text-blue-700" size={18} />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Maqolalar ro‘yxati</h2>
                          <p className="text-sm text-gray-600 mt-0.5">Sarlavha, muallif, PDF va bet oralig‘i</p>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 font-semibold text-sm">
                        <FaHashtag className="text-blue-700" />
                        {normalizeArticles(magazine?.maqolalar || magazine?.articles || magazine?.maqolalar_royxati).length} ta
                      </div>
                    </div>
                  </div>

                  {normalizeArticles(magazine?.maqolalar || magazine?.articles || magazine?.maqolalar_royxati).length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <FaFilePdf className="text-gray-500" size={22} />
                      </div>
                      <p className="text-gray-700 font-semibold">Hozircha maqolalar ro‘yxati mavjud emas</p>
                      <p className="text-gray-500 text-sm mt-1">Keyinroq shu yerda paydo bo‘ladi.</p>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-7">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {normalizeArticles(magazine?.maqolalar || magazine?.articles || magazine?.maqolalar_royxati).map((a, idx) => (
                          <div
                            key={a.id}
                            className="group relative bg-white rounded-2xl border-2 border-gray-100 shadow-md hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden"
                          >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-60" />

                            <div className="p-5 flex flex-col h-full">
                              {/* Header */}
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold">
                                  {idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    to={`/article/${a.id}`}
                                    className="block font-bold text-gray-900 text-base leading-snug group-hover:text-blue-700 transition-colors break-words"
                                    title={a.title}
                                  >
                                    {a.title}
                                  </Link>
                                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                    <FaUser className="text-gray-400 shrink-0" />
                                    <span className="truncate" title={a.author}>{a.author}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Meta */}
                              <div className="mt-4 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs sm:text-sm border border-blue-100">
                                  <FaHashtag className="text-blue-700" />
                                  Bet: <span className="font-semibold">{a.pagesText}</span>
                                </span>
                                {a.pdfUrl ? (
                                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs sm:text-sm border border-emerald-100">
                                    <FaFilePdf className="text-emerald-600" />
                                    PDF bor
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs sm:text-sm border border-gray-200">
                                    <FaFilePdf className="text-gray-400" />
                                    PDF yo‘q
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="mt-auto pt-5 flex items-center gap-3">
                                {a.pdfUrl ? (
                                  <a
                                    href={a.pdfUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                                  >
                                    <FaFilePdf size={18} />
                                    <span>PDF yuklab olish</span>
                                    <FaDownload size={14} />
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold border border-gray-200 cursor-not-allowed"
                                  >
                                    <FaFilePdf size={18} />
                                    PDF mavjud emas
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
export default MagazineDetail;