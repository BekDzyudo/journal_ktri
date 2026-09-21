import React, { useState } from "react";
import { FaUniversity, FaCopy, FaCheck, FaDownload, FaExclamationTriangle, FaTelegram } from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "./Modal";

const ORGANIZATION_NAME = "Kasbiy ta'limni rivojlantirish instituti";
const ACCOUNT_NUMBER = "400110860262807096200367001";
const TELEGRAM_USERNAME = "bekdzyudo";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;
const PAYME_URL = "https://payme.uz";
const CLICK_URL = "https://click.uz";

function buildRequisitesText(articleTitle) {
  const lines = [
    "TO'LOV REKVIZITLARI",
    "",
    `Tashkilot: ${ORGANIZATION_NAME}`,
    `Hisob raqami: ${ACCOUNT_NUMBER}`,
    "",
    "MUHIM: to'lov izohida (naznacheniye platezha) F.I.Sh va to'lov maqsadini ko'rsating.",
    articleTitle
      ? `Masalan: "Familiya Ism — jurnal uchun maqola yuborish: ${articleTitle}"`
      : `Masalan: "Familiya Ism — jurnal uchun maqola yuborish"`,
    "",
    `Yoki Payme (${PAYME_URL}) / Click (${CLICK_URL}) ilovasi orqali shu hisob raqamiga to'lang.`,
    "",
    `To'lovni amalga oshirgach, chekning rasmini Telegram orqali yuboring: @${TELEGRAM_USERNAME} (${TELEGRAM_URL})`,
  ];
  return lines.join("\n");
}

function PaymentRequisitesModal({ isOpen, onClose, articleTitle }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT_NUMBER);
      setCopied(true);
      toast.success("Hisob raqami nusxalandi");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nusxalab bo'lmadi");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([buildRequisitesText(articleTitle)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tolov_rekvizitlari.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="To'lov rekvizitlari" panelClassName="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600">
            <FaUniversity className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Tashkilot</p>
            <p className="text-sm font-bold text-slate-900">{ORGANIZATION_NAME}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Hisob raqami</p>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className="break-all text-base font-black text-slate-900">{ACCOUNT_NUMBER}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              {copied ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
              {copied ? "Nusxalandi" : "Nusxalash"}
            </button>
          </div>

          <div className="mt-3 flex gap-2.5 border-t border-slate-200 pt-3">
            <a
              href={PAYME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-[#00bcd4] px-3 py-2 text-center text-xs font-black text-white transition hover:opacity-90"
            >
              Payme orqali to'lash
            </a>
            <a
              href={CLICK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-[#0077ff] px-3 py-2 text-center text-xs font-black text-white transition hover:opacity-90"
            >
              Click orqali to'lash
            </a>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs leading-5 text-amber-800">
            <span className="font-bold">Muhim:</span> to'lovni amalga oshirishda izoh (naznacheniye platezha) qismiga
            albatta <span className="font-bold">F.I.Sh</span> va <span className="font-bold">to'lov maqsadini</span> yozing.
            Masalan: "Familiya Ism — jurnal uchun maqola yuborish{articleTitle ? `: ${articleTitle}` : ""}".
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <FaTelegram className="mt-0.5 shrink-0 text-sky-500" />
          <p className="text-xs leading-5 text-sky-900">
            <span className="font-bold">To'lovdan so'ng:</span> chekning rasmini (yoki PDF) Telegram orqali yuboring —{" "}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:text-sky-700"
            >
              @{TELEGRAM_USERNAME}
            </a>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          <FaDownload className="text-xs" />
          Rekvizitlarni yuklab olish
        </button>
      </div>
    </Modal>
  );
}

export default PaymentRequisitesModal;
