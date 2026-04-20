import React, { useRef } from "react";
import { useGlobalContext } from "../../../hooks/useGlobalContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function ConfirmEmail() {
  const { theme } = useGlobalContext();
  const email = useRef();
  const parolTiklashForm = useRef();
  const navigate = useNavigate();

  function addData(e) {
    e.preventDefault();
    
    const dataObj = {
      email: email.current.value,
    };

    const errorArr = Object.keys(dataObj).filter((key) => !dataObj[key]);

    errorArr.forEach((item) => {
      document.getElementById(item).classList.add("border-red-600");
    });

    Array.from(parolTiklashForm.current).forEach((item) => {
      item.addEventListener("change", (e) => {
        if (e.target.value) {
          item.classList.remove("border-red-600");
        } else {
          item.classList.add("border-red-600");
        }
      });
    });

    if (errorArr.length === 0) {
      fetch(`${import.meta.env.VITE_BASE_URL}/email-verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataObj),
      })
        .then(async (res) => {
          const errorObj = await res.json();
          if (!res.ok) throw new Error(JSON.stringify(errorObj));
          return res;
        })
        .then(() => {
          parolTiklashForm.current.reset();
          navigate("/create-new-parol");
        })
        .catch((err) => {
          const errorObj = JSON.parse(err.message);
          if (errorObj?.message) toast.error(errorObj.message);
        });
    }
  }

  return (
    <section className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B2B4E] relative overflow-hidden items-center justify-center p-12">
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
        <div className="relative z-10 text-center">
          <div className="w-40 h-40 mx-auto mb-8">
            <img src="/new_logo_white.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">Kasbiy Ta'limni</h1>
          <h2 className="text-[#D4A017] text-3xl font-bold">Rivojlantirish Instituti</h2>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Parolni tiklash</h2>
            <p className="text-sm sm:text-base text-gray-500">Parolni tiklash uchun elektron pochtangizni kiriting</p>
          </div>

          <form ref={parolTiklashForm} onSubmit={addData} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Elektron pochta
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
                  placeholder="example@mail.com"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 bg-[#0B2B4E] hover:bg-[#0a2442] text-white font-semibold rounded-lg transition-all duration-200 cursor-pointer text-sm sm:text-base"
            >
              Tasdiqlash
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                Kirish sahifasiga o'tish
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

export default ConfirmEmail;
