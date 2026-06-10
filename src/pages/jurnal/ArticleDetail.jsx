import React, { useContext, useEffect, useRef, useState } from "react";
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
  FaExpand,
  FaTimes,
} from "react-icons/fa";
import { useHero } from "../../context/HeroContext";
import { AuthContext } from "../../context/AuthContext.jsx";
import SEO from "../../components/SEO";
import useGetFetch from "../../hooks/useGetFetch";
import { getAccessToken } from "../../utils/authStorage.js";
import { toast } from "react-toastify";
import { fetchWithAuth } from "../../utils/authenticatedFetch.js";

/** API bergan nisbiy yoki to‘liq sertifikat URL ni fetch uchun mutlaq qiladi */
function resolveAbsoluteUrl(possibleRelative) {
  const p = (possibleRelative || "").trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    if (typeof window !== "undefined") {
      try {
        return new URL(p, window.location.href).href;
      } catch {
        return p;
      }
    }
    return p;
  }
  try {
    return new URL(p, `${base}/`).href;
  } catch {
    return p;
  }
}

/** Maqola obyektidan barcha mumkin bo’lgan sertifikat URL lar */
function resolveCertificateUrls(article, routeArticleId, authorIdx = 0) {
  const rawList = [];
  /** @param {unknown} v */
  const add = (v) => {
    if (v == null) return;
    if (typeof v === "string" && v.trim()) rawList.push(v.trim());
    else if (
      typeof v === "object"
      && typeof /** @type {{ url?: unknown }} */ (v).url === "string"
    ) {
      rawList.push(String(/** @type {{ url?: string }} */ (v).url).trim());
    }
  };

  // yangi: sertifikat_urls massivi (har bir muallif uchun alohida)
  const sertUrls = article?.sertifikat_urls;
  if (Array.isArray(sertUrls) && sertUrls.length > 0) {
    const idx = Math.min(authorIdx, sertUrls.length - 1);
    add(sertUrls[idx]);
  }

  add(article?.sertifikat_url);
  add(article?.sertifikatUrl);
  add(article?.certificate_url);
  add(article?.certificateUrl);
  add(article?.sertifikat);
  add(article?.sertifikat_fayl);
  add(article?.sertifikat_file);

  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const id =
    article?.id !== undefined && article?.id !== null
      ? String(article.id)
      : routeArticleId !== undefined && routeArticleId !== null
        ? String(routeArticleId)
        : "";

  if (base && id) rawList.push(`${base}/maqolalar/${id}/sertifikat/`);

  const seen = new Set();
  /** @type {string[]} */
  const urls = [];
  for (const r of rawList) {
    const abs = resolveAbsoluteUrl(String(r || "").trim());
    if (!abs || seen.has(abs)) continue;
    seen.add(abs);
    urls.push(abs);
  }
  return urls;
}

function credentialModeForApiUrl(url) {
  try {
    if (typeof window === "undefined") return "same-origin";
    return new URL(url).origin === window.location.origin ? "same-origin" : "include";
  } catch {
    return "include";
  }
}

/**
 * Sertifikat fayl turi: server ba'zan `application/octet-stream` yuboradi, PNG ni aniqlash uchun.
 * @returns {{ kind: 'image' | 'pdf', mime: string, ext: string }}
 */
async function inferCertificateKind(blob, headerContentType, sourceUrl) {
  const ct = (headerContentType || blob.type || "").toLowerCase().split(";")[0].trim();

  if (/^image\//.test(ct)) {
    let ext = "png";
    if (ct.includes("jpeg") || ct.includes("jpg")) ext = "jpg";
    else if (ct.includes("png")) ext = "png";
    else if (ct.includes("gif")) ext = "gif";
    else if (ct.includes("webp")) ext = "webp";
    return { kind: "image", mime: ct || "image/png", ext };
  }
  if (ct.includes("pdf") || ct === "application/x-pdf") {
    return { kind: "pdf", mime: "application/pdf", ext: "pdf" };
  }

  const path = (sourceUrl || "").split("?")[0].toLowerCase();
  const pathMatch = path.match(/\.(png|jpe?g|gif|webp)(\/?$|$)/i);
  if (pathMatch) {
    const e = pathMatch[1].toLowerCase() === "jpeg" ? "jpg" : pathMatch[1].toLowerCase();
    const mime =
      e === "png"
        ? "image/png"
        : e === "jpg"
          ? "image/jpeg"
          : e === "gif"
            ? "image/gif"
            : "image/webp";
    return { kind: "image", mime, ext: e };
  }
  if (/\.pdf(\/?$|$)/i.test(path)) {
    return { kind: "pdf", mime: "application/pdf", ext: "pdf" };
  }

  const buf = new Uint8Array(await blob.slice(0, 32).arrayBuffer());

  if (
    buf.length >= 8
    && buf[0] === 0x89
    && buf[1] === 0x50
    && buf[2] === 0x4e
    && buf[3] === 0x47
    && buf[4] === 0x0d
    && buf[5] === 0x0a
    && buf[6] === 0x1a
    && buf[7] === 0x0a
  ) {
    return { kind: "image", mime: "image/png", ext: "png" };
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: "image", mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buf.length >= 4
    && buf[0] === 0x47
    && buf[1] === 0x49
    && buf[2] === 0x46
    && buf[3] === 0x38
  ) {
    return { kind: "image", mime: "image/gif", ext: "gif" };
  }
  if (
    buf.length >= 12
    && buf[0] === 0x52
    && buf[1] === 0x49
    && buf[2] === 0x46
    && buf[3] === 0x46
    && buf[8] === 0x57
    && buf[9] === 0x45
    && buf[10] === 0x42
    && buf[11] === 0x50
  ) {
    return { kind: "image", mime: "image/webp", ext: "webp" };
  }
  if (
    buf.length >= 5
    && buf[0] === 0x25
    && buf[1] === 0x50
    && buf[2] === 0x44
    && buf[3] === 0x46
    && buf[4] === 0x2d
  ) {
    return { kind: "pdf", mime: "application/pdf", ext: "pdf" };
  }

  return { kind: "image", mime: "image/png", ext: "png" };
}

/** Sertifikat: anonim uchun cookie yubormasdan (omit), keyin cookie, oxirida JWT */
async function fetchCertificateDocument(url, getToken, refresh) {
  const cred = credentialModeForApiUrl(url);

  /* Maqola JSON (useGetFetch) bilan bir xil — anonim sahifa */
  let last = await fetch(url, { method: "GET" });
  if (last.ok) return last;

  last = await fetch(url, {
    method: "GET",
    credentials: "omit",
    headers: {},
  });
  if (last.ok) return last;

  last = await fetch(url, {
    method: "GET",
    credentials: cred,
    headers: {},
  });
  if (last.ok) return last;

  /* Admin panelidagi kabi JWT + refresh (401 da qayta urinish authenticatedFetch ichida) */
  return fetchWithAuth(
    url,
    { method: "GET", credentials: cred },
    getToken,
    refresh
  );
}
// console.log(certificateUrls)
async function blobFromCertificateResponse(res, url) {
  const blob = await res.blob();
  const headerCt = res.headers.get("content-type") || "";
  const inferred = await inferCertificateKind(blob, headerCt, url);
  const looseType =
    !blob.type || blob.type === "application/octet-stream";
  let outBlob = blob;
  if (looseType && inferred.mime) {
    outBlob = new Blob([await blob.arrayBuffer()], { type: inferred.mime });
  }
  return { outBlob, inferred };
}

function ArticleDetail() {
  const { articleId, id } = useParams();
  const finalId = articleId || id;
  const navigate = useNavigate();
  const { setOnHero } = useHero();
  const { refresh: refreshAccessToken } = useContext(AuthContext);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [certificateFullscreen, setCertificateFullscreen] = useState(false);
  /** Sertifikat: fetch → blob URL (iframe dagi X-Frame-Options muammosidan chetlash) */
  const [certObjectUrl, setCertObjectUrl] = useState(null);
  const [certKind, setCertKind] = useState(null); // 'pdf' | 'image' | null
  /** Yuklab olish fayl kengaytmasi (png, pdf, …) */
  const [certDownloadExt, setCertDownloadExt] = useState("png");
  const [certStatus, setCertStatus] = useState("idle"); // idle | loading | ready | error
  const [certErrorMsg, setCertErrorMsg] = useState("");
  const [certDownloading, setCertDownloading] = useState(false);
  const [certReloadNonce, setCertReloadNonce] = useState(0);
  const [activeCertIdx, setActiveCertIdx] = useState(0);
  const certBlobRef = useRef(null);

  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  useEffect(() => {
    if (!certificateFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setCertificateFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [certificateFullscreen]);

  const { data: article, isPending } = useGetFetch(
    finalId ? `${import.meta.env.VITE_BASE_URL}/maqolalar/${finalId}/` : null
  );

  /* Sertifikat blob yuklash — setState effekt ichida */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!article) {
      if (certBlobRef.current) {
        URL.revokeObjectURL(certBlobRef.current);
        certBlobRef.current = null;
      }
      setCertObjectUrl(null);
      setCertKind(null);
      setCertDownloadExt("png");
      setCertStatus("idle");
      setCertErrorMsg("");
      return undefined;
    }

    const urls = resolveCertificateUrls(article, finalId, activeCertIdx);

    if (!urls.length) {
      if (certBlobRef.current) {
        URL.revokeObjectURL(certBlobRef.current);
        certBlobRef.current = null;
      }
      setCertObjectUrl(null);
      setCertKind(null);
      setCertDownloadExt("png");
      setCertStatus("idle");
      setCertErrorMsg("");
      return undefined;
    }

    let cancelled = false;

    if (certBlobRef.current) {
      URL.revokeObjectURL(certBlobRef.current);
      certBlobRef.current = null;
    }
    setCertObjectUrl(null);
    setCertKind(null);
    setCertDownloadExt("png");
    setCertStatus("loading");
    setCertErrorMsg("");

    (async () => {
      try {
        /** @type {Response | null} */
        let okRes = null;
        let successUrl = "";
        let failCode = "?";

        for (const endpoint of urls) {
          const res = await fetchCertificateDocument(
            endpoint,
            getAccessToken,
            refreshAccessToken
          );
          if (res.ok) {
            okRes = res;
            successUrl = endpoint;
            break;
          }
          failCode = String(res.status);
        }

        if (!okRes) throw new Error(`HTTP ${failCode}`);

        const { outBlob, inferred } = await blobFromCertificateResponse(
          okRes,
          successUrl
        );

        if (cancelled) return;

        const objectUrl = URL.createObjectURL(outBlob);
        certBlobRef.current = objectUrl;
        setCertObjectUrl(objectUrl);
        setCertKind(inferred.kind);
        setCertDownloadExt(inferred.ext);
        setCertStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setCertStatus("error");
        setCertObjectUrl(null);
        setCertKind(null);
        setCertDownloadExt("png");
        const msg =
          e?.message && String(e.message).startsWith("HTTP")
            ? `Sertifikat yuklanmadi (${e.message}).`
            : "Sertifikat yuklanmadi (tarmoq xatosi).";
        setCertErrorMsg(msg);
      }
    })();

    return () => {
      cancelled = true;
      if (certBlobRef.current) {
        URL.revokeObjectURL(certBlobRef.current);
        certBlobRef.current = null;
      }
    };
  }, [article, finalId, refreshAccessToken, certReloadNonce, activeCertIdx]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
  const certificateUrls = resolveCertificateUrls(article, finalId, activeCertIdx);
  const perAuthorCertCount = Array.isArray(article?.sertifikat_urls) ? article.sertifikat_urls.length : 0;

  const handleCertDownload = async () => {
    if (certObjectUrl && certStatus === "ready") {
      const ext =
        certDownloadExt
        || (certKind === "image" ? "png" : "pdf");
      const a = document.createElement("a");
      a.href = certObjectUrl;
      a.download = `sertifikat-${finalId || "maqola"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    if (!certificateUrls.length) return;
    setCertDownloading(true);
    try {
      let okRes = null;
      let successUrl = "";
      let failStatus = "?";

      for (const endpoint of certificateUrls) {
        const res = await fetchCertificateDocument(
          endpoint,
          getAccessToken,
          refreshAccessToken
        );
        if (res.ok) {
          okRes = res;
          successUrl = endpoint;
          break;
        }
        failStatus = String(res.status);
      }

      if (!okRes) {
        toast.error(`Sertifikatni yuklab bo'lmadi (${failStatus}).`);
        return;
      }

      const { outBlob, inferred } = await blobFromCertificateResponse(
        okRes,
        successUrl
      );
      const u = URL.createObjectURL(outBlob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `sertifikat-${finalId || "maqola"}.${inferred.ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(u), 30_000);
    } catch (e) {
      toast.error(e?.message || "Sertifikatni yuklab bo'lmadi.");
    } finally {
      setCertDownloading(false);
    }
  };

  const openCertFullscreen = () => {
    if (certObjectUrl && certStatus === "ready") {
      setCertificateFullscreen(true);
      return;
    }
    if (certStatus === "loading") {
      toast.info("Sertifikat yuklanmoqda...");
      return;
    }
    toast.warning("Sertifikat hali tayyor emas — «Qayta urinish» yoki «Yuklab olish»dan foydalaning.");
  };
  return (
    <>
      <SEO
        title={`${article.sarlavha || article.title || article.maqola_nomi || "Maqola"} - KTRI`}
        description={article.annotatsiya || article.abstract || "KTRI ilmiy maqolasi"}
        keywords={`${keywords.join(", ")}, ${author}, ilmiy maqola`}
      />

      {certificateFullscreen && certObjectUrl && certStatus === "ready" && (
        <div
          className="fixed inset-0 z-[300] flex flex-col backdrop-blur-sm bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="Sertifikatni to'liq ekranda ko'rish"
          onClick={(e) => { if (e.target === e.currentTarget) setCertificateFullscreen(false); }}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/40 px-4 py-3 text-white">
            <p className="font-bold">Nashr sertifikati</p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCertDownload}
                disabled={certDownloading}
                className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaDownload />
                {certDownloading ? "Yuklanmoqda..." : "Yuklab olish"}
              </button>
              <button
                type="button"
                onClick={() => setCertificateFullscreen(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                <FaTimes className="text-lg" aria-hidden />
                Yopish
              </button>
            </div>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setCertificateFullscreen(false); }}
          >
            {certKind === "image" ? (
              <img
                src={certObjectUrl}
                alt=""
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <iframe
                title="Nashr sertifikati — to'liq ekran"
                src={certObjectUrl}
                className="h-full w-full rounded-lg border-0 bg-white shadow-2xl"
              />
            )}
          </div>
        </div>
      )}

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
                {certificateUrls.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4">
                    <p className="mb-3 text-center text-xs font-black uppercase tracking-wider text-emerald-700">
                      Nashr sertifikati
                    </p>
                    {perAuthorCertCount > 1 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {Array.from({ length: perAuthorCertCount }, (_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveCertIdx(idx)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              activeCertIdx === idx
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {authors[idx]?.ism_familya || `Muallif ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="relative min-h-[200px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {certStatus === "loading" && (
                        <div className="flex h-[min(52vh,520px)] flex-col items-center justify-center gap-3">
                          <span className="loading loading-spinner loading-lg text-emerald-600" />
                          <p className="text-sm text-slate-600">Sertifikat yuklanmoqda...</p>
                        </div>
                      )}
                      {certStatus === "error" && (
                        <div className="flex min-h-[min(52vh,520px)] flex-col items-center justify-center gap-4 p-6 text-center">
                          <p className="max-w-xs text-sm font-semibold text-red-700">{certErrorMsg || "Sertifikat yuklanmadi."}</p>
                          <button
                            type="button"
                            onClick={() => setCertReloadNonce((n) => n + 1)}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50"
                          >
                            Qayta urinish
                          </button>
                        </div>
                      )}
                      {certStatus === "ready" && certObjectUrl && certKind === "image" && (
                        <img
                          src={certObjectUrl}
                          alt="Nashr sertifikati"
                          className="max-h-[min(52vh,520px)] w-full object-contain object-center"
                        />
                      )}
                      {certStatus === "ready" && certObjectUrl && certKind === "pdf" && (
                        <iframe
                          title="Nashr sertifikati"
                          src={certObjectUrl}
                          className="h-[min(52vh,520px)] w-full border-0 bg-white"
                        />
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 justify-center gap-2">
                      <button
                        type="button"
                        onClick={openCertFullscreen}
                        disabled={certStatus === "loading"}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaExpand className="text-slate-600" />
                        To&apos;liq ekran
                      </button>
                      <button
                        type="button"
                        onClick={handleCertDownload}
                        disabled={certDownloading}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-2 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FaDownload />
                        {certDownloading ? "Yuklanmoqda..." : "Yuklab olish"}
                      </button>
                    </div>
                  </div>
                ) : journalImage ? (
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4">
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={journalImage}
                        alt={
                          article.sarlavha || article.maqola_nomi || "Jurnal rasmi"
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
                      <p className="text-gray-500">Sertifikat va jurnal rasmi mavjud emas</p>
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
