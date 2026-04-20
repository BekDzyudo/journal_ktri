import React, { useContext, useRef, useState, useEffect } from "react";
import { useGlobalContext } from "../../../hooks/useGlobalContext";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { login } from "../../../components/authentication/auth";
import { toast } from "react-toastify";

function Login() {
  const { theme } = useGlobalContext();
  const email = useRef();
  const password = useRef();
  const regLoginForm = useRef();
  const navigate = useNavigate();
  const { login: handleLogin } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedRemember = localStorage.getItem("rememberMe");
    if (savedEmail && savedRemember === "true") {
      email.current.value = savedEmail;
      setRememberMe(true);
    }
  }, []);

  const addData = async (e) => {
    e.preventDefault();
    
    const dataObj = {
      email: email.current.value,
      password: password.current.value,
    };

    const errorArr = Object.keys(dataObj).filter((key) => !dataObj[key]);

    errorArr.forEach((item) => {
      document.getElementById(item).classList.add("border-red-600");
    });

    Array.from(regLoginForm.current).forEach((item) => {
      item.addEventListener("change", (e) => {
        if (e.target.value) {
          item.classList.remove("border-red-600");
        } else {
          item.classList.add("border-red-600");
        }
      });
    });

    console.log(dataObj);
    if (errorArr.length === 0) {
      const response = await login(dataObj);
      if (response) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", dataObj.email);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberMe");
        }
        handleLogin(response);
        toast.success("Xush kelibsiz");
        navigate("/");
      } else {
        toast.error("Email yoki Parol noto'g'ri");
      }
    }
  };

  return (
    <section className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B2B4E] relative overflow-hidden items-center justify-center p-12">
        {/* Network Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="#FDB913" opacity="0.3" />
                <circle cx="90" cy="30" r="2" fill="#FDB913" opacity="0.3" />
                <circle cx="50" cy="70" r="2" fill="#FDB913" opacity="0.3" />
                <line x1="10" y1="10" x2="90" y2="30" stroke="#FDB913" strokeWidth="1" opacity="0.2" />
                <line x1="90" y1="30" x2="50" y2="70" stroke="#FDB913" strokeWidth="1" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network)" />
          </svg>
        </div>
        
        {/* Logo and Text */}
        <div className="relative z-10 text-center">
          <div className="w-40 h-40 mx-auto mb-8">
            <img src="/new_logo_white.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">
            Kasbiy Ta'limni
          </h1>
          <h2 className="text-[#D4A017] text-3xl font-bold">
            Rivojlantirish Instituti
          </h2>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Xush kelibsiz!</h2>
            <p className="text-sm sm:text-base text-gray-500">Tizimga kirish uchun ma'lumotlaringizni kiriting.</p>
          </div>

          <form ref={regLoginForm} onSubmit={addData} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  ref={email}
                  id="email"
                  name="email"
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  placeholder="kasbiytalim@gmail.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  ref={password}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  placeholder="••••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" 
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
                Meni eslab qol
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 bg-[#0B2B4E] hover:bg-[#0a2442] text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
            >
              Tizimga kirish
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <Link to="/confirm-email" className="text-blue-600 hover:underline">
                Parolni unutdingizmi?
              </Link>
            </div>

            <div className="text-center text-sm text-gray-500 mt-2">
              Hisobingiz yo'qmi?{" "}
              <Link to="/register" className="text-blue-600 hover:underline font-semibold">
                Ro'yxatdan o'ting
              </Link>
            </div>
          </form>

          <div className="mt-6 sm:mt-8 text-center text-xs text-gray-400">
            © 2026 Kasbiy Ta'limni Rivojlantirish Instituti.<br />
            Texnik yordam: <span className="text-gray-600">+998 94 616-33-66</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
