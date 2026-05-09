import React, { useContext, useEffect, useState, useRef } from "react";
import { FaAngleDown, FaAngleRight, FaPaperPlane, FaUser, FaSignOutAlt, FaUserCog } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoMenu } from "react-icons/io5";
import { useGlobalContext } from "../hooks/useGlobalContext";
import { useHero } from "../context/HeroContext";
import { FiLogIn } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
function Header() {
  const { onHero } = useHero();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  const { userData, auth, logout } = useContext(AuthContext);
  const { theme, changeTheme } = useGlobalContext();
  const displayName =
    userData?.first_name ||
    userData?.ism ||
    userData?.email ||
    "Foydalanuvchi";
  const fullName = [userData?.first_name || userData?.ism, userData?.last_name || userData?.familiya]
    .filter(Boolean)
    .join(" ");

  // Dropdown tashqarisiga bosilganda yopish
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      className="shadow-xl py-1 sm:py-2 fixed top-0 left-0 w-full z-[60] backdrop-blur-md border-b border-white/10"
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

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl ${textColor} border ${borderColor} hover:bg-white/10 transition-all duration-300 cursor-pointer`}
            >
              <FaUser className="text-sm xl:text-base" />
              <span className="hidden lg:inline text-xs xl:text-sm">
                {auth ? displayName : "Kirish"}
              </span>
              <FaAngleDown className={`text-xs xl:text-sm transition-transform duration-300 ${userDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[100]">
                {auth ? (
                  <>
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-800">{fullName || displayName}</p>
                      {userData?.email && <p className="text-xs text-gray-600">{userData.email}</p>}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-gray-700"
                    >
                      <FaUserCog className="text-blue-600" />
                      <span className="text-sm">Admin Panel</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-red-600 border-t border-gray-200"
                    >
                      <FaSignOutAlt />
                      <span className="text-sm">Chiqish</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-gray-700"
                    >
                      <FiLogIn className="text-blue-600" />
                      <span className="text-sm">Kirish</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-gray-700 border-t border-gray-200"
                    >
                      <FaUser className="text-green-600" />
                      <span className="text-sm">Ro'yxatdan o'tish</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden flex items-center px-3 py-2 rounded-xl ${textColor} border ${borderColor} hover:bg-white/10 transition-all duration-300 cursor-pointer`}
          >
            <IoMenu className="text-xl" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="lg:hidden bg-white/95 backdrop-blur-md shadow-xl border-t border-gray-200">
          <ul className="py-2">
            <li>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-6 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200"
              >
                Biz haqimizda
              </Link>
            </li>
            <li>
              <Link
                to="/leadership"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-6 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200"
              >
                Tahririyat
              </Link>
            </li>
            <li>
              <Link
                to="/announcements"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-6 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200"
              >
                E'lonlar
              </Link>
            </li>
            <li>
              <Link
                to="/magazines"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-6 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200"
              >
                Nashrlar
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-6 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200"
              >
                Biz bilan bog'laning
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Header;
