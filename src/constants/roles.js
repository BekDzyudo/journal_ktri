// User Roles
export const ROLES = {
  USER: 'MUALLIF',
  ADMIN: 'TAQRIZCHI',
  SUPERADMIN: 'ADMIN',
  SUPER_ADMIN: 'ADMIN', // Alias for backwards compatibility
}

const ROLE_ALIASES = {
  user: ROLES.USER,
  muallif: ROLES.USER,
  MUALLIF: ROLES.USER,
  FOYDALANUVCHI: ROLES.USER,
  foydalanuvchi: ROLES.USER,
  admin: ROLES.ADMIN,
  taqrizchi: ROLES.ADMIN,
  TAQRIZCHI: ROLES.ADMIN,
  superadmin: ROLES.SUPERADMIN,
  super_admin: ROLES.SUPERADMIN,
  ADMIN: ROLES.SUPERADMIN,
}

export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return ROLES.USER
  return ROLE_ALIASES[role] || ROLE_ALIASES[role.toLowerCase()] || role
}

// Role Display Names
export const ROLE_NAMES = {
  [ROLES.USER]: 'Muallif',
  [ROLES.ADMIN]: 'Taqrizchi',
  [ROLES.SUPERADMIN]: 'Admin',
}

// Article Statuses
export const ARTICLE_STATUS = {
  SUBMITTED: 'submitted',           // Yuborildi (superadminga yuborildi)
  PAYMENT_PENDING: 'payment_pending', // Superadmin qabul qildi, muallif to'lov qilishi kerak
  PAID: 'paid',                     // Muallif test to'lovni amalga oshirdi
  ASSIGNED: 'assigned',             // Tayinlandi (adminga biriktirildi, hali ko'rilmagan)
  UNDER_REVIEW: 'under_review',     // Ko'rib chiqilmoqda (admin ko'rib chiqmoqda)
  IN_EDITING: 'in_editing',         // Taqrizda (taqriz yuklandi)
  REVIEW_ACCEPTED: 'review_accepted', // Taqrizchi ijobiy xulosa berdi
  REVIEW_REJECTED: 'review_rejected', // Taqrizchi salbiy xulosa berdi
  ACCEPTED: 'accepted',             // Qabul qilindi
  REJECTED: 'rejected',             // Rad etildi
  REVISION_REQUIRED: 'revision',    // Qayta ko'rib chiqish
}

// Status Display Names
export const STATUS_NAMES = {
  [ARTICLE_STATUS.SUBMITTED]: 'Yuborildi',
  [ARTICLE_STATUS.PAYMENT_PENDING]: 'To\'lov kutilmoqda',
  [ARTICLE_STATUS.PAID]: 'To\'lov qilindi',
  [ARTICLE_STATUS.ASSIGNED]: 'Ko\'rib chiqish kutilmoqda',
  [ARTICLE_STATUS.UNDER_REVIEW]: 'Ko\'rib chiqilmoqda',
  [ARTICLE_STATUS.IN_EDITING]: 'Taqrizda',
  [ARTICLE_STATUS.REVIEW_ACCEPTED]: 'Taqrizchi qabul qildi',
  [ARTICLE_STATUS.REVIEW_REJECTED]: 'Taqrizchi rad etdi',
  [ARTICLE_STATUS.ACCEPTED]: 'Qabul qilindi',
  [ARTICLE_STATUS.REJECTED]: 'Rad etildi',
  [ARTICLE_STATUS.REVISION_REQUIRED]: 'Qayta ko\'rib chiqish',
}

// Status Colors (for Tailwind CSS classes)
export const STATUS_COLORS = {
  [ARTICLE_STATUS.SUBMITTED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ARTICLE_STATUS.PAYMENT_PENDING]: 'bg-amber-100 text-amber-800 border-amber-200',
  [ARTICLE_STATUS.PAID]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [ARTICLE_STATUS.ASSIGNED]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  [ARTICLE_STATUS.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ARTICLE_STATUS.IN_EDITING]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ARTICLE_STATUS.REVIEW_ACCEPTED]: 'bg-green-100 text-green-800 border-green-200',
  [ARTICLE_STATUS.REVIEW_REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  [ARTICLE_STATUS.ACCEPTED]: 'bg-green-100 text-green-800 border-green-200',
  [ARTICLE_STATUS.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  [ARTICLE_STATUS.REVISION_REQUIRED]: 'bg-orange-100 text-orange-800 border-orange-200',
}

// Role-based Status Display
// Har bir rol o'z nuqtai nazaridan statusni ko'radi

export const USER_STATUS_DISPLAY = {
  [ARTICLE_STATUS.SUBMITTED]: 'Jarayonda',           // User ko'rish nuqtasi
  [ARTICLE_STATUS.PAYMENT_PENDING]: 'To\'lov kutilmoqda',
  [ARTICLE_STATUS.PAID]: 'To\'lov qilindi',
  [ARTICLE_STATUS.ASSIGNED]: 'Jarayonda',            // Admin ko'rib chiqmoqda
  [ARTICLE_STATUS.UNDER_REVIEW]: 'Jarayonda',        // Ko'rib chiqilmoqda
  [ARTICLE_STATUS.IN_EDITING]: 'Jarayonda',          // Taqrizda
  [ARTICLE_STATUS.REVIEW_ACCEPTED]: 'Qabul qilindi',
  [ARTICLE_STATUS.REVIEW_REJECTED]: 'Rad etildi',
  [ARTICLE_STATUS.ACCEPTED]: 'Qabul qilindi',        // Qabul qilindi
  [ARTICLE_STATUS.REJECTED]: 'Rad etildi',           // Rad etildi
  [ARTICLE_STATUS.REVISION_REQUIRED]: 'Qayta ko\'rib chiqish', // Qayta ishlash kerak
}

export const ADMIN_STATUS_DISPLAY = {
  [ARTICLE_STATUS.SUBMITTED]: 'Ko\'rib chiqilmoqda', // Umumiy holat
  [ARTICLE_STATUS.PAYMENT_PENDING]: 'To\'lov kutilmoqda',
  [ARTICLE_STATUS.PAID]: 'To\'lov qilindi',
  [ARTICLE_STATUS.ASSIGNED]: 'Yangi',                // Unga tayinlangan, hali baholamagan
  [ARTICLE_STATUS.UNDER_REVIEW]: 'Ko\'rib chiqilmoqda', // O'zi ko'rib chiqmoqda
  [ARTICLE_STATUS.IN_EDITING]: 'Taqrizda',           // Taqriz yuborilgan
  [ARTICLE_STATUS.REVIEW_ACCEPTED]: 'Ijobiy xulosa',
  [ARTICLE_STATUS.REVIEW_REJECTED]: 'Salbiy xulosa',
  [ARTICLE_STATUS.ACCEPTED]: 'Qabul qilindi',        // Qabul qilindi
  [ARTICLE_STATUS.REJECTED]: 'Rad etildi',           // Rad etildi
  [ARTICLE_STATUS.REVISION_REQUIRED]: 'Qayta ko\'rib chiqish', // Qayta ishlash kerak
}

export const SUPERADMIN_STATUS_DISPLAY = {
  [ARTICLE_STATUS.SUBMITTED]: 'Yangi',               // Hali hech kimga tayinlanmagan
  [ARTICLE_STATUS.PAYMENT_PENDING]: 'To\'lov kutilmoqda',
  [ARTICLE_STATUS.PAID]: 'To\'lov qilindi',
  [ARTICLE_STATUS.ASSIGNED]: 'Taqrizda',             // Taqrizchiga biriktirilgan
  [ARTICLE_STATUS.UNDER_REVIEW]: 'Ko\'rib chiqilmoqda', // Admin ko'rib chiqmoqda
  [ARTICLE_STATUS.IN_EDITING]: 'Taqrizda',           // Taqriz yuborilgan
  [ARTICLE_STATUS.REVIEW_ACCEPTED]: 'Ijobiy xulosa',
  [ARTICLE_STATUS.REVIEW_REJECTED]: 'Salbiy xulosa',
  [ARTICLE_STATUS.ACCEPTED]: 'Qabul qilindi',        // Qabul qilindi
  [ARTICLE_STATUS.REJECTED]: 'Rad etildi',           // Rad etildi
  [ARTICLE_STATUS.REVISION_REQUIRED]: 'Qayta ko\'rib chiqish', // Qayta ishlash kerak
}

// Role-based Status Colors
// Har bir rol uchun statusga mos ranglar
export const USER_STATUS_COLORS = {
  'Jarayonda': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'To\'lov kutilmoqda': 'bg-amber-100 text-amber-800 border-amber-200',
  'To\'lov qilindi': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Qabul qilindi': 'bg-green-100 text-green-800 border-green-200',
  'Rad etildi': 'bg-red-100 text-red-800 border-red-200',
  'Qayta ko\'rib chiqish': 'bg-orange-100 text-orange-800 border-orange-200',
}

export const ADMIN_STATUS_COLORS = {
  'Yangi': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Ko\'rib chiqilmoqda': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'To\'lov kutilmoqda': 'bg-amber-100 text-amber-800 border-amber-200',
  'To\'lov qilindi': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Taqrizda': 'bg-purple-100 text-purple-800 border-purple-200',
  'Ijobiy xulosa': 'bg-green-100 text-green-800 border-green-200',
  'Salbiy xulosa': 'bg-red-100 text-red-800 border-red-200',
  'Qabul qilindi': 'bg-green-100 text-green-800 border-green-200',
  'Rad etildi': 'bg-red-100 text-red-800 border-red-200',
  'Qayta ko\'rib chiqish': 'bg-orange-100 text-orange-800 border-orange-200',
}

export const SUPERADMIN_STATUS_COLORS = {
  'Yangi': 'bg-blue-100 text-blue-800 border-blue-200',
  'To\'lov kutilmoqda': 'bg-amber-100 text-amber-800 border-amber-200',
  'To\'lov qilindi': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Tayinlandi': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Ko\'rib chiqilmoqda': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Taqrizda': 'bg-purple-100 text-purple-800 border-purple-200',
  'Ijobiy xulosa': 'bg-green-100 text-green-800 border-green-200',
  'Salbiy xulosa': 'bg-red-100 text-red-800 border-red-200',
  'Qabul qilindi': 'bg-green-100 text-green-800 border-green-200',
  'Rad etildi': 'bg-red-100 text-red-800 border-red-200',
  'Qayta ko\'rib chiqish': 'bg-orange-100 text-orange-800 border-orange-200',
}

// Role Permissions
export const PERMISSIONS = {
  [ROLES.USER]: {
    canSubmitArticle: true,
    canViewOwnArticles: true,
    canEditOwnArticles: false,
    canViewAllArticles: false,
    canAssignReviewer: false,
    canChangeStatus: false,
  },
  [ROLES.ADMIN]: {
    canSubmitArticle: false,
    canViewOwnArticles: true,
    canEditOwnArticles: false,
    canViewAllArticles: false, // Only assigned articles
    canAssignReviewer: false,
    canChangeStatus: false,
    canReviewArticles: true,
    canUploadReview: true,
  },
  [ROLES.SUPERADMIN]: {
    canSubmitArticle: false,
    canViewOwnArticles: false,
    canEditOwnArticles: false,
    canViewAllArticles: true,
    canAssignReviewer: true,
    canChangeStatus: true,
    canManageUsers: true,
    canManageAdmins: true,
  },
}

// Check if user has permission
export const hasPermission = (userRole, permission) => {
  return PERMISSIONS[normalizeRole(userRole)]?.[permission] || false
}
