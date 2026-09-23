import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://journal.ktri.uz").replace(/\/$/, "");
export const SITE_NAME = "KTRI Ilmiy jurnali";

const SEO = ({
  title = "KTRI Ilmiy jurnali - Kasbiy ta'limni rivojlantirish instituti",
  description = "Kasbiy ta'limni rivojlantirish instituti ilmiy jurnali - kasbiy ta'lim sohasidagi ilmiy maqolalar va tadqiqotlar",
  keywords = "ilmiy jurnal, kasbiy ta'lim, ilmiy maqolalar, KTRI",
  image = "/new_logo_blue_2026.png",
  type = "website",
  author = "Kasbiy ta'limni rivojlantirish instituti",
  noindex = false,
  children,
}) => {
  const location = useLocation();
  // Query parametrlarsiz, oxirida "/" siz kanonik URL
  const path = location.pathname.length > 1 ? location.pathname.replace(/\/+$/, "") : "/";
  const currentUrl = `${SITE_URL}${path}`;

  // Sarlavhada jurnal nomi bo'lmasa, oxiriga qo'shiladi
  const fullTitle = /KTRI/i.test(title) ? title : `${title} | ${SITE_NAME}`;

  // Description 160 belgidan oshmasin (Google shu qadar ko'rsatadi)
  const plainDescription = String(description || "").replace(/\s+/g, " ").trim();
  const metaDescription = plainDescription.length > 160
    ? `${plainDescription.slice(0, 157).trimEnd()}...`
    : plainDescription;

  // Ensure image is absolute URL
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={currentUrl} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="uz_UZ" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Geo Tags - for Uzbekistan */}
      <meta name="geo.region" content="UZ" />
      <meta name="geo.placename" content="Toshkent" />

      {/* Sahifaga xos qo'shimcha teglar (masalan, citation_*) */}
      {children}
    </Helmet>
  );
};

export default SEO;
