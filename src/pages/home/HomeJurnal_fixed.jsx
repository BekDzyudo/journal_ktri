import { useEffect, useState } from "react";
import {
  FaBullseye,
  FaClipboardList,
  FaFolderOpen,
  FaFileContract,
  FaLayerGroup,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import HomeJurnalHero from "./HomeJurnalHero";
import SEO from "../../components/SEO";

function HomeJurnal() {
  const navigationCards = [
    {
      id: 1,
      icon: FaBullseye,
      title: "Missiya",
      link: "/missiya",
    },
    {
      id: 2,
      icon: FaClipboardList,
      title: "Karib chiqish tartibi",
      link: "/karib-chiqish",
    },
    {
      id: 3,
      icon: FaFolderOpen,
      title: "Ochiq ma'lumotlar",
      link: "/ochiq-malumotlar",
    },
    {
      id: 4,
      icon: FaFileContract,
      title: "Nashr qilish shartlari",
      link: "/nashr-shartlari",
    },
    {
      id: 5,
      icon: FaLayerGroup,
      title: "Ruknlar",
      link: "/ruknlar",
    },
  ];

  return (
    <>
      <SEO 
        title="KTRI Ilmiy jurnali - Kasbiy ta'limni rivojlantirish instituti"
        description="Kasbiy ta'lim sohasidagi ilmiy tadqiqotlar, innovatsion yondashuvlar, pedagogik tajribalar va nazariy izlanishlarni o'zida jamlagan ochiq platformamiz. Olimlar, tadqiqotchilar va amaliyotchilar uchun bilim almashish makoni."
        keywords="ilmiy jurnal, kasbiy ta'lim, ilmiy maqolalar, pedagogika, OAK, ilmiy tadqiqot, KTRI, ilmiy nashr, texnika fanlari, iqtisodiyot, psixologiya, ta'lim innovatsiyalari"
      />
      
      <HomeJurnalHero />
      <section className="relative flex flex-col items-center -mt-10 z-20 mb-25 sm:mb-40">
        <div className="w-full mx-5 xl:max-w-7xl 2xl:max-w-10/12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5 xl:gap-6 px-3 sm:px-4 shadow-xl rounded-2xl bg-base-100 py-4 sm:py-6 lg:py-8">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                to={card.link}
                className="group cursor-pointer rounded-xl flex flex-col gap-2 items-center py-3 sm:py-4 px-2 sm:px-3 transition-all duration-300 bg-slate-50 hover:bg-info hover:text-white hover:shadow-lg border border-slate-200 hover:border-info"
              >
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white group-hover:bg-white/20 flex items-center justify-center border-2 border-info group-hover:border-white transition-all duration-300">
                  <Icon className="text-info group-hover:text-white text-xl sm:text-2xl transition-colors duration-300" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-center text-gray-800 group-hover:text-white transition-colors duration-300">
                  {card.title}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default HomeJurnal;
