import React, { useState } from 'react'
import { IoMailUnreadOutline } from "react-icons/io5";
import { PiTelegramLogoLight } from "react-icons/pi";
import { GrLanguage } from "react-icons/gr";
import { FaPhone, FaFacebookF, FaInstagram, FaYoutube, FaTwitter, FaMapMarkerAlt } from "react-icons/fa";
import { HiOutlineExternalLink } from "react-icons/hi";
import { Link } from 'react-router-dom';
import { useGlobalContext } from '../hooks/useGlobalContext';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { institutLinks } from '../constants/institutLinks';
import "swiper/css";

function Footer() {
    const {theme} = useGlobalContext()
    const [swiperInstance, setSwiperInstance] = useState(null)
    
    const usefulLinks = [
      { title: "O'zbekiston Respublikasi Prezidenti rasmiy veb-sayti", url: "https://president.uz/uz", logo: "/gerb.png", domen: "president.uz" },
      { title: "Oliy ta'lim, fan va innovatsiyalar vazirligi", url: "https://gov.uz/oz/edu", logo: "/oliytalimvazirligi.png", domen: "gov.uz" },
      { title: "Kasbiy ta'lim agentligi", url: "https://gov.uz/oz/kasbiytalim", logo: "/gerb.png", domen: "gov.uz" },
      { title: "Yagona interaktiv davlat xizmatlari portali", url: "https://my.gov.uz/uz", logo: "/mygov.png", domen: "my.gov.uz" },
      { title: "Qonunchilik ma'lumotlari milliy bazasi", url: "https://lex.uz/", logo: "/lex_uz.svg", domen: "lex.uz" },
    ];
    
  return (
    <div className="bg-linear-to-r from-[#002d6d] via-[#003d7d] to-[#002d6d] w-full py-5 px-5 relative">
      
      {/* Foydali havolalar carousel - yarmi header ustida */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 w-full xl:w-full 2xl:w-11/12 px-5"
        onMouseEnter={() => swiperInstance?.autoplay?.stop()}
        onMouseLeave={() => swiperInstance?.autoplay?.start()}
      >
        <div className="bg-slate-200 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-8">          
          <Swiper
            modules={[Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            loop={true}
            speed={800}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
              1440: { slidesPerView: 4, spaceBetween: 24 },
            }}
            onSwiper={setSwiperInstance}
            className="useful-links-swiper"
          >
            {usefulLinks.map((link, index) => (
              <SwiperSlide key={index}>
                <Link 
                  to={link.url} 
                  target="_blank"
                  className="group block rounded-xl p-4 h-full"
                >
                  <div className="flex items-start gap-7 h-full">
                    {link.logo && (
                      <div className="w-20 h-20 flex items-center justify-center shrink-0">
                        <img 
                          src={link.logo} 
                          alt={link.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className='flex flex-col gap-1 items-center'>
                      <h4 className="font-semibold text-center text-gray-800 group-hover:text-[#002d6d] transition-colors text-sm sm:text-base">
                      {link.title}
                    </h4>
                      <span className="text-blue-600 hover:link px-4 py-2 flex items-center gap-2">
                        {link.domen}
                        <HiOutlineExternalLink className="text-lg" />
                      </span>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Footer Content - 24 yoki 28 qo'shdim bo'shliq uchun */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 pb-8 pt-24 md:pt-32">
        
        {/* Institut haqida */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/new_logo_white.png"
              alt="logo"
              className="w-16 sm:w-20"
            />
            <h4 className="font-bold text-base sm:text-lg text-white">
              Kasbiy ta'limni <br />
              rivojlantirish <br />
              instituti
            </h4>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Kasbiy ta'lim sohasida sifatli ta'lim xizmatlarini taqdim etish va mutaxassislar malakasini oshirish.
          </p>
        </div>

        {/* Tez havolalar */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold text-lg text-cyan-400 mb-2">Havolalar</h4>
          <ul className="flex flex-col gap-2">
            {institutLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/80 hover:text-cyan-300 hover:translate-x-1 transition-all inline-block">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/news" className="text-sm text-white/80 hover:text-cyan-300 hover:translate-x-1 transition-all inline-block">
                Yangiliklar
              </Link>
            </li>
            <li>
              <Link to="/digital-educational-resources" className="text-sm text-white/80 hover:text-cyan-300 hover:translate-x-1 transition-all inline-block">
                Raqamli ta'lim resurslari
              </Link>
            </li>
            <li>
              <Link to="/methodological-support" className="text-sm text-white/80 hover:text-cyan-300 hover:translate-x-1 transition-all inline-block">
                Metodik ta'minot
              </Link>
            </li>
          </ul>
        </div>

        {/* Aloqa ma'lumotlari */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold text-lg text-cyan-400 mb-2">Aloqa</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <FaPhone className="text-cyan-400 text-lg mt-1 shrink-0" />
              <div>
                <p className="text-xs text-white/60">Telefon</p>
                <a href="tel:+998712469037" className="text-sm text-white hover:text-cyan-300 transition-colors">
                  +998 91 601 72 22
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IoMailUnreadOutline className="text-cyan-400 text-lg mt-1 shrink-0" />
              <div>
                <p className="text-xs text-white/60">Email</p>
                <a href="mailto:kasbiytalim@edu.uz" className="text-sm text-white hover:text-cyan-300 transition-colors">
                  kasbiytalim@edu.uz
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-cyan-400 text-lg mt-1 shrink-0" />
              <div>
                <p className="text-xs text-white/60">Manzil</p>
                <Link to="https://yandex.uz/maps/org/81589415292/?ll=69.211024%2C41.353626&z=16" target='_blank' className="text-sm text-white/80">
                  Toshkent shahar, Olmazor tumani, Talabalar ko'chasi, 96-uy
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Ijtimoiy tarmoqlar va havolalar */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold text-lg text-cyan-400 mb-2">Ijtimoiy tarmoqlar</h4>
          <div className="flex gap-3 mb-4">
            <Link 
              to="https://t.me/ipi_uz" 
              target="_blank"
              className="w-10 h-10 bg-white/10 hover:bg-cyan-400 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <PiTelegramLogoLight className="text-white text-xl" />
            </Link>
            {/* <Link 
              to="#" 
              target="_blank"
              className="w-10 h-10 bg-white/10 hover:bg-cyan-400 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <FaFacebookF className="text-white text-lg" />
            </Link> */}
            <Link 
              to="https://www.instagram.com/ktri_official/" 
              target="_blank"
              className="w-10 h-10 bg-white/10 hover:bg-cyan-400 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <FaInstagram className="text-white text-xl" />
            </Link>
            <Link 
              to="https://www.youtube.com/c/Pedagogikinnovatsiyalarinstituti" 
              target="_blank"
              className="w-10 h-10 bg-white/10 hover:bg-cyan-400 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <FaYoutube className="text-white text-xl" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <GrLanguage className="text-cyan-400 text-lg" />
              <p className="text-xs text-white/60">Rasmiy web-sayt</p>
            </div>
            <Link 
              to="https://ipitvet.uz/uz/" 
              target="_blank"
              className="text-sm text-white hover:text-cyan-300 transition-colors flex items-center gap-2"
            >
              https://ipitvet.uz/
              <HiOutlineExternalLink className="text-base" />
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/20 pt-4 px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12">
        <p className="text-center text-xs sm:text-sm text-white/70">
          © {new Date().getFullYear()} Kasbiy ta'limni rivojlantirish instituti. Barcha huquqlar himoyalangan.
        </p>
        <p className="text-center text-xs text-white/60 mt-2">
          Saytdan olingan barcha ma'lumotlar chop etilganda veb-saytga havola qilish majburiy
        </p>
      </div>
    </div>
  )
}

export default Footer