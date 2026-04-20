import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SEO = ({
  title = "Kasbiy ta'limni rivojlantirish instituti",
  description = "O'zbekiston Respublikasi Kasbiy ta'limni rivojlantirish instituti - kasbiy ta'lim, treninglar, sertifikatlashtirish va ko'proq",
  keywords = "kasb-hunar, kasbiy ta'lim, o'qitish, treninglar, sertifikat, o'zbekiston",
  image = "/og-image.jpg",
  type = "website",
  author = "Kasbiy ta'limni rivojlantirish instituti"
}) => {
  const location = useLocation();
  const siteUrl = import.meta.env.VITE_SITE_URL || "https://ktri.uz";
  const currentUrl = `${siteUrl}${location.pathname}`;
  
  // Full title construction
  const fullTitle = title.includes("Kasb-hunar") 
    ? title 
    : `${title} | Kasbiy ta'limni rivojlantirish instituti`;

  // Ensure image is absolute URL
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="Kasbiy ta'limni rivojlantirish instituti" />
      <meta property="og:locale" content="uz_UZ" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Uzbek" />
      <meta name="revisit-after" content="7 days" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Geo Tags - for Uzbekistan */}
      <meta name="geo.region" content="UZ" />
      <meta name="geo.placename" content="Toshkent" />
    </Helmet>
  );
};

export default SEO;
