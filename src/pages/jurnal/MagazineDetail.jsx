import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaCalendar,
  FaEye,
  FaDownload,
  FaArrowLeft,
  FaFilePdf,
} from "react-icons/fa";
import { useHero } from "../../context/HeroContext";
import SEO from "../../components/SEO";

function MagazineDetail() {
  const { id } = useParams();
  const { setOnHero } = useHero();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  // Mock data - keyinchalik API dan olinadi
  const magazines = [
    {
      id: 1,
      title: "Kasbiy ta'lim jurnali - 2024 yil, 1-son",
      image: "/jurnalmocup.png",
      date: "2024-01-15",
      views: 3250,
      volume: "1",
      issue: "1",
      year: "2024",
      description: `Bu son kasbiy ta'lim tizimining zamonaviy tendensiyalari va innovatsion yondashuvlariga bag'ishlangan. 
      Jurnalda O'zbekiston va xorijiy tajribalar asosida kasbiy ta'limni rivojlantirishning istiqbollari, 
      shuningdek, ta'lim jarayonida zamonaviy texnologiyalardan foydalanish masalalari yoritilgan.`,
      pdfUrl: "/magazines/2024-1.pdf",
      pages: 120,
    },
    {
      id: 2,
      title: "Kasbiy ta'lim jurnali - 2023 yil, 4-son",
      image: "/jurnalmocup.png",
      date: "2023-12-20",
      views: 2890,
      volume: "1",
      issue: "4",
      year: "2023",
      description: `Ushbu sonda kasbiy ta'limda pedagogik texnologiyalar, o'qitish metodlari va talabalar kompetensiyalarini 
      rivojlantirish bo'yicha tadqiqot natijalari keltirilgan. Jurnal ilmiy va amaliy ahamiyatga ega maqolalarni o'z ichiga oladi.`,
      pdfUrl: "/magazines/2023-4.pdf",
      pages: 115,
    },
    {
      id: 3,
      title: "Kasbiy ta'lim jurnali - 2023 yil, 3-son",
      image: "/jurnalmocup.png",
      date: "2023-09-15",
      views: 2540,
      volume: "1",
      issue: "3",
      year: "2023",
      description: `Jurnal sonida kasbiy ta'lim muassasalarida raqamli texnologiyalarni joriy etish, masofaviy ta'lim 
      imkoniyatlari va ta'lim sifatini baholash mezonlari muhokama qilingan.`,
      pdfUrl: "/magazines/2023-3.pdf",
      pages: 108,
    },
    {
      id: 4,
      title: "Kasbiy ta'lim jurnali - 2023 yil, 2-son",
      image: "/jurnalmocup.png",
      date: "2023-06-10",
      views: 2240,
      volume: "1",
      issue: "2",
      year: "2023",
      description: `Ushbu sonda kasbiy ta'lim va ishlab chiqarish o'rtasidagi integratsiya, shuningdek, 
      talabalarning amaliy ko'nikmalarini rivojlantirishga qaratilgan zamonaviy yondashuvlar tahlil qilingan.`,
      pdfUrl: "/magazines/2023-2.pdf",
      pages: 112,
    },
    {
      id: 5,
      title: "Kasbiy ta'lim jurnali - 2023 yil, 1-son",
      image: "/jurnalmocup.png",
      date: "2023-03-05",
      views: 1980,
      volume: "1",
      issue: "1",
      year: "2023",
      description: `2023 yilning birinchi soni kasbiy ta'limda yangi standartlar, o'quv dasturlarini takomillashtirish 
      va o'qituvchilarning malakasini oshirish masalalariga bag'ishlangan.`,
      pdfUrl: "/magazines/2023-1.pdf",
      pages: 105,
    },
    {
      id: 6,
      title: "Kasbiy ta'lim jurnali - 2022 yil, 4-son",
      image: "/jurnalmocup.png",
      date: "2022-12-15",
      views: 1720,
      volume: "1",
      issue: "4",
      year: "2022",
      description: `Jurnal soni kasbiy ta'lim sohasidagi xalqaro hamkorlik, tajriba almashish va 
      yosh mutaxassislar tayyorlashning dolzarb masalalari bilan tanishtirishga qaratilgan.`,
      pdfUrl: "/magazines/2022-4.pdf",
      pages: 98,
    },
    {
      id: 7,
      title: "Kasbiy ta'lim jurnali - 2022 yil, 3-son",
      image: "/jurnalmocup.png",
      date: "2022-09-10",
      views: 1560,
      volume: "1",
      issue: "3",
      year: "2022",
      description: `Ushbu sonda kasbiy ta'limda ilmiy-tadqiqot ishlarini tashkil etish, innovatsion 
      loyihalarni amalga oshirish va talabalar faolligini oshirish yo'llari ko'rib chiqilgan.`,
      pdfUrl: "/magazines/2022-3.pdf",
      pages: 102,
    },
    {
      id: 8,
      title: "Kasbiy ta'lim jurnali - 2022 yil, 2-son",
      image: "/jurnalmocup.png",
      date: "2022-06-05",
      views: 1420,
      volume: "1",
      issue: "2",
      year: "2022",
      description: `2022 yilning ikkinchi sonida kasbiy ta'lim muassasalarida zamonaviy laboratoriyalar yaratish, 
      amaliy mashg'ulotlarni tashkil etish va sanoat bilan hamkorlik qilish tajribalari taqdim etilgan.`,
      pdfUrl: "/magazines/2022-2.pdf",
      pages: 95,
    },
  ];

  const magazine = magazines.find((mag) => mag.id === parseInt(id));

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
          <p className="mt-4 text-base-content/70">
            Ma'lumotlar yuklanmoqda...
          </p>
        </div>
      </section>
    );
  }

  if (!magazine) {
    return (
      <section className="relative min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 py-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Jurnal topilmadi
          </h2>
          <Link
            to="/magazines"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaArrowLeft />
            Jurnallar ro'yxatiga qaytish
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO
        title={`${magazine.title} - KTRI`}
        description={magazine.description}
        keywords={`ilmiy jurnal, ${magazine.year} yil, ${magazine.issue}-son, kasbiy ta'lim, KTRI jurnal`}
      />

      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 relative min-h-screen w-full py-16 sm:py-24">
        <div className="px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 mb-16 sm:mb-20">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              to="/magazines"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8 transition-colors group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span>Jurnallarga qaytish</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 lg:gap-12">
            {/* Left Side - Magazine Image */}
            <div className="order-2 lg:order-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4">
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={magazine.image}
                      alt={magazine.title}
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Information */}
            <div className="order-1 lg:order-2 w-full">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#0d4ea3] mb-4">
                    {magazine.title}
                  </h1>
                  {/* Date and Views */}
                  <div className="flex flex-wrap items-center gap-6 text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-blue-600" size={20} />
                      <span className="text-sm font-medium">
                        {formatDate(magazine.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaEye className="text-green-600" size={20} />
                      <span className="text-sm font-medium">
                        {formatViews(magazine.views)} ko'rildi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jurnal haqida */}
                <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-100 p-6 lg:p-8">
                  <div className="space-y-5">
                    <p className="text-gray-800 text-base lg:text-lg leading-relaxed">
                      O'zbekiston Respublikasi Prezidentining 2021-yil 25-yanvardagi <span className="font-semibold">"Maktabgacha va maktab ta'limi sohasidagi ilmiy-tadqiqot faoliyatini qo'llab quvvatlash hamda uzluksiz kasbiy rivojlantirish tizimini joriy qilish chora-tadbirlari to'g'risida"</span> <span className="font-bold text-blue-700">PQ-4963-son qarori</span> bilan 2021-yil <span className="font-semibold">A.Avloniy nomidagi pedagogik mahorat milliy institutida</span> <span className="font-bold text-[#0d4ea3]">"Maktab ta'limi: muammolar, izlanishlar, yechimlar"</span> nomli ilmiy-nazariy va o'quv-uslubiy jurnali ta'sis etilgan.
                    </p>
                    <p className="text-gray-800 text-base lg:text-lg leading-relaxed">
                      2024-yil 11-sentyabrda Oʻzbekiston Respublikasi Prezidenti Administratsiya huzuridagi Ommaviy axborot kommunikatsiyalar agentligi tomonidan institut jurnalini <span className="font-bold text-[#0d4ea3]">"Maktab taʻlimi: muammolar, izlanishlar, yechimlar"</span> nomiga oʻzgarganligi haqida Ommaviy Axborot vositasi davlat roʻyxatidan oʻtkazilganligi toʻg'risidagi <span className="font-bold text-blue-700">№ 392864 raqamli guvohnoma</span>, shuningdek, 2024-yil 10-iyun sanasida Oʻzbekiston Respublikasi Milliy kutubxonasi tomonidan <span className="font-bold">373.3/.5 UO'K indeksi</span>, 2024-yil 13-sentyabrda "Maktab taʻlimi: muammolar, izlanishlar, yechimlar" jurnali uchun <span className="font-bold text-blue-700">3060-4788 raqamli ISSN</span> olindi. Jurnal O'zbekiston Respublikasi Oliy attestatsiya komissiyasining pedagogik texnologiyalar va psixologik tadqiqotlar bo'yicha ekspert kengashi tavsiyasi (29.10.2024-y., №10); OAK tartib qoida komissiya qarori (30.10.2024-y., № 10/24); OAK Rayosatining qarori (31.10.2024-y.,) №363/5)ga ko'ra <span className="font-bold text-green-700">"Oliy attestatsiya komissiyasining dissertatsiyalar asosiy ilmiy natijalarini chop etish tavsiya etilgan ilmiy nashrlar ro'yxati"ga kiritildi.</span>
                    </p>
                  </div>
                </div>

                {/* Download Button */}
                <a
                  href={magazine.pdfUrl}
                  download
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  <FaFilePdf size={24} />
                  <span>Jurnalni yuklab olish (PDF)</span>
                  <FaDownload size={18} />
                </a>

                {/* Additional Info */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">
                    Qo'shimcha ma'lumot
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>ISSN: 2181-9483 (Print) / 2181-9491 (Online)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>
                        Nashr davomiyiligi: Choraklik (3 oyda bir marta)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Til: O'zbek, Rus, Ingliz</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Format: PDF, A4 (210x297 mm)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default MagazineDetail;
