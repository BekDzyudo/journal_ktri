import React, { useEffect, useState, useRef } from "react";
import { FaTelegramPlane } from "react-icons/fa";
import { FiX } from "react-icons/fi";

const SESSION_KEY = "ktri_telegram_invite_dismissed";
const SHOW_DELAY_MS = 5000;
/** Agar `.env` da VITE_TELEGRAM_CHANNEL_URL bo‘lmasa */
const DEFAULT_TELEGRAM_CHANNEL_URL = "https://t.me/KTRI_jurnali";

function getTelegramUrl() {
  const u = (import.meta.env.VITE_TELEGRAM_CHANNEL_URL || "").trim();
  return u || DEFAULT_TELEGRAM_CHANNEL_URL;
}

export default function TelegramInviteModal() {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      /* private mode */
    }

    timerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, SHOW_DELAY_MS);

    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const handleJoin = () => {
    window.open(getTelegramUrl(), "_blank", "noopener,noreferrer");
    dismiss();
  };

  if (!open) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[130] w-[min(100vw-2rem,22rem)] sm:bottom-15 sm:right-6"
      role="dialog"
      aria-labelledby="telegram-invite-title"
      aria-describedby="telegram-invite-desc"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)]">
        <div className="h-2 bg-gradient-to-r from-sky-500 to-blue-600" />
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2.5 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Yopish"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="p-4 pr-11 pt-4">
          <div className="flex gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md">
              <FaTelegramPlane className="text-xl" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3
                id="telegram-invite-title"
                className="text-sm font-black font-serif leading-snug text-slate-900 sm:text-[18px]"
              >
                Telegramda kuzating
              </h3>
              <p
                id="telegram-invite-desc"
                className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]"
              >
                Jurnalga oid <span className="text-blue-600">yangiliklar</span>, <span className="text-blue-600">e&apos;lonlar</span> va <span className="text-blue-600">sertifikatlar </span> 
                telegramda yoritib boriladi.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:text-sm"
            >
              Yo&apos;q, rahmat
            </button>
            <button
              type="button"
              onClick={handleJoin}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:from-sky-600 hover:to-blue-700 sm:text-sm"
            >
              Kanalga o&apos;tish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
