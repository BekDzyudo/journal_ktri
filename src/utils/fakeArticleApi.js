import { ARTICLE_STATUS, ROLES, normalizeRole } from "../constants/roles.js";

const ARTICLES_KEY = "ktri_fake_articles_v1";
const USERS_KEY = "ktri_fake_users_v1";

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 250));

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

const defaultUsers = [
  {
    id: "reviewer-1",
    first_name: "Taqrizchi",
    last_name: "Bir",
    email: "reviewer1@ktri.uz",
    phone_number: "+998 90 111 11 11",
    role: ROLES.ADMIN,
  },
  {
    id: "reviewer-2",
    first_name: "Taqrizchi",
    last_name: "Ikki",
    email: "reviewer2@ktri.uz",
    phone_number: "+998 90 222 22 22",
    role: ROLES.ADMIN,
  },
  {
    id: "author-demo",
    first_name: "Test",
    last_name: "Muallif",
    email: "author@ktri.uz",
    phone_number: "+998 90 333 33 33",
    role: ROLES.USER,
  },
];

const ensureCurrentUser = (users, userData) => {
  if (!userData?.email || users.some((user) => user.email === userData.email)) return users;
  return [
    ...users,
    {
      id: userData.id || userData.email,
      first_name: userData.first_name || userData.ism || "Foydalanuvchi",
      last_name: userData.last_name || userData.familiya || "",
      email: userData.email,
      phone_number: userData.phone_number || userData.telefon || "",
      role: normalizeRole(userData.role),
    },
  ];
};

const getUserDisplayName = (user) =>
  user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : "";

const withDisplayNames = (articles) => {
  const users = readJson(USERS_KEY, defaultUsers);
  return articles.map((article) => {
    if (!article.assignedTo || article.assignedToName) return article;
    const reviewer = users.find((user) => user.email === article.assignedTo);
    return {
      ...article,
      assignedToName: getUserDisplayName(reviewer) || article.assignedTo,
    };
  });
};

export const fakeArticleApi = {
  async getUsers(userData) {
    const users = ensureCurrentUser(readJson(USERS_KEY, defaultUsers), userData);
    writeJson(USERS_KEY, users);
    return delay(users);
  },

  async getArticles() {
    return delay(withDisplayNames(readJson(ARTICLES_KEY, [])));
  },

  async getMyArticles(userData) {
    const email = userData?.email;
    const articles = withDisplayNames(readJson(ARTICLES_KEY, []));
    return delay(
      articles.filter(
        (article) =>
          article.authorEmail === email ||
          article.email === email ||
          article.authors?.some((author) => author.email === email)
      )
    );
  },

  async getAssignedArticles(userData) {
    const email = userData?.email;
    const articles = withDisplayNames(readJson(ARTICLES_KEY, []));
    return delay(articles.filter((article) => article.assignedTo === email));
  },

  async submitArticle({ formData, authors, file, userData }) {
    const normalizedAuthors = authors.map((author) => ({
      fullName: author.fullName.trim(),
      phone: author.phone.trim(),
      email: author.email.trim(),
      workplace: author.workplace.trim(),
      position: author.position.trim(),
    }));
    const firstAuthor = normalizedAuthors[0];
    const now = new Date().toISOString();
    const articles = readJson(ARTICLES_KEY, []);
    const article = {
      id: `article-${Date.now()}`,
      ...formData,
      acceptTerms: Boolean(formData.acceptTerms),
      authors: normalizedAuthors,
      authorNames: normalizedAuthors.map((author) => author.fullName).filter(Boolean).join(", "),
      fullName: firstAuthor.fullName,
      phone: firstAuthor.phone,
      email: firstAuthor.email,
      workplace: firstAuthor.workplace,
      position: firstAuthor.position,
      authorEmail: userData?.email || firstAuthor.email,
      userId: userData?.id || userData?.email || firstAuthor.email,
      fileName: file?.name || "maqola.pdf",
      articleFileUrl: "#fake-article-file",
      status: ARTICLE_STATUS.SUBMITTED,
      createdAt: now,
      submittedAt: now,
      submittedDate: now,
      history: [
        {
          at: now,
          by: "Muallif",
          text: "Maqola superadmin ko'rib chiqishi uchun yuborildi.",
        },
      ],
    };

    writeJson(ARTICLES_KEY, [article, ...articles]);
    return delay(article);
  },

  async setInitialDecision(articleId, decision, description = "") {
    const now = new Date().toISOString();
    const label = decision === "accept" ? "Dastlabki qabul qilindi" : "Rad etildi";
    return this.updateArticle(articleId, (article) => ({
      ...article,
      status: decision === "accept" ? ARTICLE_STATUS.PAYMENT_PENDING : ARTICLE_STATUS.REJECTED,
      superAdminDecisionAt: now,
      finalDecisionDescription:
        decision === "accept"
          ? description || "Maqola dastlabki ko'rikdan o'tdi. Nashr jarayonini davom ettirish uchun PAYME orqali to'lov qiling."
          : description || "Maqola dastlabki ko'rikdan o'tmadi.",
      paymentUrl: decision === "accept" ? `#payme-test-${articleId}` : article.paymentUrl,
      history: [
        ...(article.history || []),
        { at: now, by: "Superadmin", text: label },
      ],
    }));
  },

  async payArticle(articleId) {
    const now = new Date().toISOString();
    return this.updateArticle(articleId, (article) => ({
      ...article,
      status: ARTICLE_STATUS.PAID,
      paymentStatus: "paid",
      paidAt: now,
      paymentReference: `PAYME-TEST-${articleId.slice(-6).toUpperCase()}`,
      finalDecisionDescription:
        "To'lov muvaffaqiyatli qabul qilindi. Maqolangiz KTRI ilmiy jurnalining 2026-yil iyun sonida chop etilishi rejalashtirilgan.",
      publicationInfo: {
        journal: "KTRI ilmiy jurnali",
        issue: "2026-yil iyun soni",
        expectedDate: "2026-06-30",
      },
      history: [
        ...(article.history || []),
        { at: now, by: "PAYME test", text: "Muallif test to'lovni amalga oshirdi." },
      ],
    }));
  },

  async assignReviewer(articleId, adminEmail) {
    const now = new Date().toISOString();
    const users = readJson(USERS_KEY, defaultUsers);
    const reviewer = users.find((user) => user.email === adminEmail);
    const reviewerName = getUserDisplayName(reviewer) || adminEmail;
    return this.updateArticle(articleId, (article) => ({
      ...article,
      status: ARTICLE_STATUS.ASSIGNED,
      assignedTo: adminEmail,
      assignedToName: reviewerName,
      assignedAt: now,
      history: [
        ...(article.history || []),
        { at: now, by: "Superadmin", text: `${reviewerName} taqrizchi sifatida tayinlandi.` },
      ],
    }));
  },

  async submitReview({ articleId, reviewer, reviewFile, reviewComment, decision }) {
    const now = new Date().toISOString();
    const accepted = decision === "accept";
    return this.updateArticle(articleId, (article) => ({
      ...article,
      status: accepted ? ARTICLE_STATUS.ACCEPTED : ARTICLE_STATUS.REJECTED,
      reviewDecision: accepted ? ARTICLE_STATUS.REVIEW_ACCEPTED : ARTICLE_STATUS.REVIEW_REJECTED,
      reviewFile: reviewFile?.name || "taqriz.pdf",
      reviewFileUrl: "#fake-review-file",
      reviewComment,
      reviewedAt: now,
      reviewedBy: reviewer?.email,
      reviewedByName: getUserDisplayName(reviewer) || reviewer?.email,
      finalDecisionDescription: accepted
        ? "To'lov muvaffaqiyatli qabul qilindi va taqrizchi ijobiy xulosa berdi. Maqolangiz KTRI ilmiy jurnalining 2026-yil iyun sonida chop etilishi rejalashtirilgan."
        : reviewComment || "Taqrizchi maqolani nashrga tavsiya etmadi.",
      publicationInfo: accepted
        ? {
            journal: "KTRI ilmiy jurnali",
            issue: "2026-yil iyun soni",
            expectedDate: "2026-06-30",
          }
        : null,
      history: [
        ...(article.history || []),
        {
          at: now,
          by: reviewer?.email || "Taqrizchi",
          text: accepted ? "Ijobiy xulosa yuborildi." : "Salbiy xulosa yuborildi.",
        },
      ],
    }));
  },

  async toggleAdminRole(targetUser) {
    const users = readJson(USERS_KEY, defaultUsers);
    const nextUsers = users.map((user) =>
      user.id === targetUser.id || user.email === targetUser.email
        ? { ...user, role: normalizeRole(user.role) === ROLES.ADMIN ? ROLES.USER : ROLES.ADMIN }
        : user
    );
    writeJson(USERS_KEY, nextUsers);
    return delay(nextUsers);
  },

  async updateArticle(articleId, updater) {
    const articles = readJson(ARTICLES_KEY, []);
    let updatedArticle = null;
    const nextArticles = articles.map((article) => {
      if (article.id !== articleId) return article;
      updatedArticle = updater(article);
      return updatedArticle;
    });
    writeJson(ARTICLES_KEY, nextArticles);
    return delay(updatedArticle);
  },
};
