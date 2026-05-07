import { ARTICLE_STATUS, ROLES, normalizeRole } from "../constants/roles.js";
import { sendSms, SMS_EVENTS } from "./fakeSmsService.js";
import { fakeNotificationApi, NOTIFICATION_TYPES } from "./fakeNotificationApi.js";

const ARTICLES_KEY = "ktri_fake_articles_v1";
const USERS_KEY    = "ktri_fake_users_v1";

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
    phone_number: "+998901111111",
    role: ROLES.ADMIN,
  },
  {
    id: "reviewer-2",
    first_name: "Taqrizchi",
    last_name: "Ikki",
    email: "reviewer2@ktri.uz",
    phone_number: "+998902222222",
    role: ROLES.ADMIN,
  },
  {
    id: "author-demo",
    first_name: "Test",
    last_name: "Muallif",
    email: "author@ktri.uz",
    phone_number: "+998903333333",
    role: ROLES.USER,
  },
];

const ensureCurrentUser = (users, userData) => {
  if (!userData?.email || users.some((u) => u.email === userData.email)) return users;
  return [
    ...users,
    {
      id: userData.id || userData.email,
      first_name: userData.first_name || userData.ism || "Foydalanuvchi",
      last_name:  userData.last_name  || userData.familiya || "",
      email:      userData.email,
      phone_number: userData.phone_number || userData.telefon || "",
      role:       normalizeRole(userData.role),
    },
  ];
};

const getUserDisplayName = (user) =>
  user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : "";

/** Superadmin/user ko'rishida to'liq ma'lumot */
const withDisplayNames = (articles) => {
  const users = readJson(USERS_KEY, defaultUsers);
  return articles.map((article) => {
    if (!article.assignedTo || article.assignedToName) return article;
    const reviewer = users.find((u) => u.email === article.assignedTo);
    return { ...article, assignedToName: getUserDisplayName(reviewer) || article.assignedTo };
  });
};

/**
 * Taqrizchi uchun: muallif ma'lumotlarini yashirish (blind review).
 * Maqola nomi, annotatsiya, kalit so'zlar, fayl — saqlanadi.
 * Muallif ismi, email, telefon, ish joyi — yashiriladi.
 */
const anonymizeForReviewer = (article) => ({
  ...article,
  authorNames:      "Anonim muallif",
  fullName:         "Anonim muallif",
  email:            null,
  phone:            null,
  workplace:        null,
  position:         null,
  authorEmail:      null,
  authors: (article.authors || []).map((a) => ({
    ...a,
    fullName:   "Anonim muallif",
    email:      null,
    phone:      null,
    workplace:  a.workplace ? "****" : null,
    position:   a.position  ? "****" : null,
  })),
});

/** Superadmin emaillarini olish */
const getSuperAdminEmails = () => {
  const users = readJson(USERS_KEY, defaultUsers);
  return users
    .filter((u) => normalizeRole(u.role) === ROLES.SUPERADMIN)
    .map((u) => u.email);
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
        (a) =>
          a.authorEmail === email ||
          a.email === email ||
          a.authors?.some((au) => au.email === email)
      )
    );
  },

  /** Taqrizchiga tayinlangan maqolalar — muallif ma'lumotlari yashirilgan */
  async getAssignedArticles(userData) {
    const email    = userData?.email;
    const articles = withDisplayNames(readJson(ARTICLES_KEY, []));
    return delay(
      articles
        .filter((a) => a.assignedTo === email)
        .map(anonymizeForReviewer)
    );
  },

  async submitArticle({ formData, authors, file, userData }) {
    const normalizedAuthors = authors.map((a) => ({
      fullName:  a.fullName.trim(),
      phone:     a.phone.trim(),
      email:     a.email.trim(),
      workplace: a.workplace.trim(),
      position:  a.position.trim(),
    }));
    const firstAuthor = normalizedAuthors[0];
    const now = new Date().toISOString();
    const articles = readJson(ARTICLES_KEY, []);

    const article = {
      id: `article-${Date.now()}`,
      ...formData,
      acceptTerms:      Boolean(formData.acceptTerms),
      authors:          normalizedAuthors,
      authorNames:      normalizedAuthors.map((a) => a.fullName).filter(Boolean).join(", "),
      fullName:         firstAuthor.fullName,
      phone:            firstAuthor.phone,
      email:            firstAuthor.email,
      workplace:        firstAuthor.workplace,
      position:         firstAuthor.position,
      authorEmail:      userData?.email || firstAuthor.email,
      userId:           userData?.id    || userData?.email || firstAuthor.email,
      fileName:         file?.name || "maqola.pdf",
      articleFileUrl:   "#fake-article-file",
      status:           ARTICLE_STATUS.SUBMITTED,
      createdAt:        now,
      submittedAt:      now,
      submittedDate:    now,
      history: [
        { at: now, by: "Muallif", text: "Maqola superadmin ko'rib chiqishi uchun yuborildi." },
      ],
    };

    writeJson(ARTICLES_KEY, [article, ...articles]);

    // Superadmin(lar)ga bildirishnoma
    fakeNotificationApi.push({
      type:         NOTIFICATION_TYPES.ARTICLE_SUBMITTED,
      title:        "Yangi maqola keldi",
      message:      `"${article.articleTitle}" — dastlabki ko'rik kutilmoqda.`,
      targetRole:   "superadmin",
      articleId:    article.id,
      articleTitle: article.articleTitle,
    });

    return delay(article);
  },

  /** Superadmin dastlabki qarori: accept → CLICK to'lovi, reject → Rad etildi */
  async setInitialDecision(articleId, decision, description = "") {
    const now = new Date().toISOString();
    const articles = readJson(ARTICLES_KEY, []);
    const article  = articles.find((a) => a.id === articleId);
    const users    = readJson(USERS_KEY, defaultUsers);

    const result = await this.updateArticle(articleId, (a) => ({
      ...a,
      status: decision === "accept" ? ARTICLE_STATUS.PAYMENT_PENDING : ARTICLE_STATUS.REJECTED,
      superAdminDecisionAt: now,
      finalDecisionDescription:
        decision === "accept"
          ? description || "Maqola dastlabki ko'rikdan o'tdi. Nashr jarayonini davom ettirish uchun CLICK orqali to'lov qiling."
          : description || "Maqola dastlabki ko'rikdan o'tmadi.",
      clickUrl: decision === "accept" ? `#click-test-${articleId}` : a.clickUrl,
      history: [
        ...(a.history || []),
        { at: now, by: "Superadmin", text: decision === "accept" ? "Dastlabki qabul qilindi" : "Rad etildi" },
      ],
    }));

    // Muallif uchun SMS + bildirishnoma
    const authorEmail = article?.authorEmail || article?.email;
    const authorUser  = users.find((u) => u.email === authorEmail);

    if (decision === "accept") {
      if (authorUser?.phone_number) {
        sendSms({
          to:     authorUser.phone_number,
          toName: getUserDisplayName(authorUser),
          event:  SMS_EVENTS.ARTICLE_PAYMENT_PENDING,
          data:   { articleTitle: article?.articleTitle },
        });
      }
      fakeNotificationApi.push({
        type:         NOTIFICATION_TYPES.PAYMENT_PENDING,
        title:        "To'lov bosqichi ochildi",
        message:      `"${article?.articleTitle}" maqolangiz qabul qilindi. CLICK orqali to'lov qiling.`,
        targetRole:   "user",
        targetEmail:  authorEmail,
        articleId,
        articleTitle: article?.articleTitle,
      });
    } else {
      if (authorUser?.phone_number) {
        sendSms({
          to:     authorUser.phone_number,
          toName: getUserDisplayName(authorUser),
          event:  SMS_EVENTS.ARTICLE_REJECTED,
          data:   { articleTitle: article?.articleTitle, reason: description },
        });
      }
      fakeNotificationApi.push({
        type:         NOTIFICATION_TYPES.ARTICLE_REJECTED,
        title:        "Maqolangiz rad etildi",
        message:      `"${article?.articleTitle}" — ${description || "Dastlabki ko'rikdan o'tmadi."}`,
        targetRole:   "user",
        targetEmail:  authorEmail,
        articleId,
        articleTitle: article?.articleTitle,
      });
    }

    return result;
  },

  /** Muallif CLICK orqali to'lov qiladi */
  async payArticle(articleId) {
    const now = new Date().toISOString();
    const ref = `CLICK-${articleId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const result = await this.updateArticle(articleId, (a) => ({
      ...a,
      status:           ARTICLE_STATUS.PAID,
      paymentStatus:    "paid",
      paidAt:           now,
      paymentReference: ref,
      paymentMethod:    "click",
      finalDecisionDescription:
        "CLICK to'lovi muvaffaqiyatli qabul qilindi. Maqolangiz taqrizchiga yo'naltiriladi.",
      history: [
        ...(a.history || []),
        { at: now, by: "CLICK (test)", text: `To'lov amalga oshirildi. Ref: ${ref}` },
      ],
    }));

    // Superadminga bildirishnoma
    const articles = readJson(ARTICLES_KEY, []);
    const article  = articles.find((a) => a.id === articleId);
    fakeNotificationApi.push({
      type:         NOTIFICATION_TYPES.ARTICLE_PAID,
      title:        "To'lov qabul qilindi",
      message:      `"${article?.articleTitle}" maqolasi uchun CLICK to'lovi keldi. Ref: ${ref}`,
      targetRole:   "superadmin",
      articleId,
      articleTitle: article?.articleTitle,
    });

    return result;
  },

  /** Superadmin taqrizchiga tayinlaydi */
  async assignReviewer(articleId, adminEmail) {
    const now   = new Date().toISOString();
    const users = readJson(USERS_KEY, defaultUsers);
    const reviewer     = users.find((u) => u.email === adminEmail);
    const reviewerName = getUserDisplayName(reviewer) || adminEmail;
    const articles     = readJson(ARTICLES_KEY, []);
    const article      = articles.find((a) => a.id === articleId);

    const result = await this.updateArticle(articleId, (a) => ({
      ...a,
      status:         ARTICLE_STATUS.ASSIGNED,
      assignedTo:     adminEmail,
      assignedToName: reviewerName,
      assignedAt:     now,
      history: [
        ...(a.history || []),
        { at: now, by: "Superadmin", text: `${reviewerName} taqrizchi sifatida tayinlandi.` },
      ],
    }));

    // Taqrizchiga SMS + bildirishnoma (maqola sarlavhasi ko'rsatiladi, muallif emas)
    if (reviewer?.phone_number) {
      sendSms({
        to:     reviewer.phone_number,
        toName: reviewerName,
        event:  SMS_EVENTS.REVIEWER_ASSIGNED,
        data:   { articleTitle: article?.articleTitle },
      });
    }
    fakeNotificationApi.push({
      type:         NOTIFICATION_TYPES.REVIEWER_ASSIGNED,
      title:        "Yangi maqola tayinlandi",
      message:      `"${article?.articleTitle}" maqolasini taqriz qiling.`,
      targetRole:   "admin",
      targetEmail:  adminEmail,
      articleId,
      articleTitle: article?.articleTitle,
    });

    return result;
  },

  /**
   * Taqrizchi xulosa va fayl yuboradi → status IN_EDITING.
   * Superadmin keyinchalik setFinalDecision() bilan yakuniy qaror chiqaradi.
   */
  async submitReview({ articleId, reviewer, reviewFile, reviewComment, reviewConclusion, decision }) {
    const now      = new Date().toISOString();
    const articles = readJson(ARTICLES_KEY, []);
    const article  = articles.find((a) => a.id === articleId);

    const result = await this.updateArticle(articleId, (a) => ({
      ...a,
      status:           ARTICLE_STATUS.IN_EDITING,
      reviewDecision:   decision === "accept" ? ARTICLE_STATUS.REVIEW_ACCEPTED : ARTICLE_STATUS.REVIEW_REJECTED,
      reviewFile:       reviewFile?.name || "taqriz.pdf",
      reviewFileUrl:    "#fake-review-file",
      reviewComment:    reviewComment || "",
      reviewConclusion: reviewConclusion || reviewComment || "",
      reviewedAt:       now,
      reviewedBy:       reviewer?.email,
      reviewedByName:   getUserDisplayName(reviewer) || reviewer?.email,
      history: [
        ...(a.history || []),
        {
          at:   now,
          by:   reviewer?.email || "Taqrizchi",
          text: decision === "accept"
            ? "Taqrizchi ijobiy xulosa berdi. Superadmin yakuniy qaror kutilmoqda."
            : "Taqrizchi salbiy xulosa berdi. Superadmin yakuniy qaror kutilmoqda.",
        },
      ],
    }));

    // Superadminga bildirishnoma + SMS
    const users = readJson(USERS_KEY, defaultUsers);
    const superAdmins = users.filter((u) => normalizeRole(u.role) === ROLES.SUPERADMIN);

    fakeNotificationApi.push({
      type:         NOTIFICATION_TYPES.REVIEW_SUBMITTED,
      title:        "Taqrizchi xulosasi keldi",
      message:      `"${article?.articleTitle}" — ${decision === "accept" ? "ijobiy" : "salbiy"} xulosa. Yakuniy qaror chiqaring.`,
      targetRole:   "superadmin",
      articleId,
      articleTitle: article?.articleTitle,
    });

    superAdmins.forEach((sa) => {
      if (sa.phone_number) {
        sendSms({
          to:     sa.phone_number,
          toName: getUserDisplayName(sa),
          event:  SMS_EVENTS.REVIEW_SUBMITTED,
          data:   { articleTitle: article?.articleTitle },
        });
      }
    });

    return result;
  },

  /**
   * Superadmin yakuniy qaror: taqrizchi xulosasi kelgandan keyin.
   * Muallif maqolaning yakuniy natijasini ko'radi.
   */
  async setFinalDecision(articleId, decision, description = "") {
    const now      = new Date().toISOString();
    const articles = readJson(ARTICLES_KEY, []);
    const article  = articles.find((a) => a.id === articleId);
    const users    = readJson(USERS_KEY, defaultUsers);

    const finalStatus = decision === "accept" ? ARTICLE_STATUS.ACCEPTED : ARTICLE_STATUS.REJECTED;

    const result = await this.updateArticle(articleId, (a) => ({
      ...a,
      status:                   finalStatus,
      finalDecisionAt:          now,
      finalDecisionDescription:
        decision === "accept"
          ? description || "Maqolangiz taqrizchi xulosasidan so'ng qabul qilindi. KTRI ilmiy jurnalida nashr etiladi."
          : description || "Maqolangiz taqrizchi xulosasi asosida rad etildi.",
      publicationInfo: decision === "accept" ? {
        journal:      "KTRI ilmiy jurnali",
        issue:        "2026-yil iyun soni",
        expectedDate: "2026-06-30",
      } : null,
      history: [
        ...(a.history || []),
        { at: now, by: "Superadmin", text: decision === "accept" ? "Yakuniy qabul qilindi." : "Yakuniy rad etildi." },
      ],
    }));

    // Muallif uchun SMS + bildirishnoma
    const authorEmail = article?.authorEmail || article?.email;
    const authorUser  = users.find((u) => u.email === authorEmail);

    const smsEvent = decision === "accept" ? SMS_EVENTS.ARTICLE_ACCEPTED : SMS_EVENTS.ARTICLE_REJECTED;
    const notifType = decision === "accept" ? NOTIFICATION_TYPES.ARTICLE_ACCEPTED : NOTIFICATION_TYPES.ARTICLE_REJECTED;

    if (authorUser?.phone_number) {
      sendSms({
        to:     authorUser.phone_number,
        toName: getUserDisplayName(authorUser),
        event:  smsEvent,
        data:   { articleTitle: article?.articleTitle, reason: description },
      });
    }
    fakeNotificationApi.push({
      type:         notifType,
      title:        decision === "accept" ? "🎉 Maqolangiz qabul qilindi!" : "Maqolangiz rad etildi",
      message:      description || (decision === "accept"
        ? `"${article?.articleTitle}" nashrga tavsiya etildi.`
        : `"${article?.articleTitle}" rad etildi.`),
      targetRole:   "user",
      targetEmail:  authorEmail,
      articleId,
      articleTitle: article?.articleTitle,
    });

    return result;
  },

  async toggleAdminRole(targetUser) {
    const users = readJson(USERS_KEY, defaultUsers);
    const nextUsers = users.map((u) =>
      u.id === targetUser.id || u.email === targetUser.email
        ? { ...u, role: normalizeRole(u.role) === ROLES.ADMIN ? ROLES.USER : ROLES.ADMIN }
        : u
    );
    writeJson(USERS_KEY, nextUsers);

    const isNowAdmin = normalizeRole(targetUser.role) !== ROLES.ADMIN;
    fakeNotificationApi.push({
      type:        NOTIFICATION_TYPES.ROLE_CHANGED,
      title:       isNowAdmin ? "Taqrizchi huquqi berildi" : "Taqrizchi huquqi olindi",
      message:     `${getUserDisplayName(targetUser)} ning roli o'zgartirildi.`,
      targetRole:  "superadmin",
    });

    return delay(nextUsers);
  },

  async updateArticle(articleId, updater) {
    const articles = readJson(ARTICLES_KEY, []);
    let updatedArticle = null;
    const next = articles.map((a) => {
      if (a.id !== articleId) return a;
      updatedArticle = updater(a);
      return updatedArticle;
    });
    writeJson(ARTICLES_KEY, next);
    return delay(updatedArticle);
  },
};
