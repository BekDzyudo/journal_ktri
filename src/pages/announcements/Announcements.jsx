import React, { useState, useEffect } from "react";
import {
  FaCalendar,
  FaEye,
} from "react-icons/fa";
import { useHero } from "../../context/HeroContext";
import SEO from "../../components/SEO";
import { Link } from "react-router-dom";

function Announcements() {
  const { setOnHero } = useHero();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  // E'lonlar ro'yxati (Mock data - keyinchalik API dan olinadi)
  const announcements = [
    {
      id: 1,
      title: "2024-yil uchun ilmiy maqolalar qabul qilinmoqda",
      image: "/elonjurnal.png",
      date: "2024-01-15",
      views: 1250,
    },
    {
      id: 2,
      title: "Kasbiy ta'lim sohasida ilmiy konferensiya e'lon qilinadi",
      image: "/elonjurnal.png",
      date: "2024-01-10",
      views: 890,
    },
    {
      id: 3,
      title: "Yangi jurnal soni nashr etildi - 2024 yil, 1-son",
      image: "/elonjurnal.png",
      date: "2024-01-05",
      views: 2340,
    },
    {
      id: 4,
      title: "Maqola yuborish bo'yicha yangi talablar",
      image: "/elonjurnal.png",
      date: "2023-12-28",
      views: 1560,
    },
    {
      id: 5,
      title: "Pedagogika fanlari bo'yicha maxsus son chiqariladi",
      image: "/elonjurnal.png",
      date: "2023-12-20",
      views: 780,
    },
    {
      id: 6,
      title: "Xalqaro hamkorlik dasturi e'lon qilinadi",
      image: "/elonjurnal.png",
      date: "2023-12-15",
      views: 1120,
    },
    {
      id: 7,
      title: "Yosh olimlar uchun grant e'lon qilindi",
      image: "/elonjurnal.png",
      date: "2023-12-10",
      views: 3200,
    },
    {
      id: 8,
      title: "Tahririyat hay'ati yangi a'zolar qabul qilmoqda",
      image: "/elonjurnal.png",
      date: "2023-12-05",
      views: 560,
    },
  ];

  // Sanani formatlash
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  // Ko'rishlar sonini formatlash
  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  if (loading) {
    return (
      <section className="relative min-h-screen w-full bg-gradient-to-b from-base-100 via-base-200 to-base-100 py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </section>
    );
  }


  return (
    <>
      <SEO
        title="E'lonlar - KTRI"
        description="Kasbiy ta'limni rivojlantirish instituti ilmiy jurnali e'lonlari, yangiliklar va muhim xabarlar"
        keywords="e'lonlar, ilmiy jurnal, maqolalar, konferensiya, KTRI e'lonlar"
      />

      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 relative min-h-screen w-full py-16 sm:py-24">
        <div className="px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 mb-16 sm:mb-20">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-[#0d4ea3] mb-4">
              E'lonlar
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl italic">
              Jurnalimiz bo'yicha eng so'nggi e'lonlar va yangiliklar bilan tanishing
            </p>
          </div>

          {/* Announcements Grid */}
          {announcements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {announcements.map((announcement) => (
                <Link
                  key={announcement.id}
                  to={`/announcements/${announcement.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full">
                    {/* Image */}
                    <div className="p-4 pb-0">
                      <div className="relative h-56 overflow-hidden shrink-0 rounded-xl">
                        <img
                          src={announcement.image}
                          alt={announcement.title}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-800 mb-4 line-clamp-3 group-hover:text-blue-600 transition-colors flex-1">
                        {announcement.title}
                      </h3>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <FaCalendar size={14} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {formatDate(announcement.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <FaEye size={14} className="text-green-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {formatViews(announcement.views)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">
                Hech qanday e'lon topilmadi
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Announcements;
