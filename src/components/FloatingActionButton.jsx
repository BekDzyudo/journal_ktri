import React, { useState, useEffect } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { useNavigate } from 'react-router-dom';
import { FaHeadset, FaImage, FaTimes, FaPaperPlane } from 'react-icons/fa';

function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { openCalendar } = useCalendar();
  const navigate = useNavigate();

  // Quick contact modal states
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [quickFormData, setQuickFormData] = useState({
    name: "",
    email: "",
    telefon: "",
    subject: "",
    message: "",
    image: null,
  });
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [quickSubmitMessage, setQuickSubmitMessage] = useState(null);

  // Auto popup notification
  const [showAutoPopup, setShowAutoPopup] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Auto popup after 10 seconds (only once per session)
  useEffect(() => {
    const hasShownPopup = sessionStorage.getItem('helpPopupShown');
    
    if (!hasShownPopup) {
      const timer = setTimeout(() => {
        setShowAutoPopup(true);
        sessionStorage.setItem('helpPopupShown', 'true');
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseAutoPopup = () => {
    setShowAutoPopup(false);
  };

  const handleAutoPopupYes = () => {
    setShowAutoPopup(false);
    setIsQuickModalOpen(true);
  };

  const handleCalendarClick = () => {
    openCalendar();
    setIsOpen(false); // Close speed dial when option is selected
  };

  const handleQuickContactClick = () => {
    setIsQuickModalOpen(true);
    setIsOpen(false);
  };

  const handleQuickFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      setQuickFormData({
        ...quickFormData,
        image: files[0],
      });
    } else {
      setQuickFormData({
        ...quickFormData,
        [name]: value,
      });
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    setIsQuickSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", quickFormData.name.trim());
      formDataToSend.append("email", quickFormData.email.trim());
      formDataToSend.append("telefon", quickFormData.telefon.trim());
      formDataToSend.append("subject", quickFormData.subject.trim());
      formDataToSend.append("message", quickFormData.message.trim());
      if (quickFormData.image) {
        formDataToSend.append("image", quickFormData.image);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/shared_app/contact/create/`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error(`Server xatosi: ${response.status}`);
      }

      setQuickSubmitMessage({
        type: "success",
        text: "Xabaringiz muvaffaqiyatli yuborildi! Tez orada siz bilan bog'lanamiz.",
      });
      setIsQuickSubmitting(false);
      setQuickFormData({
        name: "",
        email: "",
        telefon: "",
        subject: "",
        message: "",
        image: null,
      });

      setTimeout(() => {
        setQuickSubmitMessage(null);
        setIsQuickModalOpen(false);
      }, 3000);
    } catch (error) {
      console.error("Xatolik:", error);
      setQuickSubmitMessage({
        type: "error",
        text: "Xabar yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
      });
      setIsQuickSubmitting(false);
      setTimeout(() => setQuickSubmitMessage(null), 5000);
    }
  };

  return (
    <>
      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 animate-fadeIn"
          onClick={toggleMenu}
        ></div>
      )}

      {/* Quick Contact Modal */}
      {isQuickModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-linear-to-br from-[#194882] to-info p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <FaHeadset className="text-2xl text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Tezkor aloqa</h2>
              </div>
              <button
                onClick={() => setIsQuickModalOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {quickSubmitMessage && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    quickSubmitMessage.type === "success"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  {quickSubmitMessage.text}
                </div>
              )}

              <form onSubmit={handleQuickSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Ism <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={quickFormData.name}
                      onChange={handleQuickFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Ismingiz"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={quickFormData.email}
                      onChange={handleQuickFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telefon"
                      value={quickFormData.telefon}
                      onChange={handleQuickFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Mavzu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={quickFormData.subject}
                      onChange={handleQuickFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Mavzu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Xabar <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={quickFormData.message}
                    onChange={handleQuickFormChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Xabaringizni yozing..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Rasm yuklash (ixtiyoriy)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleQuickFormChange}
                      className="hidden"
                      id="quickImageUpload"
                    />
                    <label
                      htmlFor="quickImageUpload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      <FaImage className="text-gray-400 text-xl" />
                      <span className="text-gray-600">
                        {quickFormData.image
                          ? quickFormData.image.name
                          : "Rasm tanlang"}
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isQuickSubmitting}
                  className="w-full px-6 py-4 bg-linear-to-br from-[#194882] to-info text-white font-bold rounded-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isQuickSubmitting ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Yuborish
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Auto Help Popup Notification */}
      {showAutoPopup && (
        <div className="fixed bottom-28 right-6 z-50 animate-slideUp">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm border-t-4 border-blue-600">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full shrink-0">
                <FaHeadset className="text-2xl text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Sizga yordam kerakmi?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Savol yoki takliflaringiz bo'lsa, biz bilan bog'laning. Operatorlarimiz sizga yordam berishga tayyor!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAutoPopupYes}
                    className="flex-1 px-4 py-2 bg-linear-to-br from-[#194882] to-info text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Ha, kerak
                  </button>
                  <button
                    onClick={handleCloseAutoPopup}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Yo'q
                  </button>
                </div>
              </div>
              <button
                onClick={handleCloseAutoPopup}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Container */}
      <div className="fixed bottom-14 right-4 sm:right-6 z-50 flex flex-col items-end gap-2.5">
        {/* Speed Dial Options */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5 animate-slideUp">
            {/* Quick Contact Button */}
            <button
              onClick={handleQuickContactClick}
              className="group flex items-center gap-3 transition-all duration-200 hover:scale-105"
              title="Tezkor aloqa"
            >
              {/* Label */}
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Tezkor aloqa
              </span>
              
              {/* Icon Button */}
              <div className="bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-200">
                <FaHeadset className="h-5 w-5" />
              </div>
            </button>

            {/* Calendar Button */}
            <button
              onClick={handleCalendarClick}
              className="group flex items-center gap-3 transition-all duration-200 hover:scale-105"
              title="Voqealar kalendari"
            >
              {/* Label */}
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Voqealar kalendari
              </span>
              
              {/* Icon Button */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
            </button>

            {/* Messages Button */}
            {/* <button
              className="group flex items-center gap-3 transition-all duration-200 hover:scale-105"
              title="Xabarlar"
            >
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Xabarlar
              </span>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-200">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                  />
                </svg>
              </div>
            </button> */}

            {/* Notifications Button */}
            <button
              onClick={() => {/* TODO: Add functionality */}}
              className="group flex items-center gap-3 transition-all duration-200 hover:scale-105"
              title="Bildirishnomalar"
            >
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Bildirishnomalar
              </span>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 relative">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                  />
                </svg>
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">3</span>
              </div>
            </button>

            {/* Help/Support Button */}
            <button
              onClick={()=>navigate('/contact')}
              className="group flex items-center gap-3 transition-all duration-200 hover:scale-105"
              title="Yordam"
            >
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Yordam
              </span>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={toggleMenu}
          className={`bg-gradient-to-br from-[#194882] to-info hover:from-[#15396b] hover:to-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
          title={isOpen ? 'Yopish' : 'Ochish'}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
        </button>
      </div>
    </>
  );
}

export default FloatingActionButton;
