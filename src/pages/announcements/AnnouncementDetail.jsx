import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaCalendar,
  FaEye,
  FaArrowLeft,
  FaShareAlt,
  FaClock,
  FaTags,
  FaUser,
} from "react-icons/fa";
import { useHero } from "../../context/HeroContext";
import SEO from "../../components/SEO";
import useGetFetch from "../../hooks/useGetFetch";

function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setOnHero } = useHero();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  // Mock data - keyinchalik API dan olinadi
  // const announcementsData = [
  //   {
  //     id: 1,
  //     title: "2024-yil uchun ilmiy maqolalar qabul qilinmoqda",
  //     image: "/elonjurnal.png",
  //     date: "2024-01-15",
  //     views: 1250,
  //     author: "Jurnal tahririyati",
  //     category: "Maqolalar",
  //     readTime: "3 daqiqa",
  //     content: `
  //       <p class="mb-4">Hurmatli olim va tadqiqotchilar!</p>
        
  //       <p class="mb-4">Kasbiy ta'limni rivojlantirish instituti ilmiy jurnali 2024-yil uchun ilmiy maqolalar qabul qilishni boshladi. Jurnal kasbiy ta'lim, pedagogika va tarbiya sohalari bo'yicha tadqiqotlar olib borayotgan olimlar uchun o'z ishlarini e'lon qilish imkoniyatini taqdim etadi.</p>

  //       <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Maqola yuborish talablari:</h3>
  //       <ul class="list-disc list-inside mb-4 space-y-2">
  //         <li>Maqola hajmi kamida 8 betdan iborat bo'lishi kerak</li>
  //         <li>Maqola ilmiy uslubda yozilgan bo'lishi lozim</li>
  //         <li>Annotatsiya 3 tilda (o'zbek, rus, ingliz) taqdim etilishi kerak</li>
  //         <li>Kalit so'zlar kamida 5 ta bo'lishi kerak</li>
  //         <li>Adabiyotlar ro'yxati kamida 15 ta manba bo'lishi lozim</li>
  //         <li>Maqolada plagiat bo'lmasligi shart</li>
  //       </ul>

  //       <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Maqola yuborish jarayoni:</h3>
  //       <ol class="list-decimal list-inside mb-4 space-y-2">
  //         <li>Maqolani jurnal formatida tayyorlang</li>
  //         <li>Barcha zarur hujjatlarni to'plang</li>
  //         <li>Onlayn tizim orqali yuboring</li>
  //         <li>Tahrirlovchilar tomonidan ko'rib chiqilishini kuting</li>
  //         <li>Tuzatishlar kiritish bo'yicha takliflarni bajaring</li>
  //         <li>Oxirgi variant tasdiqlanishini kuting</li>
  //       </ol>

  //       <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Muhim sanalar:</h3>
  //       <ul class="list-disc list-inside mb-4 space-y-2">
  //         <li><strong>Maqola qabul qilish muddati:</strong> 2024-yil 15-mart</li>
  //         <li><strong>Ko'rib chiqish muddati:</strong> 2024-yil 30-mart</li>
  //         <li><strong>Nashr etilish sanasi:</strong> 2024-yil 15-aprel</li>
  //       </ul>

  //       <p class="mb-4 mt-6">Maqolangizni yuborish uchun "Maqola berish" bo'limiga o'ting yoki quyidagi elektron pochta manzilga yuboring: <a href="mailto:jurnal@ktri.uz" class="text-blue-600 hover:underline font-semibold">jurnal@ktri.uz</a></p>

  //       <div class="bg-blue-50 border-l-4 border-blue-600 p-4 mt-6 rounded-r-lg">
  //         <p class="text-blue-800 font-semibold">Eslatma:</p>
  //         <p class="text-blue-700">Barcha maqolalar ilmiy ekspertiza jarayonidan o'tkaziladi. Faqat yuqori sifatli va asl tadqiqot natijalarini aks ettiruvchi maqolalar nashr etiladi.</p>
  //       </div>
  //     `,
  //   },
  //   {
  //     id: 2,
  //     title: "Kasbiy ta'lim sohasida ilmiy konferensiya e'lon qilinadi",
  //     image: "/elonjurnal.png",
  //     date: "2024-01-10",
  //     views: 890,
  //     author: "Konferensiya qo'mitasi",
  //     category: "Tadbirlar",
  //     readTime: "4 daqiqa",
  //     content: `
  //       <p class="mb-4">Hurmatli olimlar va pedagog-tadqiqotchilar!</p>
        
  //       <p class="mb-4">Kasbiy ta'limni rivojlantirish instituti 2024-yil may oyida respublikamizda kasbiy ta'lim sohasida xalqaro ilmiy-amaliy konferensiya o'tkazishni e'lon qiladi.</p>

  //       <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Konferensiya yo'nalishlari:</h3>
  //       <ul class="list-disc list-inside mb-4 space-y-2">
  //         <li>Kasbiy ta'limning zamonaviy tendensiyalari</li>
  //         <li>Pedagogik texnologiyalar va innovatsiyalar</li>
  //         <li>O'qituvchilar malakasini oshirish metodikasi</li>
  //         <li>Raqamli ta'lim texnologiyalari</li>
  //         <li>Ta'lim sifatini baholash mezonlari</li>
  //         <li>Xalqaro tajribalar va hamkorlik</li>
  //       </ul>

  //       <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Ishtirok etish tartibi:</h3>
  //       <ol class="list-decimal list-inside mb-4 space-y-2">
  //         <li>Ro'yxatdan o'ting</li>
  //         <li>Tezis yuboring (1-2 bet)</li>
  //         <li>Tasdiq xatini kuting</li>
  //         <li>To'lovni amalga oshiring</li>
  //         <li>To'liq maqola yuboriladi (konferensiyadan keyin)</li>
  //       </ol>

  //       <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Konferensiya ma'lumotlari:</h3>
  //       <ul class="list-disc list-inside mb-4 space-y-2">
  //         <li><strong>Sana:</strong> 2024-yil 15-16 may</li>
  //         <li><strong>Manzil:</strong> Toshkent shahar, KTRI binosi</li>
  //         <li><strong>Format:</strong> Gibrid (jonli va onlayn)</li>
  //         <li><strong>Ishtirok haqi:</strong> 200,000 so'm</li>
  //       </ul>

  //       <div class="bg-green-50 border-l-4 border-green-600 p-4 mt-6 rounded-r-lg">
  //         <p class="text-green-800 font-semibold">Afzalliklar:</p>
  //         <p class="text-green-700">Eng yaxshi maqolalar jurnal maxsus sonida bepul nashr etiladi. Ishtirokchilar sertifikat bilan taqdirlanadi.</p>
  //       </div>
  //     `,
  //   },
  //   {
  //     id: 3,
  //     title: "Yangi jurnal soni nashr etildi - 2024 yil, 1-son",
  //     image: "/elonjurnal.png",
  //     date: "2024-01-05",
  //     views: 2340,
  //     author: "Bosh muharrir",
  //     category: "Yangiliklar",
  //     readTime: "2 daqiqa",
  //     content: `
  //       <p class="mb-4">Hurmatli o'quvchilar!</p>
        
  //       <p class="mb-4">Kasbiy ta'limni rivojlantirish instituti ilmiy jurnalining 2024-yil 1-soni nashr etildi. Ushbu sonda kasbiy ta'lim va pedagogika sohasidagi eng so'nggi tadqiqotlar natijalari e'lon qilingan.</p>

  //       <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Jurnal tarkibi:</h3>
  //       <ul class="list-disc list-inside mb-4 space-y-2">
  //         <li>Kasbiy ta'lim tizimini takomillashtirish yo'llari - 8 ta maqola</li>
  //         <li>Pedagogik texnologiyalar - 6 ta maqola</li>
  //         <li>Ta'lim sifatini baholash - 5 ta maqola</li>
  //         <li>O'qituvchilar malakasi - 4 ta maqola</li>
  //         <li>Xalqaro tajribalar - 3 ta maqola</li>
  //       </ul>

  //       <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Asosiy maqolalar:</h3>
  //       <ol class="list-decimal list-inside mb-4 space-y-2">
  //         <li>"Zamonaviy kasbiy ta'limda raqamli texnologiyalar" - Prof. A.Karimov</li>
  //         <li>"Pedagogik kompetensiyalarni baholash modeli" - Dots. S.Rashidova</li>
  //         <li>"Amaliy mashg'ulotlarning samaradorligi" - PhD B.Tursunov</li>
  //         <li>"Xalqaro standartlar va milliy tajriba" - Prof. N.Yusupova</li>
  //       </ol>

  //       <p class="mb-4 mt-6">Jurnalni yuklab olish uchun rasmiy veb-saytimizga tashrif buyuring yoki quyidagi elektron pochta orqali buyurtma bering.</p>

  //       <div class="bg-indigo-50 border-l-4 border-indigo-600 p-4 mt-6 rounded-r-lg">
  //         <p class="text-indigo-800 font-semibold">Bepul yuklab olish:</p>
  //         <p class="text-indigo-700">Jurnalning barcha sonlari rasmiy veb-saytda bepul taqdim etiladi. PDF formatda yuklab olishingiz mumkin.</p>
  //       </div>
  //     `,
  //   },
  // ];

     const { data:announcementsData} = useGetFetch(
    `${import.meta.env.VITE_BASE_URL}/elonlar/`,
  );

  const { data:announcement, isPending, error } = useGetFetch(
    `${import.meta.env.VITE_BASE_URL}/elonlar/${id}/`,
  );

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
  const formatViews = (korishlar_soni) => {
    if (korishlar_soni >= 1000) {
      return `${(korishlar_soni / 1000).toFixed(1)}k`;
    }
    return korishlar_soni?.toString();
  };

  // Ulashish funksiyasi
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: announcement?.sarlavha,
          text: announcement?.sarlavha,
          url: window.location.href,
        })
        .catch((error) => console.log("Ulashishda xato:", error));
    } else {
      // Fallback: URL ni clipboard ga nusxalash
      navigator.clipboard.writeText(window.location.href);
      alert("Havola nusxalandi!");
    }
  };

  if (isPending) {
    return (
      <section className="relative min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO
        title={`${announcement?.sarlavha} - KTRI`}
        description={announcement?.sarlavha}
        keywords={`e'lon, KTRI, ilmiy jurnal`}
      />

      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 relative min-h-screen w-full py-16 sm:py-24">
        <div className="px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 mb-16 sm:mb-20">
          {/* Back Button */}
          <Link
            to="/announcements"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8 transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>E'lonlarga qaytish</span>
          </Link>

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Article - Main Content */}
            <article className="flex-1 bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
              {/* Featured Image */}
              <div className="relative h-[700px] overflow-hidden">
                <img
                  src={announcement?.rasm}
                  alt={announcement?.sarlavha}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-6 left-6">
                  <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg">
                    <FaTags size={14} />
                    <span className="font-semibold text-sm">E'lon</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 sm:p-12">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 pb-6 border-b-2 border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaUser size={16} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{announcement?.muallif}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaCalendar size={16} className="text-green-600" />
                    </div>
                    <span className="text-sm font-medium">{formatDate(announcement?.sana)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaEye size={16} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">{formatViews(announcement?.korishlar_soni)} ko'rishlar</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FaClock size={16} className="text-orange-600" />
                    </div>
                    <span className="text-sm font-medium">{announcement?.oqish_vaqti}</span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 leading-tight">
                  {announcement?.sarlavha}
                </h1>

                {/* Article Content */}
                <div
                  className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: announcement?.matn }}
                />

                {/* Share Button */}
                <div className="mt-12 pt-8 border-t-2 border-gray-100">
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <FaShareAlt size={18} />
                    <span>Ulashish</span>
                  </button>
                </div>
              </div>
            </article>

            {/* Sidebar - Related Articles */}
            <aside className="w-full lg:w-96 shrink-0">
              <div className="sticky top-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Boshqa e'lonlar</h2>
                <div className="space-y-4">
                  {announcementsData && announcementsData
                    .filter((item) => item.id !== announcement.id)
                    .slice(0, 5)
                    .map((item) => (
                      <Link
                        key={item.id}
                        to={`/announcements/${item.id}`}
                        className="group bg-white rounded-xl shadow-lg hover:shadow-xl border-2 border-gray-100 hover:border-blue-500 transition-all duration-300 overflow-hidden block"
                      >
                        <div className="flex gap-4 p-4">
                          <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-lg">
                            <img
                              src={item.rasm}
                              alt={item.sarlavha}
                              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                              {item.sarlavha}
                            </h3>
                            <div className="flex flex-col gap-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <FaCalendar size={10} />
                                {formatDate(item.sana)}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaEye size={10} />
                                {formatViews(item.korishlar_soni)} ko'rishlar
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

export default AnnouncementDetail;
