import React from "react";
import { FiX } from "react-icons/fi";
import {
  FaFileAlt, FaUser, FaCalendar, FaTag, FaBuilding,
  FaBriefcase, FaFileUpload, FaPhone, FaEnvelope, FaDownload, FaExternalLinkAlt, FaCreditCard,
} from "react-icons/fa";
import { ARTICLE_STATUS } from "../constants/roles.js";
import { getArticleDate, formatArticleDateTime, formatDate } from "../utils/articleDashboardHelpers.js";

const USER_STATUS_STEPS = [
  { key: "submitted", label: "Yuborildi", statuses: [ARTICLE_STATUS.SUBMITTED] },
  { key: "screening", label: "Dastlabki ko'rik", statuses: [ARTICLE_STATUS.PAYMENT_PENDING] },
  { key: "payment", label: "To'lov", statuses: [ARTICLE_STATUS.PAID] },
  { key: "reviewing", label: "Taqriz", statuses: [ARTICLE_STATUS.ASSIGNED, ARTICLE_STATUS.UNDER_REVIEW, ARTICLE_STATUS.IN_EDITING, ARTICLE_STATUS.REVIEW_ACCEPTED, ARTICLE_STATUS.REVIEW_REJECTED] },
  { key: "finalized", label: "Yakunlandi", statuses: [ARTICLE_STATUS.ACCEPTED, ARTICLE_STATUS.REJECTED, ARTICLE_STATUS.REVISION_REQUIRED, ARTICLE_STATUS.PUBLISHED] },
];

const SUPERADMIN_STATUS_STEPS = [
  { key: "submitted", label: "Kelib tushdi", statuses: [ARTICLE_STATUS.SUBMITTED] },
  { key: "screening", label: "Dastlabki xulosa", statuses: [ARTICLE_STATUS.PAYMENT_PENDING] },
  { key: "payment", label: "To'lov", statuses: [ARTICLE_STATUS.PAID] },
  { key: "reviewing", label: "Taqrizchi", statuses: [ARTICLE_STATUS.ASSIGNED, ARTICLE_STATUS.UNDER_REVIEW, ARTICLE_STATUS.IN_EDITING] },
  { key: "finalized", label: "Yakuniy", statuses: [ARTICLE_STATUS.REVIEW_ACCEPTED, ARTICLE_STATUS.REVIEW_REJECTED, ARTICLE_STATUS.ACCEPTED, ARTICLE_STATUS.REJECTED, ARTICLE_STATUS.REVISION_REQUIRED, ARTICLE_STATUS.PUBLISHED] },
];

function ArticleDetailModal({ isOpen, onClose, article, role }) {
  if (!isOpen || !article) return null;
  const toHttps = (url) => url ? String(url).replace(/^http:\/\//i, "https://") : url;
  const articleFileUrl = toHttps(article.articleFileUrl || article.fileUrl || article.file || article.articleFile);
  const statusSteps = role === "superadmin" ? SUPERADMIN_STATUS_STEPS : USER_STATUS_STEPS;
  const showTimeline = role !== "admin";

  // Find which step the article is currently on
  const getCurrentStep = () => {
    for (let i = statusSteps.length - 1; i >= 0; i--) {
      if (statusSteps[i].statuses.includes(article.status)) return i;
    }
    return 0;
  };
  const currentStep = getCurrentStep();
  const isRejected =
    article.status === ARTICLE_STATUS.REJECTED ||
    article.status === ARTICLE_STATUS.REVIEW_REJECTED ||
    article.reviewDecision === ARTICLE_STATUS.REVIEW_REJECTED;
  const rejectedFromStep = (() => {
    if (!isRejected) return null;
    if (article.reviewedAt || article.reviewDecision === ARTICLE_STATUS.REVIEW_REJECTED) return role === "superadmin" ? 3 : 4;
    if (article.paidAt || article.assignedTo) return role === "superadmin" ? 3 : 4;
    if (article.superAdminDecisionAt) return 1;
    return currentStep;
  })();

  const getFinalLabel = () => {
    if (article.status === ARTICLE_STATUS.PAID) return "To'lov qilindi";
    if (article.status === ARTICLE_STATUS.ACCEPTED) return "Qabul qilindi";
    if (article.status === ARTICLE_STATUS.PUBLISHED) return "Nashr etilgan";
    if (article.status === ARTICLE_STATUS.REJECTED) return "Rad etildi";
    if (article.status === ARTICLE_STATUS.REVISION_REQUIRED) return "Qayta ko'rib chiqish";
    return "Yakunlandi";
  };

  const getFinalColor = () => {
    if (article.status === ARTICLE_STATUS.ACCEPTED) return "bg-green-500 border-green-500 text-white";
    if (article.status === ARTICLE_STATUS.PUBLISHED) return "bg-teal-500 border-teal-500 text-white";
    if (article.status === ARTICLE_STATUS.REJECTED) return "bg-red-500 border-red-500 text-white";
    if (article.status === ARTICLE_STATUS.REVISION_REQUIRED) return "bg-orange-500 border-orange-500 text-white";
    return "bg-gray-400 border-gray-400 text-white";
  };

  const isFinalStep = (index) => index === statusSteps.length - 1;
  const submittedDate = getArticleDate(article);

  return (
    <div className="fixed inset-0 z-150 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-screen items-start justify-center p-4 pt-8 pb-8">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-151">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Maqola tafsilotlari</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

            {/* Article title + category */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 text-lg leading-snug mb-2">{article.articleTitle}</h4>
              {article.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  <FaTag className="text-xs" />
                  {article.category}
                </span>
              )}
            </div>

            {showTimeline && (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-4">
                  {role === "superadmin" ? "Superadmin jarayon bosqichlari" : "Maqola bosqichi"}
                </p>
                <div className="flex items-start overflow-x-auto pb-1">
                  {statusSteps.map((step, index) => {
                  const isCompleted = index < currentStep;
                  const isCurrent   = index === currentStep;
                  const isFinal     = isFinalStep(index);
                  const isRejectedStep = rejectedFromStep !== null && index >= rejectedFromStep;

                  let circleClass = "bg-white border-gray-300 text-gray-400";
                  if (isRejectedStep) circleClass = "bg-red-500 border-red-500 text-white";
                  else if (isCompleted) circleClass = "bg-green-500 border-green-500 text-white";
                  else if (isCurrent && isFinal) circleClass = getFinalColor();
                  else if (isCurrent) circleClass = "bg-blue-500 border-blue-500 text-white";

                  let labelClass = "text-gray-400";
                  if (isRejectedStep) labelClass = "text-red-600 font-semibold";
                  else if (isCompleted) labelClass = "text-green-600 font-medium";
                  else if (isCurrent) labelClass = isFinal
                    ? (article.status === ARTICLE_STATUS.REJECTED ? "text-red-600 font-semibold" : article.status === ARTICLE_STATUS.ACCEPTED ? "text-green-600 font-semibold" : article.status === ARTICLE_STATUS.PUBLISHED ? "text-teal-700 font-semibold" : "text-orange-600 font-semibold")
                    : "text-blue-600 font-semibold";

                  const displayLabel = isRejectedStep && isFinal ? "Rad etildi" : isCurrent && isFinal ? getFinalLabel() : step.label;

                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center shrink-0" style={{ minWidth: 64 }}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${circleClass}`}>
                          {isRejectedStep ? "✗" : isCompleted ? "✓" : index + 1}
                        </div>
                        <p className={`text-xs mt-1.5 text-center leading-tight ${labelClass}`} style={{ maxWidth: 70 }}>
                          {displayLabel}
                        </p>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 min-w-6 mt-4 mx-1 ${
                            rejectedFromStep !== null && index >= rejectedFromStep
                              ? "bg-red-400"
                              : index < currentStep
                                ? "bg-green-400"
                                : "bg-gray-200"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
                </div>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={<FaUser />} label="Mualliflar" value={article.authorNames || article.fullName} />
              {article.email && <InfoRow icon={<FaEnvelope />} label="Email" value={article.email} />}
              {article.workplace && <InfoRow icon={<FaBuilding />} label="Ish joyi" value={article.workplace} />}
              {article.position && <InfoRow icon={<FaBriefcase />} label="Lavozim" value={article.position} />}
              {article.phone && <InfoRow icon={<FaPhone />} label="Telefon" value={article.phone} />}
              <InfoRow
                icon={<FaCalendar />}
                label={role === "user" ? "Yuborilgan vaqt" : "Yuborilgan sana"}
                value={
                  submittedDate
                    ? role === "user"
                      ? formatArticleDateTime(submittedDate)
                      : formatDate(submittedDate)
                    : "—"
                }
              />
              {role === "superadmin" && article.assignedTo && (
                <InfoRow icon={<FaUser />} label="Tayinlangan taqrizchi" value={article.assignedToName || article.assignedTo} />
              )}
            </div>

            {/* Keywords */}
            {article.keywords && (
              <Section title="Kalit so'zlar">
                <p className="text-gray-700 text-sm">{article.keywords}</p>
              </Section>
            )}

            {role === "user" && article.status === ARTICLE_STATUS.PAYMENT_PENDING && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-900">
                  <FaCreditCard />
                  <p className="font-semibold">To'lov bosqichi ochildi</p>
                </div>
                <p className="mt-2 text-sm text-amber-800">
                  Maqolangiz dastlabki ko'rikdan o'tdi. Paneldagi <strong>CLICK</strong> tugmasi orqali test to'lovni amalga oshiring.
                </p>
              </div>
            )}

            {role === "user" && article.publicationInfo && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Nashr ma'lumotlari
                </p>
                <p className="mt-2 text-sm text-emerald-900">
                  Maqolangiz <strong>{article.publicationInfo.journal}</strong>ning{" "}
                  <strong>{article.publicationInfo.issue}</strong>da chop etilishi rejalashtirilgan.
                </p>
              </div>
            )}

            {/* Annotation */}
            {article.annotation && (
              <Section title="Annotatsiya">
                <p className="text-gray-700 text-sm leading-relaxed">{article.annotation}</p>
              </Section>
            )}

            {/* Article file */}
            {article.fileName && (
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
                <FaFileAlt className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Maqola fayli</p>
                  <p className="font-medium text-blue-700 text-sm">{article.fileName}</p>
                </div>
              </div>
            )}
            {(role === "user" || role === "superadmin") && article.fileName && articleFileUrl && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={articleFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <FaExternalLinkAlt className="text-xs" />
                  Maqola faylini ko'rish
                </a>
                <a
                  href={articleFileUrl}
                  download={article.fileName}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FaDownload className="text-xs" />
                  Yuklab olish
                </a>
              </div>
            )}

            {/* Final decision message for author */}
            {role === "user" &&
              (article.status === ARTICLE_STATUS.ACCEPTED ||
                article.status === ARTICLE_STATUS.REJECTED ||
                article.status === ARTICLE_STATUS.REVISION_REQUIRED) &&
              article.finalDecisionDescription && (
                <div
                  className={`rounded-xl p-4 border ${
                    article.status === ARTICLE_STATUS.ACCEPTED
                      ? "bg-green-50 border-green-200"
                      : article.status === ARTICLE_STATUS.REJECTED
                        ? "bg-red-50 border-red-200"
                        : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Muharrir xabari
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {article.finalDecisionDescription}
                  </p>
                </div>
              )}

            {/* Review info — only for admin / superadmin */}
            {(role === "admin" || role === "superadmin") && article.reviewFile && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 space-y-2">
                <div className="flex items-center gap-2">
                  <FaFileUpload className="text-purple-600" />
                  <p className="font-semibold text-purple-900">Taqrizchi xulosasi</p>
                </div>
                <div className="flex items-center gap-2">
                  <FaFileAlt className="text-purple-400 shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Taqriz fayli: </span>
                    <span className="font-medium">{article.reviewFile}</span>
                  </p>
                </div>
                {role === "superadmin" && article.reviewFileUrl && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={toHttps(article.reviewFileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-sm font-medium"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                      Ko'rish
                    </a>
                    <a
                      href={toHttps(article.reviewFileUrl)}
                      download={article.reviewFile}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      <FaDownload className="text-xs" />
                      Yuklab olish
                    </a>
                  </div>
                )}
                {article.reviewConclusion && (
                  <div>
                    <p className="text-xs font-semibold text-purple-700 mb-1">Xulosa matni (superadminga):</p>
                    <p className="text-sm text-gray-800 bg-white rounded-lg p-3 border border-purple-200 leading-relaxed">
                      {article.reviewConclusion}
                    </p>
                  </div>
                )}
                {article.reviewComment && article.reviewComment !== article.reviewConclusion && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Qo'shimcha izoh:</p>
                    <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-purple-100">
                      {article.reviewComment}
                    </p>
                  </div>
                )}
                {article.reviewedAt && (
                  <p className="text-xs text-gray-400">
                    Taqriz yuborilgan: {formatDate(article.reviewedAt)}
                    {role === "superadmin" && article.reviewedByName && ` · Taqrizchi: ${article.reviewedByName}`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-100">
            <button onClick={onClose} className="btn btn-ghost">Yopish</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small helper sub-components
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5 shrink-0 text-sm">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-800 text-sm wrap-break-word">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{title}</p>
      <div className="bg-gray-50 rounded-lg p-3">{children}</div>
    </div>
  );
}

export default ArticleDetailModal;
