import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaCalendar,
  FaUser,
  FaFilePdf,
  FaArrowLeft,
  FaDownload,
  FaTag,
  FaCopy,
  FaCheck,
  FaBook,
  FaCode,
  FaBriefcase,
  FaEnvelope,
  FaBuilding,
  FaUsers,
} from "react-icons/fa";
import { useHero } from "../../context/HeroContext";
import SEO from "../../components/SEO";
import useGetFetch from "../../hooks/useGetFetch";

function ArticleDetail() {
  const { articleId, id } = useParams();
  const finalId = articleId || id;
  const navigate = useNavigate();
  const { setOnHero } = useHero();
  const [copiedCitation, setCopiedCitation] = useState(false);

  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  const { data: article, isPending, error } = useGetFetch(
    finalId ? `${import.meta.env.VITE_BASE_URL}/maqolalar/${finalId}/` : null
  );

  // Sanani formatlash
  const formatDate = (dateString) => {
    if (!dateString) return "-";
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

  // Keywords ni formatlash
  const getKeywords = () => {
    if (article?.kalit_sozlar_list && Array.isArray(article.kalit_sozlar_list)) {
      return article.kalit_sozlar_list;
    }
    if (article?.kalit_sozlar) {
      if (Array.isArray(article.kalit_sozlar)) {
        return article.kalit_sozlar;
      }
      if (typeof article.kalit_sozlar === "string") {
        return article.kalit_sozlar.split(",").map((k) => k.trim());
      }
    }
    return [];
  };
  // Muallifni normalize qilish
  const getAuthors = () => {
    const rawAuthors = article?.muallif ?? article?.mualliflar ?? article?.authors ?? [];
    if (Array.isArray(rawAuthors)) {
      return [...rawAuthors]
        .sort((a, b) => (a?.tartib ?? 0) - (b?.tartib ?? 0))
        .map((a) => {
          if (typeof a === "string") return { ism_familya: a };
          return {
            ...a,
            ism_familya: a?.ism_familya || [a?.ism, a?.familiya].filter(Boolean).join(" "),
          };
        })
        .filter((a) => a.ism_familya);
    }
    if (rawAuthors && typeof rawAuthors === "object") {
      return [{
        ...rawAuthors,
        ism_familya: rawAuthors.ism_familya || [rawAuthors.ism, rawAuthors.familiya].filter(Boolean).join(" "),
      }].filter((a) => a.ism_familya);
    }
    return [];
  };

  const getAuthor = () => {
    const authors = getAuthors();
    if (authors.length > 0) {
      return authors.map((a) => a.ism_familya).join(", ");
    }
    const fallback = article?.author || article?.authorName || article?.authorNames || "-";
    return typeof fallback === "string" ? fallback : "-";
  };

  // PDF URL ni normalize qilish
  const getPdfUrl = () => {
    return (
      article?.pdf ||
      article?.pdfUrl ||
      article?.pdf_url ||
      article?.file ||
      article?.fileUrl ||
      article?.file_url ||
      article?.downloadUrl ||
      article?.download_url ||
      ""
    );
  };

  // Jurnal rasmini olish
  const getJournalImage = () => {
    return (
      article?.jurnal_soni?.image ||
      article?.journalImage ||
      article?.journal_image ||
      article?.magazine_image ||
      article?.magazineImage ||
      article?.image ||
      ""
    );
  };

  // Citation ni clipboard ga nusxalash
  const handleCopyCitation = () => {
    if (article?.how_to_cite) {
      navigator.clipboard.writeText(article.how_to_cite).then(() => {
        setCopiedCitation(true);
        setTimeout(() => setCopiedCitation(false), 2000);
      });
    }
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

  if (!article) {
    return (
      <section className="relative min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 py-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Maqola topilmadi
          </h2>
          <Link
            to="/magazines"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaArrowLeft />
            Jurnallarga qaytish
          </Link>
        </div>
      </section>
    );
  }

  const pdfUrl = getPdfUrl();
  const keywords = getKeywords();
  const authors = getAuthors();
  const author = getAuthor();
  const journalImage = getJournalImage();

  return (
    <>
      <SEO
        title={`${article.sarlavha || article.title || article.maqola_nomi || "Maqola"} - KTRI`}
        description={article.annotatsiya || article.abstract || "KTRI ilmiy maqolasi"}
        keywords={`${keywords.join(", ")}, ${author}, ilmiy maqola`}
      />

      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 relative min-h-screen w-full py-16 sm:py-24">
        <div className="px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 mb-16 sm:mb-20">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8 transition-colors group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span>Orqaga qaytish</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 lg:gap-12">
            {/* Left Side - Journal Image & Info */}
            <div className="order-2 lg:order-1">
              <div className="sticky top-24 space-y-6">
                {journalImage ? (
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4">
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={article?.jurnal_soni?.image}
                        alt={
                          article.sarlavha || article.maqola_nomi ||
                          "Jurnal rasmi"
                        }
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4 h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                        <FaFilePdf className="text-gray-400" size={24} />
                      </div>
                      <p className="text-gray-500">Jurnal rasmi mavjud emas</p>
                    </div>
                  </div>
                )}

                {/* Journal Info Card */}
                {article.jurnal_soni && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-200 p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">Jurnal ma'lumoti</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase">Nomi</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{article.jurnal_soni.title}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold uppercase">Son</p>
                          <p className="text-lg font-bold text-blue-700">{article.jurnal_soni.issue}-son</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold uppercase">Yil</p>
                          <p className="text-lg font-bold text-indigo-700">{article.jurnal_soni.year}</p>
                        </div>
                      </div>
                      {article.jurnal_soni.volume && (
                        <div>
                          <p className="text-xs text-gray-600 font-semibold uppercase">Jild</p>
                          <p className="text-sm font-semibold text-gray-900">{article.jurnal_soni.volume}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section */}
                {article.rukn && (
                  <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-2xl shadow-lg border-2 border-emerald-100 p-6 lg:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      Yo‘nalish
                    </h2>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                          <FaCode className="text-emerald-700" size={20} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Kod</p>
                        <p className="text-2xl font-bold text-emerald-700 mb-2">{article.rukn.kod}</p>
                        <p className="text-gray-800 font-semibold">{article.rukn.nom}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Information */}
            <div className="order-1 lg:order-2 w-full">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#0d4ea3] mb-6 leading-tight">
                    {article.sarlavha || article.title || article.maqola_nomi || "Maqola"}
                  </h1>

                  {/* Meta Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                          <FaUser className="text-blue-700" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Mualliflar</p>
                          <p className="text-sm font-bold text-gray-900">{author}</p>
                        </div>
                      </div>

                      {(article.nashr_sanasi || article.date) && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                            <FaCalendar className="text-blue-700" size={14} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Chop etilgan sana</p>
                            <p className="text-sm font-bold text-gray-900">
                              {formatDate(article.nashr_sanasi || article.date)}
                            </p>
                          </div>
                        </div>
                      )}

                      {article.boshqa_mualliflar && authors.length === 0 && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                            <FaUsers className="text-blue-700" size={18} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Hammualliflar</p>
                            <p className="text-sm font-bold text-gray-900">{article.boshqa_mualliflar}</p>
                          </div>
                        </div>
                      )}

                      {article.sahifalar && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                            <FaBook className="text-blue-700" size={14} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Betlar</p>
                            <p className="text-sm font-bold text-gray-900">{article.sahifalar}</p>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* Download Button */}
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                  >
                    <FaFilePdf size={24} />
                    <span>Maqolani yuklab olish (PDF)</span>
                    <FaDownload size={18} />
                  </a>
                )}

                {/* Keywords */}
                {keywords.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-100 p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FaTag className="text-blue-700" size={18} />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Kalit so'zlar
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-4 py-2 rounded-full bg-white border-2 border-blue-300 text-blue-900 text-sm font-medium hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 shadow-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Abstract */}
                {(article.annotatsiya || article.abstract || article.announcementText) && (
                  <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50 rounded-2xl shadow-lg border-2 border-indigo-100 p-6 lg:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      <FaBook className="text-indigo-600" size={20} />
                      Annotasiya
                    </h2>
                    <p className="text-gray-800 text-base lg:text-lg leading-relaxed whitespace-pre-wrap text-justify">
                      {article.annotatsiya || article.abstract || article.announcementText}
                    </p>
                  </div>
                )}

                {/* Author & Organization Info */}
                {authors.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-2xl shadow-lg border-2 border-purple-100 p-6 lg:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                      <FaUsers className="text-purple-600" size={20} />
                      Mualliflar haqida
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {authors.map((authorItem, idx) => (
                        <div key={authorItem.id ?? `${authorItem.email}-${idx}`} className="rounded-xl border border-purple-100 bg-white/80 p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                                <FaUser className="text-purple-700" size={16} />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">F.I.Sh</p>
                                <p className="font-bold text-gray-900">{authorItem.ism_familya}</p>
                              </div>
                            </div>
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              {idx === 0 ? "Asosiy muallif" : "Hammuallif"}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {authorItem.lavozim && (
                              <div className="flex items-start gap-2">
                                <FaBriefcase className="mt-0.5 text-purple-500" size={14} />
                                <div>
                                  <p className="text-xs text-gray-500">Lavozim</p>
                                  <p className="text-sm font-semibold text-gray-900">{authorItem.lavozim}</p>
                                </div>
                              </div>
                            )}

                            {authorItem.tashkilot && (
                              <div className="flex items-start gap-2">
                                <FaBuilding className="mt-0.5 text-purple-500" size={14} />
                                <div>
                                  <p className="text-xs text-gray-500">Tashkilot</p>
                                  <p className="text-sm font-semibold text-gray-900">{authorItem.tashkilot}</p>
                                </div>
                              </div>
                            )}

                            {authorItem.email && (
                              <div className="flex items-start gap-2">
                                <FaEnvelope className="mt-0.5 text-purple-500" size={14} />
                                <div>
                                  <p className="text-xs text-gray-500">Email</p>
                                  <a href={`mailto:${authorItem.email}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 break-all">
                                    {authorItem.email}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                 {/* Bibliography */}
                {article.adabiyotlar && (
                  <div className="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-2xl shadow-lg border-2 border-green-100 p-6 lg:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      <FaBook className="text-green-600" size={20} />
                      Foydalanilgan adabiyotlar
                    </h2>
                    <div className="space-y-3">
                      {Array.isArray(article.adabiyotlar) ? (
                        article.adabiyotlar.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-gray-800 text-base leading-relaxed pl-4 border-l-4 border-green-400 hover:bg-green-100/30 transition-colors p-2 rounded"
                          >
                            {typeof item === "string" ? (
                              item
                            ) : (
                              <>
                                <strong>{item.title || item.name}</strong>
                                {item.author && ` - ${item.author}`}
                                {item.year && ` (${item.year})`}
                              </>
                            )}
                          </div>
                        ))
                      ) : typeof article.adabiyotlar === "string" ? (
                        <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                          {article.adabiyotlar}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* How to Cite */}
                {article.how_to_cite && (
                  <div className="bg-gradient-to-br from-yellow-50 via-white to-yellow-50 rounded-2xl shadow-lg border-2 border-yellow-100 p-6 lg:p-8">
                    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <FaBook className="text-yellow-600" size={20} />
                        Iqtibos qilish
                      </h2>
                      <button
                        onClick={handleCopyCitation}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                          copiedCitation
                            ? "bg-green-500 text-white"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                      >
                        {copiedCitation ? (
                          <>
                            <FaCheck size={16} />
                            Nusxalandi
                          </>
                        ) : (
                          <>
                            <FaCopy size={16} />
                            Nusxalash
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap border-l-4 border-yellow-400 pl-4 bg-white rounded p-4">
                      {article.how_to_cite}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ArticleDetail;
