import { useState, useEffect } from "react";
import {
  FaBullseye,
  FaClipboardList,
  FaFolderOpen,
  FaFileContract,
  FaLayerGroup,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaTelegram,
  FaWhatsapp,
  FaShareAlt,
} from "react-icons/fa";
import HomeJurnalHero from "./HomeJurnalHero";
import SEO from "../../components/SEO";
import { Link } from "react-router-dom";
import useRuknlar from "../../hooks/useRuknlar";

function HomeJurnal() {
  const { ruknlar, isPending: ruknlarLoading, error: ruknlarError } = useRuknlar();
  const [activeCard, setActiveCard] = useState(1);
  const [currentDatabaseIndex, setCurrentDatabaseIndex] = useState(0);

  // Xalqaro bazalar ro'yxati
  const internationalDatabases = [
    {
      name: "Google Scholar",
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Scholar_logo.svg",
      bgColor: "from-blue-50 to-blue-100"
    },
    {
      name: "Crossref",
      logo: "https://www.crossref.org/images/logos/crossref-logo-landscape-200.svg",
      bgColor: "from-green-50 to-green-100"
    },
    {
      name: "DOAJ",
      logo: "https://doaj.org/static/doaj/images/doaj_logo.png",
      bgColor: "from-orange-50 to-orange-100"
    },
    {
      name: "ResearchGate",
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/ResearchGate_icon_SVG.svg",
      bgColor: "from-cyan-50 to-cyan-100"
    },
    {
      name: "Academia.edu",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Academia.edu_logo.svg",
      bgColor: "from-purple-50 to-purple-100"
    }
  ];

  // Avtomatik aylanish
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDatabaseIndex((prev) => 
        prev === internationalDatabases.length - 1 ? 0 : prev + 1
      );
    }, 3000); // 3 soniyada bir o'zgaradi

    return () => clearInterval(interval);
  }, [internationalDatabases.length]);

  const navigationCards = [
    {
      id: 1,
      icon: FaBullseye,
      title: "Missiya",
    },
    {
      id: 2,
      icon: FaClipboardList,
      title: "Ko'rib chiqish tartibi",
    },
    {
      id: 3,
      icon: FaFolderOpen,
      title: "Ochiq ma'lumotlar",
    },
    {
      id: 4,
      icon: FaFileContract,
      title: "Nashr qilish shartlari",
    },
    {
      id: 5,
      icon: FaLayerGroup,
      title: "Ruknlar",
    },
  ];

  const renderContent = () => {
    switch (activeCard) {
      case 1:
        return (
          <div className="prose max-w-none">
            <h2 className="text-4xl font-bold text-gray-700 mb-6 font-serif">
              Missiya
            </h2>
            
            <div className="space-y-6 text-gray-800 text-[17px] leading-relaxed">
              <p className="text-justify">
                <span className="font-bold text-gray-900">"Kasbiy ta'lim: muammolar, izlanishlar, yechimlar"</span> jurnali 
                ijtimoiy-gumanitar va boshqa sohalarga mo'ljallangan ixtisoslashgan nashr bo'lib, 
                quyida ko'rsatilgan sohalardagi ilmiy-amaliy innovatsion yangiliklarni har tomonlama yoritish, 
                jurnalxonlarning ta'limiy-ilmiy innovatsion axborotga bo'lgan talab-ehtiyojlarini yanada to'laroq qondirish, 
                jurnal imkoniyatlaridan keng va samarali foydalanishni o'z oldiga asosiy maqsad qilib qo'yadi.
              </p>

              <div className="bg-blue-50 border-l-4 border-info p-5 rounded-r-lg">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Asosiy yo'nalishlar:</h3>
                <ul className="space-y-3 list-none">
                  <li className="flex gap-2">
                    <span className="text-info font-bold mt-1">•</span>
                    <span>Mamlakatda Kasbiy ta'lim va ta'lim uzluksizligi yo'nalishlarida olib borilayotgan islohotlarning mazmun-mohiyatidan, zamonaviy pedagogik texnologiyalarining yaratilishi va ularni keng tatbiq etish borasida amalga oshirilayotgan ishlar haqida</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info font-bold mt-1">•</span>
                    <span>Kasbiy ta'limga oid yagona milliy axborot makonini yaratish hamda umumiy o'rta ta'limning nazariy-amaliy jarayonlariga iqtidorli yoshlar hamda tajribali ustozlarni faol jalb etish</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info font-bold mt-1">•</span>
                    <span>Xalqaro tendensiyalar va ilmiy izlanishlar bilan muvofiqlikni ta'minlash maqsadida Kasbiy ta'limning dolzarb muammolari yuzasidan tizimli asosda amalga oshilayotgan xalqaro ilmiy-tadqiqotlar tahlilini yetkazib borish</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info font-bold mt-1">•</span>
                    <span>Kasbiy ta'lim tizimini rivojlantirishning strategik yo'nalishlari, maqsad va dasturlarini ishlab chiqish hamda amalga oshirishning istiqbolli yo'nalishlarini belgilovchi masalalarni muhokama qilish</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info font-bold mt-1">•</span>
                    <span>Xalqaro baholash tadqiqotlarida yetakchi o'rinni egallab kelayotgan mamlakatlar erishgan ilm-fan, yuqori texnologik yutuqlar hamda O'zbekistonning xalqaro tadqiqotda ishtirok etish natijalari, muammolar, yechimlarini yoritish</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info font-bold mt-1">•</span>
                    <span>Kadrlar tayyorlash, malakasini oshirish, qayta tayyorlash, ta'lim menejmenti, boshqaruvga doir dolzarb muammolar va xalqaro tajriba natijalarini yoritish</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="prose max-w-none">
            <h2 className="text-4xl font-bold text-gray-700 mb-6 font-serif">
              Ko‘rib chiqish tartibi
            </h2>
            
            <div className="space-y-5 text-gray-800 text-[17px] leading-relaxed">
              <p className="font-semibold text-lg text-gray-900">
                "Kasbiy ta'lim: muammolar, izlanishlar, yechimlar" jurnalidagi maqolalarni ko'rib chiqish tartibi:
              </p>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600 text-xl shrink-0">1.</span>
                    <div>
                      <p>Barcha maqolalar <span className="font-bold">plagiat uchun tekshiriladi (originalligi kamida 65%)</span>, tahririyat a'zolari yoki tashqi taqrizchilar tomonidan ko'rib chiqiladi va adabiy muharrir tomonidan korrektoriyadan o'tkaziladi.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600 text-xl shrink-0">2.</span>
                    <p>Maqolani ko'rib chiqish muddati - <span className="font-bold text-info">5 kun</span>.</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600 text-xl shrink-0">3.</span>
                    <div>
                      <p className="mb-2">Tahririyat hay'ati a'zosi yoki tashqi taqrizchi quyidagi masalalarni qamrab oladi:</p>
                      <ul className="list-none space-y-2 ml-4">
                        <li className="flex gap-2"><span className="text-info font-bold">a)</span> Maqola mazmuni sarlavhaga mos keladimi</li>
                        <li className="flex gap-2"><span className="text-info font-bold">b)</span> Zamonaviy yutuqlarga qay darajada mos keladi</li>
                        <li className="flex gap-2"><span className="text-info font-bold">v)</span> Materialning o'quvchilar uchun ochiqligi</li>
                        <li className="flex gap-2"><span className="text-info font-bold">d)</span> Maqolani chop etish maqsadga muvofiqmi</li>
                        <li className="flex gap-2"><span className="text-info font-bold">e)</span> Qanday tuzatishlar kiritish zarurligi</li>
                        <li className="flex gap-2"><span className="text-info font-bold">f)</span> Nashrga tavsiya etiladi yoki tavsiya etilmaydi</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600 text-xl shrink-0">4.</span>
                    <p>Barcha taqrizlar belgilangan tartibda rasmiylashtiriladi.</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600 text-xl shrink-0">5.</span>
                    <p>Agar taqrizda tuzatish bo'yicha tavsiyalar mavjud bo'lsa, muallifga sharhlovchining sharhlari yuboriladi. Qayta ishlangan maqola qayta ko'rib chiqish uchun yuboriladi.</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600 text-xl shrink-0">6.</span>
                    <p>Taqrizchi tomonidan nashrga tavsiya etilmagan hollarda maqola qayta ko'rib chiqishga qabul qilinmaydi. Salbiy xulosa matni muallifga elektron pochta orqali yuboriladi.</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600 text-xl shrink-0">7.</span>
                    <p>Maqolani chop etishga qabul qilgandan so'ng, muallifga nashr to'lovi uchun hisob-faktura beriladi. Elektron pochta orqali to'lov va nashr etish muddati haqida xabar beriladi.</p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <div className="flex gap-3">
                    <span className="font-bold text-green-600 text-xl shrink-0">8.</span>
                    <div>
                      <p className="font-semibold mb-2">Nashr uchun to'lov:</p>
                      <p>Nashr uchun qabul qilingan maqolalar to'lov amalga oshirilgandan so'ng nashr qilinadi. To'lovni amalga oshirib bo'lganingizdan keyin chekni rasm yoki pdf formatida elektron pochtangizga yuborilgan bir martalik havola orqali yuborishingizni so'raymiz.</p>
                      <p className="mt-3 font-bold text-green-700 text-lg">To'lov summasi: 404 120 so'm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="prose max-w-none">
            <h2 className="text-4xl font-bold text-gray-700 mb-6 font-serif">
              Ochiq ma'lumotlar
            </h2>
            
            <div className="space-y-5 text-gray-800 text-[17px] leading-relaxed">
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-bold text-gray-900 text-lg mb-3">
                  Ochiq ma'lumotlar, litsenziyalash va mualliflik huquqi siyosati
                </h3>
                <p className="text-justify">
                  Jurnal <span className="font-bold text-blue-600">DOAJ tamoyillari</span> asosida nashr etilgan bo'lib, 
                  dunyoning istalgan nuqtasida o'zining barcha nashrlariga <span className="font-bold">bepul ochiq kirishni</span> ta'minlab, 
                  Internetga kirish imkoniga ega bo'lib, bugungi dunyo tendensiyalari va talablariga javob beradi – 
                  axborot almashinuvini tezlashtirish imkonini beradi.
                </p>
              </div>

              <p className="text-justify">
                <span className="font-bold text-gray-900">"Kasbiy ta'lim: muammolar, izlanishlar, yechimlar"</span> jurnalida 
                nashr etishga rozilik bildirgan holda, mualliflar o'z maqolalari haqidagi ma'lumotlarni, 
                shu jumladan uning to'liq matnli joylashuvini jurnalning veb-saytida ko'rsatilgan 
                uchinchi tomon manbalariga o'tkazishga rozilik bildiradilar.
              </p>

              <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-gray-900 mb-2">Mualliflar huquqlari:</h4>
                <ul className="list-none space-y-2">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Nashrning havolasini ko'rsatgan holda tarqatish (jumladan, ijtimoiy tarmoqlarda)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Almashish va o'z maqolasiga havola qilish</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="prose max-w-none">
            <h2 className="text-4xl font-bold text-gray-700 mb-6 font-serif">
              Nashr qilish shartlari
            </h2>
            
            <div className="space-y-4 text-gray-800 text-[17px] leading-relaxed">
              {/* Sarlavha */}
              <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-500">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Maqola sarlavhasi</h3>
                    <p>Bosh harfda aniq qilib, <span className="font-bold">o'zbek (lotin grafikasida), rus, ingliz</span> tillarida bo'lishi kerak.</p>
                  </div>
                </div>
              </div>

              {/* Muallif ma'lumoti */}
              <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-purple-500">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Muallif to'g'risida ma'lumot (Author information)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Ismi-sharifi (otasining ismi bilan)</li>
                      <li>Ish joyi va lavozimi</li>
                      <li>Ilmiy darajasi va unvoni</li>
                      <li>Elektron pochta manzili</li>
                      <li>Muloqot telefonlari</li>
                    </ul>
                    <p className="mt-2 text-sm text-purple-700">* Barcha ma'lumotlar 3 tilda: o'zbek, rus, ingliz</p>
                  </div>
                </div>
              </div>

              {/* Annotatsiya va kalit so'zlar */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-green-500">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Annotatsiya (Abstract)</h3>
                      <p>Maqolaning asosiy mazmunini aks ettirishi hamda <span className="font-bold">o'zbek, rus, ingliz</span> tillarida bo'lishi shart.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-amber-500">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Kalit so'zlar (Keywords)</h3>
                      <p>Maqola mazmuni va maqsadini eng qisqa mazmunda ochib beruvchi so'zlar.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Format talablari */}
              <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-indigo-500">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-3">Format talablari:</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p><span className="font-bold">Shrift:</span> Times New Roman</p>
                        <p><span className="font-bold">Kegel:</span> 14</p>
                        <p><span className="font-bold">Qator oralig'i:</span> 1 interval</p>
                      </div>
                      <div>
                        <p><span className="font-bold">Chekkalar:</span> 2 sm (barcha tomondan)</p>
                        <p><span className="font-bold">Maksimal hajm:</span> 16 bet</p>
                        <p><span className="font-bold">Minimal hajm:</span> 8 bet</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adabiyotlar */}
              <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-red-500">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-3">Adabiyotlar ro'yxati</h3>
                    <p className="mb-3">Foydalanilgan barcha adabiyotlarning ro'yxati [1], [2], [3] ketma-ketligida:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Mualliflar ismi-sharifi, kitob nomi, nashr manzili, nashriyot nomi, yili, betlari</li>
                      <li>Mualliflar ismi-sharifi, maqola nomi, jurnal nomi, nashri, yili, soni, betlari</li>
                    </ul>
                    <p className="mt-3 font-bold text-red-700">Ro'yxat hajmi: eng kamida 8-10 ta manba</p>
                  </div>
                </div>
              </div>

              {/* Plagiat tekshiruvi */}
              <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-orange-500">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Plagiat tekshiruvi</h3>
                    <p className="mb-2">Yuborilgan maqolalarning barchasi <span className="font-bold">"Antiplagiat"</span> tizimida tekshiriladi.</p>
                    <p className="font-bold text-orange-700 text-lg">Talab: Originallik kamida 65%</p>
                    <p className="mt-2 text-sm">O'z ishlariga murojaat qilish chegarasi <span className="font-bold">15%dan oshmasligi</span> kerak.</p>
                  </div>
                </div>
              </div>

              {/* To'lov */}
              <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-green-500">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Nashr to'lovi</h3>
                    <p className="mb-3">Nashr uchun qabul qilingan maqolalar to'lov amalga oshirilgandan so'ng nashr qilinadi.</p>
                    <p className="mb-3">To'lovni amalga oshirib bo'lganingizdan keyin chekni <span className="font-bold">rasm yoki PDF formatida</span> elektron pochtangizga yuborilgan bir martalik havola orqali yuborishingizni so'raymiz.</p>
                    <div className="bg-green-50 p-4 rounded-lg mt-3 border-2 border-green-300">
                      <p className="font-bold text-green-700 text-2xl text-center">
                        To'lov summasi: 404 120 so'm
                      </p>
                      <p className="text-center text-gray-600 text-sm mt-1">(to'rt yuz to'rt ming bir yuz yigirma so'm)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="prose max-w-none">
            <h2 className="text-4xl font-bold text-gray-700 mb-6 font-serif">
              Ruknlar
            </h2>

            {ruknlarLoading && (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-info" />
              </div>
            )}
            {ruknlarError && !ruknlarLoading && (
              <p className="text-red-600">
                Ruknlarni yuklashda xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.
              </p>
            )}
            {!ruknlarLoading && !ruknlarError && ruknlar.length === 0 && (
              <p className="text-gray-600">Hozircha ruknlar ro‘yxati bo‘sh.</p>
            )}
            {!ruknlarLoading && !ruknlarError && ruknlar.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {ruknlar.map((r, index) => (
                  <div
                    key={r.id}
                    className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-info hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-info text-2xl shrink-0">
                        {r.kod || String(index + 1)}.
                      </span>
                      <p className="text-gray-800 text-[17px] font-medium pt-1">{r.nom}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SEO
        title="KTRI Ilmiy jurnali - Kasbiy ta'limni rivojlantirish instituti"
        description="Kasbiy ta'lim sohasidagi ilmiy tadqiqotlar, innovatsion yondashuvlar, pedagogik tajribalar va nazariy izlanishlarni o'zida jamlagan ochiq platformamiz. Olimlar, tadqiqotchilar va amaliyotchilar uchun bilim almashish makoni."
        keywords="ilmiy jurnal, kasbiy ta'lim, ilmiy maqolalar, pedagogika, OAK, ilmiy tadqiqot, KTRI, ilmiy nashr, texnika fanlari, iqtisodiyot, psixologiya, ta'lim innovatsiyalari"
      />

      <HomeJurnalHero />
      <section className="relative flex flex-col items-center -mt-10 z-20 mb-25 sm:mb-40">
        <div className="w-full mx-5 xl:max-w-7xl 2xl:max-w-10/12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-5 xl:gap-6 px-3 sm:px-4 shadow-xl rounded-2xl bg-base-100 py-4 sm:py-6 lg:py-8">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            const isActive = card.id === activeCard;
            return (
              <button
                key={card.id}
                onClick={() => setActiveCard(card.id)}
                className={`group cursor-pointer rounded-full flex flex-row gap-2 sm:gap-3 items-center py-1 sm:py-3 px-3 sm:px-4 transition-all duration-300 border ${
                  isActive
                    ? "bg-info text-white shadow-lg border-info"
                    : "bg-slate-50 hover:bg-info hover:text-white hover:shadow-lg border-slate-200 hover:border-info"
                }`}
              >
                <div
                  className={`relative w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                    isActive
                      ? "bg-white/20 border-white"
                      : "bg-white group-hover:bg-white/20 border-info group-hover:border-white"
                  }`}
                >
                  <Icon
                    className={`text-lg sm:text-xl transition-colors duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-info group-hover:text-white"
                    }`}
                  />
                </div>
                <div
                  className={`text-sm w-full text-center sm:text-sm md:text-lg font-semibold transition-colors duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-gray-800 group-hover:text-white"
                  }`}
                >
                  {card.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Content va Sidebar */}
        <div className="w-full mx-5 xl:max-w-7xl 2xl:max-w-10/12 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 px-3 sm:px-4">
        {/* Chap tomon - Content */}
          <div className="lg:col-span-9 bg-white rounded-2xl shadow-md p-6 sm:p-8 h-min">
            {renderContent()}
            
            {/* Content Footer - Social Media & Submit Button */}
            <div className="mt-10 pt-6 border-t-2 border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Social Media Share */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaShareAlt className="text-gray-500" />
                    <span className="text-sm font-semibold">Ulashish:</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                      title="Facebook"
                    >
                      <FaFacebook className="text-lg" />
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}&text=KTRI Ilmiy jurnali`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-sky-500 hover:bg-sky-600 rounded-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                      title="Twitter"
                    >
                      <FaTwitter className="text-lg" />
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                      title="LinkedIn"
                    >
                      <FaLinkedin className="text-lg" />
                    </a>
                    <a
                      href={`https://t.me/share/url?url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}&text=KTRI Ilmiy jurnali`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                      title="Telegram"
                    >
                      <FaTelegram className="text-lg" />
                    </a>
                    <a
                      href={`https://wa.me/?text=${typeof window !== 'undefined' ? encodeURIComponent('KTRI Ilmiy jurnali - ' + window.location.href) : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-md"
                      title="WhatsApp"
                    >
                      <FaWhatsapp className="text-lg" />
                    </a>
                  </div>
                </div>

                {/* Maqola berish button */}
                <Link to="/send-article" className="bg-info hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Maqola berish
                </Link>
              </div>
            </div>
          </div>
          {/* O'ng tomon - Sidebar */}
          <div className="lg:col-span-3 space-y-5">
            {/* Maqola berish */}
            <div className="bg-info rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Maqola berish</h3>
                <p className="text-sm mb-5 text-blue-50 leading-relaxed">
                  Tadqiqot natijalaringizni jurnalimizda nashr qiling
                </p>
                <Link to="send-article" className="w-full bg-white text-info font-bold py-3 px-4 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                  Maqola yuborish
                </Link>
              </div>
            </div>

            {/* Namunaviy shakl */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-100 hover:border-red-300 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                  <FaFileContract className="text-red-500 text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Maqola shabloni
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Maqola rasmiylashtirish uchun tayyorlangan shablon
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-sm transition-colors group"
                  >
                    <svg
                      className="w-5 h-5 group-hover:animate-bounce"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Yuklab olish
                  </a>
                </div>
              </div>
            </div>

            {/* Xalqaro bazalarda indekslanishi */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Xalqaro bazalarda indekslanishi
                </h3>
              </div>
              
              {/* Database Carousel */}
              <div className="relative overflow-hidden rounded-xl">
                <div 
                  className="transition-all duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentDatabaseIndex * 100}%)` }}
                >
                  <div className="flex">
                    {internationalDatabases.map((db, index) => (
                      <div 
                        key={index} 
                        className="w-full flex-shrink-0"
                      >
                        <div className={`bg-gradient-to-br ${db.bgColor} rounded-lg p-6 h-48 flex flex-col items-center justify-center`}>
                          <div className="bg-white rounded-lg p-4 mb-3 shadow-md w-full h-28 flex items-center justify-center">
                            <img 
                              src={db.logo} 
                              alt={db.name}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <div className="text-2xl font-bold text-gray-700 hidden">
                              {db.name}
                            </div>
                          </div>
                          <p className="text-base font-bold text-gray-800 text-center">
                            {db.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {internationalDatabases.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDatabaseIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentDatabaseIndex === index 
                          ? 'w-8 bg-indigo-500' 
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to ${internationalDatabases[index].name}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Guvohnoma */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="block bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100 hover:border-green-300 transition-all duration-300 cursor-pointer hover:shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 flex-1">
                  Guvohnoma
                </h3>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold text-gray-800">O'zbekiston Respublikasi Prezidenti Administratsiyasi</span> huzuridagi Axborot va ommaviy kommunikatsiyalar Agentligining 
                  <span className="font-bold text-green-700"> 2024-yil 11-sentyabrdagi 392864-raqamli</span> guvohnoma berilgan.
                </p>
              </div>
            </a>

            {/* Oliy attestatsya */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="block bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 cursor-pointer hover:shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 flex-1">
                  Oliy attestatsya
                </h3>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold text-gray-800">Oliy attestatsiya komissiyasi Rayosatining</span> 
                  <span className="font-bold text-purple-700"> 2024-yil 30-oktyabrdagi 353/5-son</span> qaroriga asosan 
                  <span className="font-bold text-gray-800">ilmiy nashrlar ro'yxatiga kiritilgan</span>
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomeJurnal;
