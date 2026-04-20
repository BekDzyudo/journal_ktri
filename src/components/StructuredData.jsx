import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * StructuredData Component - JSON-LD formatted structured data for SEO
 * 
 * Bu komponent Google va boshqa qidiruv tizimlariga mazmuningizni
 * yaxshiroq tushunishga yordam beradi va "Rich Snippets" yaratadi.
 */

// Organization Schema - Tashkilot haqida ma'lumot
export const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "O'zbekiston Respublikasi Kasbiy ta'limni rivojlantirish instituti",
    "alternateName": "YMTP",
    "url": "https://ktri.uz",
    "logo": "https://ktri.uz/logo.png",
    "description": "O'zbekiston Respublikasi Kasbiy ta'limni rivojlantirish instituti - kasbiy ta'lim, treninglar va sertifikatlashtirish",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Talabalar ko'chasi 96",
      "addressLocality": "Toshkent",
      "addressRegion": "Toshkent",
      "postalCode": "100000",
      "addressCountry": "UZ"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+998-71-XXX-XX-XX",
      "contactType": "customer service",
      "availableLanguage": ["uz", "ru"]
    },
    "sameAs": [
      "https://facebook.com/kasbhunar",
      "https://instagram.com/kasbhunar",
      "https://t.me/kasbhunar"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// WebSite Schema - Qidiruv funksiyasi bilan
export const WebSiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kasbiy ta'limni rivojlantirish instituti",
    "url": "https://ktri.uz",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://ktri.uz/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Breadcrumb Schema - Navigatsiya yo'li
export const BreadcrumbSchema = ({ items }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// JobPosting Schema - Vakansiya uchun
export const JobPostingSchema = ({ job }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Kasbiy ta'limni rivojlantirish instituti",
      "sameAs": "https://ktri.uz"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Toshkent",
        "addressCountry": "UZ"
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "UZS",
      "value": {
        "@type": "QuantitativeValue",
        "minValue": job.salary_min,
        "maxValue": job.salary_max,
        "unitText": "MONTH"
      }
    },
    "employmentType": job.rate >= 1 ? "FULL_TIME" : "PART_TIME",
    "datePosted": job.created_at,
    "validThrough": job.deadline,
    "experienceRequirements": {
      "@type": "OccupationalExperienceRequirements",
      "monthsOfExperience": job.experience_years * 12
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Article Schema - Yangiliklar va maqolalar uchun
export const ArticleSchema = ({ article }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": article.image,
    "author": {
      "@type": "Organization",
      "name": "Kasbiy ta'limni rivojlantirish instituti"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Kasbiy ta'limni rivojlantirish instituti",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ktri.uz/logo.png"
      }
    },
    "datePublished": article.published_date,
    "dateModified": article.modified_date || article.published_date
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Course Schema - Kurslar va treninglar uchun
export const CourseSchema = ({ course }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.name,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "Kasbiy ta'limni rivojlantirish instituti",
      "sameAs": "https://ktri.uz"
    },
    "offers": course.price ? {
      "@type": "Offer",
      "price": course.price,
      "priceCurrency": "UZS"
    } : undefined
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default {
  OrganizationSchema,
  WebSiteSchema,
  BreadcrumbSchema,
  JobPostingSchema,
  ArticleSchema,
  CourseSchema
};
