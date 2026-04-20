import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[180px] font-bold text-gray-200 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-[#0B2B4E] rounded-full flex items-center justify-center shadow-2xl">
              <svg 
                className="w-16 h-16 sm:w-20 sm:h-20 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4">
            Sahifa topilmadi
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-2">
            Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki o'chirilgan.
          </p>
          <p className="text-sm sm:text-base text-gray-500">
            URL manzilni tekshiring yoki bosh sahifaga qayting.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3 bg-[#0B2B4E] hover:bg-[#0a2442] text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            Bosh sahifa
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border-2 border-gray-300 shadow-md hover:shadow-lg"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Orqaga qaytish
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 flex justify-center gap-4 opacity-30">
          <div className="w-3 h-3 bg-[#0B2B4E] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-[#0B2B4E] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-[#0B2B4E] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
