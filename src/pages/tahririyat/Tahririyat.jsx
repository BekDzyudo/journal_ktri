import React, { useState, useEffect } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";
import { useHero } from "../../context/HeroContext";
import SEO from "../../components/SEO";
import useGetFetch from "../../hooks/useGetFetch";

function Tahririyat() {
  const { setOnHero } = useHero();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  // Tahririyat jamoasi a'zolari (Mock data - keyinchalik API dan olinadi)

  const { data:editorialTeam, isPending, error } = useGetFetch(
    `${import.meta.env.VITE_BASE_URL}/tahririyat/`,
  );


  if (isPending) {
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
        title="Jurnal tahririyati - KTRI"
        description="Kasbiy ta'limni rivojlantirish instituti jurnal tahririyati a'zolari, bosh muharrir, muharrir o'rinbosari va tahririyat hay'ati"
        keywords="tahririyat jamoasi, bosh muharrir, muharrir, ilmiy jurnal, KTRI tahririyat"
      />

      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 relative min-h-screen w-full py-16 sm:py-24">
        <div className="px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 mb-16 sm:mb-20">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-[#0d4ea3] mb-4">
              Tahririyat jamoasi
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl italic">
              Ilmiy jurnalimiz tahririyat hay'ati a'zolari bilan tanishing
            </p>
          </div>

          {/* Team Grid */}
          {editorialTeam?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {editorialTeam.map((member) => (
                  <div
                    key={member.id}
                    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-blue-500 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Image Section */}
                      <div className="sm:w-72 h-72 sm:h-80 shrink-0 relative overflow-hidden">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6 flex flex-col">
                        {/* Name */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </h3>

                        {/* Academic Degree */}
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg mb-3 self-start">
                          <FaUser size={14} />
                          <span className="text-sm font-semibold">
                            {member.position}
                          </span>
                        </div>

                        {/* Category & Job Title */}
                        <p className="text-gray-700 text-base mb-4 leading-relaxed">
                          <span className="font-bold">{member.category}.</span> {member.jobTitle}
                        </p>

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Footer - Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t-2 border-gray-100">
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2.5 rounded-lg group/contact hover:bg-blue-100 transition-colors">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                              <FaPhone size={14} className="text-white" />
                            </div>
                            <a
                              href={`tel:${member.phone}`}
                              className="text-[16] font-medium text-gray-700 group-hover/contact:text-blue-700"
                            >
                              {member.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2.5 rounded-lg group/contact hover:bg-blue-100 transition-colors">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                              <FaEnvelope size={14} className="text-white" />
                            </div>
                            <a
                              href={`mailto:${member.email}`}
                              className="text-[16] font-medium text-gray-700 group-hover/contact:text-blue-700 truncate"
                            >
                              {member.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <FaUser className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                Hech qanday a'zo topilmadi
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Tahririyat;
