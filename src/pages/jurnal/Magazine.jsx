import React, { useState, useEffect } from "react";
import {
  FaCalendar,
  FaEye,
  FaSearch,
} from "react-icons/fa";
import { useHero } from "../../context/HeroContext";
import SEO from "../../components/SEO";
import { Link } from "react-router-dom";
import useGetFetch from "../../hooks/useGetFetch";

function Magazine() {
  const { setOnHero } = useHero();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");

  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  // Jurnallar ro'yxati (Mock data - keyinchalik API dan olinadi)
   const { data:magazines, isPending, error } = useGetFetch(
    `${import.meta.env.VITE_BASE_URL}/jurnal-sonlari/`,
  );
  console.log(magazines);

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

  // Unique yillarni olish
  const uniqueYears = [...new Set(magazines?.map(mag => mag.year))].sort((a, b) => b - a);

  // Filterlangan jurnallar
  const filteredMagazines = magazines?.filter((magazine) => {
    const matchesSearch = magazine.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === "all" || magazine.year === selectedYear;
    return matchesSearch && matchesYear;
  });

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
        title="Ilmiy jurnallar - KTRI"
        description="Kasbiy ta'limni rivojlantirish instituti ilmiy jurnallari, nashr etilgan sonlar, maqolalar va tadqiqot ishlari"
        keywords="ilmiy jurnal, jurnallar, nashr, maqolalar, tadqiqot, ilmiy ishlar, KTRI jurnallar, kasbiy ta'lim jurnali"
      />

      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 relative min-h-screen w-full py-16 sm:py-24">
        <div className="px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 mb-16 sm:mb-20">
          {/* Header */}
          <div className="mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              {/* Title Section */}
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold font-serif text-[#0d4ea3] mb-2">
                  Ilmiy jurnallar
                </h1>
                <p className="text-lg text-gray-600 italic">
                  Kasbiy ta'lim sohasidagi ilmiy jurnallarimizning barcha sonlari
                </p>
              </div>

              {/* Search and Filter Section */}
              <div className="flex flex-col sm:flex-row gap-3 lg:shrink-0">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <FaSearch className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Qidiruv..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 transition-colors text-gray-700 placeholder-gray-400"
                  />
                </div>

                {/* Year Filter - DaisyUI Select */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="select select-bordered w-full sm:w-40 h-12 rounded-full border-2 border-gray-200 bg-white focus:border-blue-500 focus:outline-none text-gray-700 font-medium"
                >
                  <option value="all">Barcha yillar</option>
                  {uniqueYears.map((year) => (
                    <option key={year} value={year}>
                      {year} yil
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Magazines Grid */}
          {filteredMagazines?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {filteredMagazines.map((magazine) => (
                <Link
                  key={magazine.id}
                  to={`/magazine/${magazine.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full">
                    {/* Image - A4 Format (Book/Magazine Cover) */}
                    <div className="p-4 pb-0">
                      <div className="relative overflow-hidden shrink-0 rounded-xl h-64 sm:h-96">
                        <img
                          src={magazine.image}
                          alt={magazine.title}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-800 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors flex-1">
                        {magazine.title}
                      </h3>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <FaCalendar size={16} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {formatDate(magazine.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <FaEye size={16} className="text-green-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {formatViews(magazine.views)}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">
                {searchQuery || selectedYear !== "all" 
                  ? "Qidiruv bo'yicha natija topilmadi" 
                  : "Hech qanday jurnal topilmadi"}
              </p>
              {(searchQuery || selectedYear !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedYear("all");
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Filtrni tozalash
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Magazine;
