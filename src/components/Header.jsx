import React, { useContext, useEffect, useState } from "react";
import { FaAngleDown, FaAngleRight, FaPaperPlane } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { IoMenu } from "react-icons/io5";
import { useGlobalContext } from "../hooks/useGlobalContext";
import { useHero } from "../context/HeroContext";
import { FiLogIn } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import useGetFetchProfile from "../hooks/useGetFetchProfile";
function Header() {
  const { onHero } = useHero();
  const { pathname } = useLocation();
  
  const { userData, auth, logout } = useContext(AuthContext);
  const { theme, changeTheme } = useGlobalContext();

  const { data: user } = useGetFetchProfile(
    `${import.meta.env.VITE_BASE_URL}/user-data/`
  );

  // Hero stilini qo'llash kerakligini aniqlash (tungi rejim yoki hero ustida)
  const useHeroStyle = theme === "night" || (theme === "light" && onHero);
  
  // Barcha komponentlar uchun yagona stil o'zgaruvchilari
  const logoSrc = "/new_logo_white.png"; // Doim oq logo
  const textColor = "text-white"; // Doim oq matn
  const borderColor = useHeroStyle ? "border-white/30" : "border-white/20";
  
  // Background style - hero ustida transparent, boshqa sahifalarda gradient
  // onHero true bo'lsa (hero bor sahifada) - transparent
  // onHero false bo'lsa (oddiy sahifa, masalan Contact) - gradient
  const bgStyle = onHero 
    ? { background: 'transparent' } 
    : { background: 'linear-gradient(to right, rgba(0, 45, 109, 0.95), rgba(0, 61, 125, 0.95), rgba(0, 45, 109, 0.95))' };

  return (
    <div
      className="shadow-xl py-1 sm:py-2 fixed top-0 left-0 w-full z-30 backdrop-blur-md border-b border-white/10"
      style={bgStyle}
    >
      <div className="navbar gap-2 px-3.5 sm:px-5 mx-auto w-full xl:w-full 2xl:w-11/12 items-center">
        <div className="navbar-start">
          <Link to="/" className="flex gap-2 sm:gap-3 items-center">
           <img
                src={logoSrc}
                alt="logo"
                className="w-12 xl:w-20 sm:w-16"
              />

            <h4
              className={`font-semibold xl:text-[16px] lg:text-[14px] sm:text-[12px] text-[10px] ${textColor}`}
            >
              Kasbiy ta'limni <br />
              rivojlantirish <br />
              instituti
            </h4>
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul
            className={`menu lg:menu-horizontal 2xl:gap-3 lg:text-[12px] border rounded-xl xl:text-[16px] ${borderColor}`}
          >
            <li>
              <Link
                to="/"
                className={textColor}
              >
                Biz haqimizda
              </Link>
            </li>
            <li>
              <Link
                to="/leadership"
                className={textColor}
              >
                Tahririyat
              </Link>
            </li>
            <li>
              <Link
                to="/announcements"
                className={textColor}
              >
                E'lonlar
              </Link>
            </li>
            <li>
              <Link
                to="/magazines"
                className={textColor}
              >
                Nashrlar
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={textColor}
              >
                Biz bilan bog'laning
              </Link>
            </li>
           
          </ul>
        </div>
        <div className="navbar-end 2xl:gap-4 xl:gap-2 gap-2">
          <Link to="/send-article" className="group relative cursor-pointer bg-white/95 hover:bg-white text-blue-700 hover:text-blue-800 font-bold py-2 sm:py-3 px-4 xl:px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 border-2 border-white/50 hover:border-white backdrop-blur-sm">
            <FaPaperPlane className="text-sm xl:text-base group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xs xl:text-sm whitespace-nowrap">Maqola berish</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Header;
