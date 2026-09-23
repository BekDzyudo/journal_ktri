import React from "react";
import { SITE_NAME, SITE_URL } from "./SEO";

/**
 * Google Scholar (Highwire Press) citation_* teglari va schema.org ScholarlyArticle.
 * https://scholar.google.com/intl/en/scholar/inclusion.html#indexing
 *
 * SEO komponentining children'i sifatida ishlatiladi (Helmet ichida bo'lishi shart):
 *   <SEO ...>{articleCitationTags({ ... })}</SEO>
 */

// Jurnalning rasmiy nomi va ISSN (Scholar shu nom bo'yicha guruhlaydi)
const JOURNAL_TITLE = import.meta.env.VITE_JOURNAL_TITLE || SITE_NAME;
const JOURNAL_ISSN = import.meta.env.VITE_JOURNAL_ISSN || "";
const PUBLISHER = "Kasbiy ta'limni rivojlantirish instituti";

/** "2026-05-12T..." -> "2026/05/12" (Scholar formati) */
function toCitationDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}/${mm}/${dd}`;
}

/** Scholar "Familiya, Ism" formatini afzal ko'radi */
function citationAuthorName(a) {
  if (a?.familiya && a?.ism) return `${a.familiya}, ${a.ism}`;
  return a?.ism_familya || "";
}

/** "12-18" / "12–18" -> ["12", "18"] */
function splitPages(pages) {
  const m = String(pages || "").match(/(\d+)\s*[-–—]\s*(\d+)/);
  return m ? [m[1], m[2]] : [];
}

export function articleCitationTags({ title, authors, abstract, keywords, date, issue, pages, pdfUrl, url }) {
  const citationDate = toCitationDate(date);
  const [firstPage, lastPage] = splitPages(pages);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: title.slice(0, 110),
    name: title,
    url,
    mainEntityOfPage: url,
    author: authors.map((a) => ({
      "@type": "Person",
      name: a.ism_familya,
      ...(a.tashkilot || a.ish_joyi ? { affiliation: a.tashkilot || a.ish_joyi } : {}),
    })),
    ...(abstract ? { abstract, description: abstract.slice(0, 300) } : {}),
    ...(keywords.length ? { keywords: keywords.join(", ") } : {}),
    ...(date ? { datePublished: date } : {}),
    inLanguage: "uz",
    publisher: {
      "@type": "Organization",
      name: PUBLISHER,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/new_logo_blue_2026.png` },
    },
    isPartOf: {
      "@type": "PublicationIssue",
      ...(issue?.issue ? { issueNumber: String(issue.issue) } : {}),
      ...(issue?.year ? { datePublished: String(issue.year) } : {}),
      isPartOf: {
        "@type": "Periodical",
        name: JOURNAL_TITLE,
        ...(JOURNAL_ISSN ? { issn: JOURNAL_ISSN } : {}),
        publisher: { "@type": "Organization", name: PUBLISHER },
      },
    },
    ...(firstPage ? { pageStart: firstPage, pageEnd: lastPage } : {}),
    ...(pdfUrl ? { encoding: { "@type": "MediaObject", contentUrl: pdfUrl, encodingFormat: "application/pdf" } } : {}),
  };

  return [
    <meta key="c-title" name="citation_title" content={title} />,
    ...authors.map((a, i) => (
      <meta key={`c-author-${i}`} name="citation_author" content={citationAuthorName(a)} />
    )),
    citationDate && <meta key="c-date" name="citation_publication_date" content={citationDate} />,
    <meta key="c-journal" name="citation_journal_title" content={JOURNAL_TITLE} />,
    <meta key="c-publisher" name="citation_publisher" content={PUBLISHER} />,
    JOURNAL_ISSN && <meta key="c-issn" name="citation_issn" content={JOURNAL_ISSN} />,
    issue?.volume && <meta key="c-volume" name="citation_volume" content={String(issue.volume)} />,
    issue?.issue && <meta key="c-issue" name="citation_issue" content={String(issue.issue)} />,
    firstPage && <meta key="c-fp" name="citation_firstpage" content={firstPage} />,
    lastPage && <meta key="c-lp" name="citation_lastpage" content={lastPage} />,
    abstract && <meta key="c-abstract" name="citation_abstract" content={abstract} />,
    keywords.length > 0 && <meta key="c-kw" name="citation_keywords" content={keywords.join("; ")} />,
    <meta key="c-lang" name="citation_language" content="uz" />,
    <meta key="c-html" name="citation_abstract_html_url" content={url} />,
    pdfUrl && <meta key="c-pdf" name="citation_pdf_url" content={pdfUrl} />,
    <script key="c-jsonld" type="application/ld+json">{JSON.stringify(jsonLd)}</script>,
  ].filter(Boolean);
}
