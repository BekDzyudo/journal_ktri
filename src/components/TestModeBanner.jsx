import React from 'react'
import Marquee from 'react-fast-marquee';
import { FaExclamationTriangle } from 'react-icons/fa'

function TestModeBanner() {
  const text = "⚠️ Sayt test rejimida ishlamoqda";
  
  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-linear-to-r from-[#002d6d] via-[#003d7d] to-[#002d6d] py-1.5 overflow-hidden">
      <div className="flex items-center gap-3">
        <FaExclamationTriangle className="text-yellow-400 animate-pulse ml-4 shrink-0" size={20} />
        <div className="flex-1 overflow-hidden relative">
          <div className="flex animate-marquee">
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
            <span className="text-yellow-400 font-bold text-[14px] px-10 whitespace-nowrap">{text}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestModeBanner
