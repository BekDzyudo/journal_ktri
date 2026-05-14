import { useEffect, useMemo, useRef, useState } from "react";
import { useGlobalContext } from "../../hooks/useGlobalContext";
import { useHero } from "../../context/HeroContext";
import {
  FaCalendarCheck,
  FaAward,
  FaCog,
  FaChartLine,
  FaGraduationCap,
  FaBrain,
  FaLandmark,
  FaNewspaper,
  FaFileAlt,
  FaBullhorn,
  FaTrophy,
  FaCheckCircle,
  FaBell,
} from "react-icons/fa";
import useGetFetch from "../../hooks/useGetFetch";

const UZ_MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];

function HomeJurnalHero() {
  const heroRef = useRef(null);

  // API dan muhim sanalar
  const base = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const { data: sanalarData } = useGetFetch(base ? `${base}/muhim-sanalar/` : null);
  const mainEntry = Array.isArray(sanalarData) && sanalarData.length > 0 ? sanalarData[0] : null;

  const journalIssue = mainEntry?.tavsif || "—";
  const deadlineStr = mainEntry?.sana || null;

  const deadlineDate = useMemo(
    () => (deadlineStr ? new Date(deadlineStr + "T23:59:59") : null),
    [deadlineStr]
  );
  const resultsDate = useMemo(
    () => (deadlineDate ? new Date(deadlineDate.getTime() + 15 * 24 * 60 * 60 * 1000) : null),
    [deadlineDate]
  );

  const fmtDeadlineShort = deadlineDate
    ? `${deadlineDate.getDate()}-${UZ_MONTHS[deadlineDate.getMonth()]}`
    : "—";
  const fmtResultsFull = resultsDate
    ? `${resultsDate.getFullYear()}-yil ${resultsDate.getDate()}-${UZ_MONTHS[resultsDate.getMonth()]}`
    : "—";
  const resultsAnnounced = resultsDate ? resultsDate.getTime() < Date.now() : false;
    
      useEffect(() => {
      const onScroll = () => {
        if (!heroRef.current) return;
    
        const heroHeight = heroRef.current.offsetHeight;
        const headerHeight = 80; // Header balandligi
        setOnHero(window.scrollY < (heroHeight - headerHeight));
      };
    
      onScroll();
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const { theme } = useGlobalContext();
      const { setOnHero } = useHero();
      // Animated heading and description state
      const [showHeading, setShowHeading] = useState(false);
      const [showDesc, setShowDesc] = useState(false);
      
      // Muhim sanalar bloki: har doim ko'rsatiladi (API yuklanmaganida ham)
      const showDeadlines = true;

      // Countdown timer — deadlineDate o'zgarganda qayta ishga tushadi
      const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
      useEffect(() => {
        if (!deadlineDate) {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
          return;
        }
        const tick = () => {
          const diff = deadlineDate.getTime() - Date.now();
          if (diff <= 0) {
            setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
            return;
          }
          setCountdown({
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
            expired: false,
          });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
      }, [deadlineDate]);

      useEffect(() => {
        setShowHeading(false);
        setShowDesc(false);
        const headingTimeout = setTimeout(() => setShowHeading(true), 100);
        const descTimeout = setTimeout(() => setShowDesc(true), 350);
        return () => {
          clearTimeout(headingTimeout);
          clearTimeout(descTimeout);
        };
      }, []);
    
  return (
     <section
     ref={heroRef}
          className={`relative w-full min-h-[600px] lg:min-h-[750px] flex items-center px-5 py-8 ${
            theme === "light" ? "text-neutral-content" : ""
          }`}
        >
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/bg_image_banner.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{
              background: theme === "light" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.7)",
            }}
          ></div>
          <div className="flex flex-col w-full justify-center pt-6 sm:pt-8 lg:pt-12">
            <div className="w-full flex flex-col items-center z-20">
              <div className="w-full sm:w-4/5 max-w-6xl px-2">
                <h2
                  className="text-xl sm:text-2xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 lg:mb-5 font-bold text-white leading-tight font-serif text-center"
                  style={{
                    textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 1px 0 #000",
                    opacity: showHeading ? 1 : 0,
                    transform: showHeading ? "translateY(0)" : "translateY(32px)",
                    transition: "opacity 0.5s, transform 0.5s",
                  }}
                >
                  Kasbiy ta'limni rivojlantirish instituti<br className="hidden sm:block" />{' '}
                  <span className="text-info">ilmiy jurnali</span>
                </h2>
                
              </div>
              
              {/* Info Card */}
              <div className="mt-6 sm:mt-8 xl:mt-12 z-20 max-w-6xl mx-auto w-full px-2 sm:px-4">
                <div
                  className="group relative"
                  style={{
                    animation: `fadeInUp 0.6s ease-out 0s both`
                  }}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-bg-primary/15 to-border-primary/30 rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition duration-500" />
                  
                  <div className="relative backdrop-blur-md bg-info/15 hover:bg-info/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-info/30 hover:border-info/50 transition-all duration-300 shadow-2xl">
                    <div className={`grid ${showDeadlines ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4 sm:gap-6 lg:gap-8`}>
                      
                      {/* Muhim sanalar */}
                      {showDeadlines && (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-white/10">
                            <div className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${countdown.expired ? 'from-slate-500 to-slate-600' : 'from-emerald-400 to-cyan-400'} flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-105`}>
                              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                              <FaCalendarCheck className="text-white text-base sm:text-lg md:text-xl relative z-10 drop-shadow-lg" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
                                {countdown.expired ? 'Qabul yakunlandi' : 'Muhim sanalar'}
                              </h3>
                              <div className={`h-0.5 w-10 sm:w-12 md:w-16 bg-gradient-to-r ${countdown.expired ? 'from-slate-400 to-slate-500' : 'from-emerald-400 to-cyan-400'} rounded-full mt-0.5 sm:mt-1`}></div>
                            </div>
                          </div>

                          {countdown.expired ? (
                            <div className="space-y-2 sm:space-y-3">
                              {/* Yakunlangan jurnal nomi */}
                              <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
                                <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Yakunlangan son</p>
                                <div className="flex items-center gap-2.5">
                                  <FaTrophy className="text-amber-300 text-lg shrink-0" />
                                  <p className="text-white font-bold text-sm sm:text-base">{journalIssue}</p>
                                </div>
                              </div>
                              {/* Yakunlanish xabari */}
                              <div className="backdrop-blur-sm bg-slate-400/10 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-slate-400/20 flex items-center gap-2.5">
                                <FaCheckCircle className="text-emerald-400 shrink-0 text-base" />
                                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                                  Ushbu son uchun maqola qabuli <strong className="text-slate-200">muvaffaqiyatli yakunlandi</strong>
                                </p>
                              </div>
                              {/* Natijalar sanasi */}
                              <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-white/10 flex items-center gap-2.5">
                                <FaBullhorn className="text-cyan-300 shrink-0 text-sm sm:text-base" />
                                <span className="leading-relaxed text-xs sm:text-sm text-gray-50">
                                  Natijalar <strong className="text-cyan-300">{fmtResultsFull}da</strong> {resultsAnnounced ? "e'lon qilindi" : "e'lon qilinadi"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base text-gray-50">
                              <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="flex items-center gap-2 sm:gap-2.5">
                                  <FaFileAlt className="text-emerald-300 shrink-0 text-sm sm:text-base" />
                                  <span className="leading-relaxed">
                                    Maqolalar <strong className="text-emerald-300">{fmtDeadlineShort}gacha</strong> qabul qilinadi
                                  </span>
                                </p>
                              </div>
                              <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="flex items-center gap-2 sm:gap-2.5">
                                  <FaBullhorn className="text-cyan-300 shrink-0 text-sm sm:text-base" />
                                  <span className="leading-relaxed">
                                    Natijalar <strong className="text-cyan-300">{fmtResultsFull}da</strong> {resultsAnnounced ? "e'lon qilindi" : "e'lon qilinadi"}
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Qabul */}
                      <div className={`flex flex-col ${showDeadlines ? 'md:border-l md:border-white/10 md:pl-6 lg:pl-8' : ''}`}>
                        <div className={`flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b ${countdown.expired ? 'border-slate-400/20' : 'border-amber-400/30'}`}>
                          <div className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${countdown.expired ? 'from-slate-500 to-slate-700' : 'from-amber-400 to-rose-400 shadow-amber-500/30'} flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-105`}>
                            {!countdown.expired && <span className="absolute inset-0 rounded-lg sm:rounded-xl animate-ping bg-amber-400/30" />}
                            <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                            <FaAward className="text-white text-base sm:text-lg md:text-xl relative z-10 drop-shadow-lg" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
                                {countdown.expired ? 'Keyingi qabul' : 'Qabul davom etmoqda'}
                              </h3>
                              {!countdown.expired && (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-2 py-0.5">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Faol</span>
                                </span>
                              )}
                            </div>
                            <div className={`h-0.5 w-10 sm:w-12 md:w-16 bg-gradient-to-r ${countdown.expired ? 'from-slate-400 to-slate-500' : 'from-amber-400 to-rose-400'} rounded-full mt-0.5 sm:mt-1`}></div>
                          </div>
                        </div>

                        {/* Joriy jurnal soni badge */}
                        <div className="mb-3 backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 border border-white/10 flex items-center gap-2.5">
                          <FaNewspaper className={`${countdown.expired ? 'text-slate-400' : 'text-cyan-300'} shrink-0 text-base sm:text-lg`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider leading-none">
                              {countdown.expired ? 'Yakunlangan son' : 'Joriy son'}
                            </p>
                            <p className="text-white font-bold text-sm sm:text-base leading-tight mt-0.5">{journalIssue}</p>
                          </div>
                          {countdown.expired ? (
                            <span className="inline-flex items-center bg-slate-500/20 border border-slate-400/30 rounded-full px-2 py-0.5 shrink-0">
                              <span className="text-[10px] sm:text-xs text-slate-300 font-semibold">Yakunlandi</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                              </span>
                              <span className="text-[10px] sm:text-xs text-emerald-300 font-semibold">Qabul faol</span>
                            </div>
                          )}
                        </div>

                        {/* Countdown yoki yakunlangan holat */}
                        {!countdown.expired ? (
                          <div className="mb-3">
                            <p className="text-[11px] sm:text-xs text-gray-400 mb-2">Qabul muddatigacha qoldi:</p>
                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                              {[
                                { val: countdown.days, label: "kun" },
                                { val: countdown.hours, label: "soat" },
                                { val: countdown.minutes, label: "daqiqa" },
                                { val: countdown.seconds, label: "soniya" },
                              ].map(({ val, label }) => (
                                <div key={label} className="backdrop-blur-sm bg-white/10 rounded-lg border border-white/20 py-2 px-1 text-center">
                                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tabular-nums leading-none">
                                    {String(val).padStart(2, "0")}
                                  </div>
                                  <div className="text-[9px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-1">
                                    {label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3 backdrop-blur-sm bg-indigo-400/10 rounded-xl border border-indigo-400/20 px-4 py-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="relative w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
                                <FaBell className="text-indigo-300 text-sm" />
                              </div>
                              <p className="text-indigo-200 font-bold text-sm sm:text-base">Keyingi qabul</p>
                            </div>
                            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed pl-9">
                              Yangi son uchun maqola qabuli <strong className="text-indigo-300">yaqin orada e'lon qilinadi</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/50 to-transparent rounded-t-2xl" />
                  </div>
                </div>
              </div>

              <style>{`
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateY(30px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent " />
        </section>
  )
}

export default HomeJurnalHero
