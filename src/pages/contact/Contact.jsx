import React, { useState, useEffect } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebookF,
  FaInstagram,
  FaTelegramPlane,
  FaYoutube,
  FaUser,
  FaPaperPlane,
  FaCalendarAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useHero } from "../../context/HeroContext";
import SEO from "../../components/SEO";

function Contact() {
  const { setOnHero } = useHero();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  // Real-time kalendar
  const [currentTime, setCurrentTime] = useState(new Date());

  // Hero holatini false qilish (bu sahifada hero yo'q)
  useEffect(() => {
    setOnHero(false);
    return () => setOnHero(false);
  }, [setOnHero]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sana va vaqt formatlash
  const formatDate = (date) => {
    const days = [
      "Yakshanba",
      "Dushanba",
      "Seshanba",
      "Chorshanba",
      "Payshanba",
      "Juma",
      "Shanba",
    ];
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

    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
      hours: String(date.getHours()).padStart(2, "0"),
      minutes: String(date.getMinutes()).padStart(2, "0"),
      seconds: String(date.getSeconds()).padStart(2, "0"),
    };
  };

  const dateTime = formatDate(currentTime);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Telefon raqam validatsiyasi
  const validatePhone = (phone) => {
    // O'zbekiston telefon raqami formati: +998XXXXXXXXX yoki 998XXXXXXXXX
    const phoneRegex = /^(\+?998)?([0-9]{9})$/;
    // Faqat raqamlar va + belgisini qoldirish
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");
    return phoneRegex.test(cleanedPhone);
  };

  // Formani validatsiya qilish
  const validateForm = () => {
    // Bo'sh maydonlarni tekshirish
    if (!formData.name.trim()) {
      setSubmitMessage({
        type: "error",
        text: "Iltimos, ism va familiyangizni kiriting!",
      });
      return false;
    }

    if (!formData.email.trim()) {
      setSubmitMessage({
        type: "error",
        text: "Iltimos, email manzilingizni kiriting!",
      });
      return false;
    }

    if (!formData.subject.trim()) {
      setSubmitMessage({
        type: "error",
        text: "Iltimos, xabar mavzusini kiriting!",
      });
      return false;
    }

    if (!formData.message.trim()) {
      setSubmitMessage({
        type: "error",
        text: "Iltimos, xabar matnini kiriting!",
      });
      return false;
    }

    // Telefon raqam to'g'riligini tekshirish
    if (!formData.phone || !formData.phone.trim()) {
      setSubmitMessage({
        type: "error",
        text: "Iltimos, telefon raqamingizni kiriting!",
      });
      return false;
    }

    if (!validatePhone(formData.phone)) {
      setSubmitMessage({
        type: "error",
        text: "Telefon raqami noto'g'ri formatda! Masalan: +998901234567",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validatsiyadan o'tkazish
    if (!validateForm()) {
      // Xatolik xabari 5 soniyadan keyin o'chadi
      setTimeout(() => setSubmitMessage(null), 5000);
      return;
    }

    setIsSubmitting(true);

    try {
      // API ga ma'lumotlarni yuborish
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/murojaat/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            telefon: formData.phone.trim(),
            subject: formData.subject.trim(),
            message: formData.message.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server xatosi: ${response.status}`);
      }

      const result = await response.json();

      setSubmitMessage({
        type: "success",
        text: "Xabaringiz muvaffaqiyatli yuborildi! Tez orada siz bilan bog'lanamiz.",
      });
      setIsSubmitting(false);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });

      // Clear message after 5 seconds
      setTimeout(() => setSubmitMessage(null), 7000);
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "Xabar yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
      });
      setIsSubmitting(false);

      // Clear error message after 5 seconds
      setTimeout(() => setSubmitMessage(null), 7000);
    }
  };

  return (
    <>
      <SEO 
        title="Aloqa"
        description="Kasb-hunar ta'limi markazi bilan bog'lanish: telefon, email, manzil va ijtimoiy tarmoqlar. Onlayn xabar yuborish formasi mavjud"
        keywords="aloqa, kontakt, telefon, email, manzil, murojaat, xabar yuborish"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 mt-2 pt-25 lg:pt-35 pb-25 md:pb-35">
        {/* Hero Section */}
        <div 
          className="relative text-white py-10 sm:py-20 rounded-xl overflow-hidden max-w-7xl mx-auto bg-gradient-to-br from-[#194882] to-info"
          // style={{
          //   background: 'linear-gradient(to right, #002d6d, #003d7d, #002d6d)'
          // }}
        >
          <div className="px-4 sm:px-6">
            <div className="text-center">
              <h1 className="text-2xl font-serif sm:text-4xl lg:text-5xl font-bold mb-4 font-serif">
                Biz bilan bog‘laning
              </h1>
              <p className="text-base sm:text-xl text-blue-100 max-w-2xl mx-auto">
                Sizning fikr va takliflaringiz biz uchun muhim. Biz bilan
                bog'lanishning turli usullaridan foydalaning.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-8">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-3 space-y-6">
              {/* Contact Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Address Card */}
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 border-t-4 border-blue-600 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <FaMapMarkerAlt className="text-2xl text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Manzil
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                       Toshkent shahar, Olmazor tumani, Talabalar ko‘chasi, 96-uy
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 border-t-4 border-green-600 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-4 rounded-full">
                      <FaPhone className="text-2xl text-green-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Telefon
                      </h3>
                      <a
                        href="tel:+998712024515"
                        className="text-gray-600 hover:text-green-700 transition-colors block mb-1"
                      >
                        +998 (71) 246-90-37
                      </a>
                      <a
                        href="tel:+998712024516"
                        className="text-gray-600 hover:text-green-700 transition-colors block"
                      >
                        +998 (90) 091 30 99
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email Card */}
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 border-t-4 border-purple-600 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 p-4 rounded-full">
                      <FaEnvelope className="text-2xl text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Email
                      </h3>
                      <a
                        href="mailto:info@profedu.uz"
                        className="text-gray-600 hover:text-purple-700 transition-colors block mb-1"
                      >
                        info@edu.uz
                      </a>
                      <a
                        href="mailto:kasbiytalim@profedu.uz"
                        className="text-gray-600 hover:text-purple-700 transition-colors block"
                      >
                        kasbiytalim@edu.uz
                      </a>
                    </div>
                  </div>
                </div>

                {/* Working Hours Card */}
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 border-t-4 border-orange-600 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 p-4 rounded-full">
                      <FaClock className="text-2xl text-orange-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Ish vaqti
                      </h3>
                      <p className="text-gray-600">
                        <span className="font-semibold">Dushanba - Juma:</span>
                        <br />
                        09:00 - 18:00
                      </p>
                      <p className="text-gray-600 mt-2">
                        <span className="font-semibold">
                          Shanba - Yakshanba:
                        </span>
                        <br />
                        Dam olish kuni
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 border-t-4 border-blue-700">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 font-serif">
                    Xabar yuborish
                  </h2>
                  <p className="text-gray-600">
                    Quyidagi formani to'ldiring va biz tez orada siz bilan
                    bog'lanamiz
                  </p>
                </div>

                {submitMessage && (
                  <div
                    className={`mb-6 p-4 rounded-lg ${
                      submitMessage.type === "success"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    {submitMessage.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Ism va Familiya <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaUser className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="Ismingizni kiriting"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaEnvelope className="text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Telefon raqami <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="+998 90 123 45 67"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Mavzu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Xabar mavzusi"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Xabar matni <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Xabaringizni bu yerga yozing..."
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer w-full sm:w-auto px-8 py-4 text-white font-bold rounded-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-gradient-to-br from-[#194882] to-info"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Xabar yuborish
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar - Right Side */}
            <div className="lg:col-span-1 space-y-6">
              {/* Social Media Card */}
              <div 
                className="rounded-2xl shadow-lg p-6 text-white sticky top-24 bg-gradient-to-br from-[#194882] to-info"
                // style={{
                //   background: 'linear-gradient(to bottom right, #002d6d, #003d7d)'
                // }}
              >
                <h3 className="text-lg font-bold mb-4">Ijtimoiy tarmoqlar</h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white hover:text-blue-700 p-3 rounded-lg transition-all duration-300 hover:scale-110"
                  >
                    <FaFacebookF className="text-xl" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white hover:text-pink-600 p-3 rounded-lg transition-all duration-300 hover:scale-110"
                  >
                    <FaInstagram className="text-xl" />
                  </a>
                  <a
                    href="https://t.me/Journal_KTRI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white hover:text-blue-500 p-3 rounded-lg transition-all duration-300 hover:scale-110"
                  >
                    <FaTelegramPlane className="text-xl" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white hover:text-red-600 p-3 rounded-lg transition-all duration-300 hover:scale-110"
                  >
                    <FaYoutube className="text-xl" />
                  </a>
                </div>
              </div>

              {/* Real-time Calendar Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 sticky top-24 lg:top-28">
                <div 
                  className="p-6 bg-gradient-to-br from-[#194882] to-info"
                  // style={{
                  //   background: 'linear-gradient(to bottom right, #002d6d, #003d7d)'
                  // }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <FaCalendarAlt className="text-yellow-400 text-2xl" />
                    <h3 className="text-white font-bold text-xl">Kalendar</h3>
                  </div>

                  {/* Vaqt - katta raqamlar */}
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-5xl font-bold text-white tabular-nums">
                        {dateTime.hours}
                      </span>
                      <span className="text-5xl font-bold text-white animate-pulse">
                        :
                      </span>
                      <span className="text-5xl font-bold text-white tabular-nums">
                        {dateTime.minutes}
                      </span>
                    </div>
                    <div className="text-blue-200 text-xl font-medium mt-2 tabular-nums">
                      {dateTime.seconds} soniya
                    </div>
                  </div>

                  {/* Sana */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-blue-100 font-semibold text-base mb-2">
                        {dateTime.day}
                      </p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-white font-bold text-3xl">
                          {dateTime.date}
                        </span>
                        <span className="text-white font-semibold text-xl">
                          {dateTime.month}
                        </span>
                      </div>
                      <p className="text-blue-200 text-lg font-medium mt-2">
                        {dateTime.year}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Maps - Full Width Below */}
        <div className="max-w-7xl mx-auto bg-white border-t-4 border-blue-700">
          <div className="w-full">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-slate-50">
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-serif">
                Bizning joylashuv
              </h3>
              <p className="text-gray-600">
                Toshkent shahar, Olmazor tumani, Talabalar ko‘chasi, 96-uy
              </p>
            </div>
          </div>
          <div className="w-full h-96 relative">
            <iframe
              src="https://yandex.uz/map-widget/v1/?ll=69.211024%2C41.353626&z=16&l=map&pt=69.211024,41.353626,pm2rdl"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              title="Institut joylashuvi"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default Contact;
