import { useEffect, useRef, useState } from "react";
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
} from "react-icons/fa";

function HomeJurnalHero() {
     const heroRef = useRef(null);
    
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
      
      // Muhim sanalarni ko'rsatish/yashirish
      const showDeadlines = true; // false qilib qo'ysangiz, faqat OAK ko'rinadi
      
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
                {/* <p
                  className="hidden md:block text-xs sm:text-sm md:text-base text-center w-full sm:max-w-[85%] mx-auto italic text-gray-200"
                  style={{
                    textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 1px 0 #000",
                    opacity: showDesc ? 1 : 0,
                    transform: showDesc ? "translateY(0)" : "translateY(32px)",
                    transition: "opacity 0.5s, transform 0.5s",
                  }}
                >
                  Kasbiy ta'lim sohasidagi ilmiy tadqiqotlar, innovatsion yondashuvlar, 
                  pedagogik tajribalar va nazariy izlanishlarni o'zida jamlagan ochiq platformamiz. 
                  Olimlar, tadqiqotchilar va amaliyotchilar uchun bilim almashish makoni.
                </p> */}
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
                      
                      {/* Muhim sanalar - Conditionally rendered */}
                      {showDeadlines && (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-white/10">
                            <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-105">
                              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                              <FaCalendarCheck className="text-white text-base sm:text-lg md:text-xl relative z-10 drop-shadow-lg" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
                                Muhim sanalar
                              </h3>
                              <div className="h-0.5 w-10 sm:w-12 md:w-16 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mt-0.5 sm:mt-1"></div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base text-gray-50">
                            <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                              <p className="flex items-start gap-1.5 sm:gap-2">
                                <span className="text-base sm:text-lg shrink-0">📝</span>
                                <span className="leading-relaxed">
                                  Maqolalar <strong className="text-emerald-300">25-aprelgacha</strong> qabul qilinadi
                                </span>
                              </p>
                            </div>
                            <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                              <p className="flex items-start gap-1.5 sm:gap-2">
                                <span className="text-base sm:text-lg shrink-0">📢</span>
                                <span className="leading-relaxed">
                                  Natijalar <strong className="text-cyan-300">2025-yil 30-aprelda</strong> e'lon qilinadi
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OAK - Always rendered */}
                      <div className={`flex flex-col ${showDeadlines ? 'md:border-l md:border-white/10 md:pl-6 lg:pl-8' : ''}`}>
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-white/10">
                          <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-105">
                            <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                            <FaAward className="text-white text-base sm:text-lg md:text-xl relative z-10 drop-shadow-lg" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
                              OAK tan olingan
                            </h3>
                            <div className="h-0.5 w-10 sm:w-12 md:w-16 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full mt-0.5 sm:mt-1"></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 text-xs sm:text-[15px] text-gray-50">
                          <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="flex items-center gap-1.5 sm:gap-2">
                              <FaCog className="text-amber-400 text-sm sm:text-base md:text-lg shrink-0" />
                              <span className="leading-snug"><strong>05.00.00</strong> — Texnika fanlari</span>
                            </p>
                          </div>
                          <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="flex items-center gap-1.5 sm:gap-2">
                              <FaChartLine className="text-emerald-400 text-sm sm:text-base md:text-lg shrink-0" />
                              <span className="leading-snug"><strong>08.00.00</strong> — Iqtisodiyot fanlari</span>
                            </p>
                          </div>
                          <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="flex items-center gap-1.5 sm:gap-2">
                              <FaGraduationCap className="text-blue-400 text-sm sm:text-base md:text-lg shrink-0" />
                              <span className="leading-snug"><strong>13.00.00</strong> — Pedagogika fanlari</span>
                            </p>
                          </div>
                          <div className="backdrop-blur-sm bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="flex items-center gap-1.5 sm:gap-2">
                              <FaBrain className="text-purple-400 text-sm sm:text-base md:text-lg shrink-0" />
                              <span className="leading-snug"><strong>19.00.00</strong> — Psixologiya fanlari</span>
                            </p>
                          </div>
                        </div>
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
