import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaClock, FaMapMarkerAlt, FaUsers, FaExternalLinkAlt, FaCheckCircle, FaPhone, FaEnvelope } from "react-icons/fa";

function InstitutCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Demo voqealar - backend dan keladi
  const events = [
    {
      id: 1,
      title: "O'qituvchilar seminari",
      date: "2026-03-15",
      time: "10:00",
      endTime: "16:00",
      location: "Institut majlislar zali",
      status: "upcoming",
      description: "Zamonaviy ta'lim texnologiyalari bo'yicha seminar. O'qituvchilar uchun innovatsion metodlar va zamonaviy pedagogik tizimlar haqida ma'lumot taqdim etiladi.",
      program: [
        "10:00-11:00 - Ta'lim texnologiyalari kirish",
        "11:00-13:00 - Amaliy mashg'ulotlar",
        "13:00-14:00 - Tushlik tanaffus",
        "14:00-16:00 - Interaktiv sessiya"
      ],
      speakers: ["Prof. Ahmedov A.A.", "Dots. Karimova M.K."],
      participants: "80 ta ishtirokchilar kutilmoqda",
      contact: "+998 71 246-90-37",
      registrationRequired: true
    },
    {
      id: 2,
      title: "Xalqaro konferensiya",
      date: "2026-03-05",
      time: "09:00",
      endTime: "18:00",
      location: "Asosiy bino",
      status: "past",
      description: "Kasbiy ta'limni rivojlantirish masalalari bo'yicha xalqaro konferensiya muvaffaqiyatli o'tdi.",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      participants: "120 ishtirokchi, 5 mamlakatdan",
      highlights: [
        "15 ta ilmiy maqola taqdim etildi",
        "3 ta master-klass o'tkazildi",
        "Xalqaro hamkorlik shartnomasi imzolandi"
      ],
      newsLink: "/news/1",
      organizer: "Institut Xalqaro aloqalar bo'limi"
    },
    {
      id: 3,
      title: "Metodistlar yig'ilishi",
      date: "2026-03-20",
      time: "14:00",
      endTime: "17:00",
      location: "2-qavat, 204-xona",
      status: "upcoming",
      description: "Oylik hisobot va keyingi oy uchun ish rejasini muhokama qilish. O'quv dasturlari va metodik ko'rsatmalarni takomillashtirish.",
      program: [
        "14:00-15:00 - Oylik natijalar tahlili",
        "15:00-16:00 - Yangi dasturlarni ko'rib chiqish",
        "16:00-17:00 - Reja va topshiriqlar"
      ],
      participants: "Barcha metodistlar",
      responsiblePerson: "Metodistlar kengashi raisi",
      contact: "metodist@edu.uz"
    },
    {
      id: 4,
      title: "Master-class",
      date: "2026-03-25",
      time: "11:00",
      endTime: "14:00",
      location: "Trening markazi",
      status: "upcoming",
      description: "Raqamli resurslar yaratish bo'yicha amaliy master-klass. O'quv jarayonida foydalanish uchun multimedia materiallar tayyorlash.",
      program: [
        "11:00-11:30 - Raqamli vositalar bilan tanishuv",
        "11:30-13:00 - Amaliy ishlar",
        "13:00-14:00 - Savollar va javoblar"
      ],
      speakers: ["IT mutaxassis - Aliyev S.M."],
      participants: "30 o'rin mavjud",
      requirements: "Noutbuk bilan kelish talab etiladi",
      registrationRequired: true,
      registrationDeadline: "2026-03-22",
      contact: "+998 91 601-72-22"
    },
    {
      id: 5,
      title: "Kadrlar tayyorlash kursi",
      date: "2026-02-28",
      time: "09:00",
      endTime: "17:00",
      location: "Institut",
      status: "past",
      description: "O'qituvchilar uchun malaka oshirish kursi yakunlandi. Ishtirokchilar zamonaviy ta'lim metodlari bilan tanishdilar.",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
      participants: "45 o'qituvchi",
      highlights: [
        "5 kunlik intensiv kurs",
        "Sertifikatlar topshirildi",
        "Yuqori baholar olindi"
      ],
      newsLink: "/news/2",
      organizer: "Kadrlar bo'limi"
    }
  ];

  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = [];
  
  // Empty cells before first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const hasUpcoming = dayEvents.some(e => e.status === 'upcoming');
    const hasPast = dayEvents.some(e => e.status === 'past');

    days.push(
      <button
        key={day}
        onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
        className={`aspect-square p-1 rounded-lg text-xs sm:text-sm transition-all duration-200 relative
          ${isToday(day) ? 'bg-blue-600 text-white font-bold' : 'hover:bg-base-200'}
          ${dayEvents.length > 0 ? 'cursor-pointer' : 'cursor-default'}
        `}
      >
        <span className="block">{day}</span>
        {dayEvents.length > 0 && (
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
            {hasUpcoming && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
            {hasPast && <span className="w-2 h-2 rounded-full bg-gray-400"></span>}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600" />
          Voqealar kalendari
        </h3>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={previousMonth} className="btn btn-ghost btn-sm">
          <FaChevronLeft />
        </button>
        <span className="font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button onClick={nextMonth} className="btn btn-ghost btn-sm">
          <FaChevronRight />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'].map(day => (
            <div key={day} className="text-center text-xs font-semibold opacity-60">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs mb-4 pb-4 border-b">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span>Rejalashtirilgan</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          <span>O'tgan</span>
        </div>
      </div>

      {/* Event Modal */}
      {selectedEvent && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[9999] animate-fadeIn"
            onClick={() => setSelectedEvent(null)}
          ></div>
          
          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-scaleIn overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-[#194882] to-info text-white p-5 relative">
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-3 right-3 btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
                >
                  ✕
                </button>
                <div className="flex items-start gap-3 pr-8">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <FaCalendarAlt className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">{selectedEvent.title}</h4>
                    <span className={`badge badge-sm ${
                      selectedEvent.status === 'upcoming' 
                        ? 'bg-green-500 border-0 text-white' 
                        : 'bg-gray-300 border-0 text-gray-700'
                    }`}>
                      {selectedEvent.status === 'upcoming' ? 'Rejalashtirilgan' : 'O\'tgan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Image for past events */}
                {selectedEvent.status === 'past' && selectedEvent.image && (
                  <div className="rounded-xl overflow-hidden -mt-2">
                    <img 
                      src={selectedEvent.image} 
                      alt={selectedEvent.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Basic Details */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#194882] to-info p-2 rounded-lg">
                      <FaCalendarAlt className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs opacity-60">Sana</p>
                      <p className="font-semibold text-sm">
                        {new Date(selectedEvent.date).toLocaleDateString('uz-UZ', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#194882] to-info p-2 rounded-lg">
                      <FaClock className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs opacity-60">Vaqt</p>
                      <p className="font-semibold text-sm">
                        {selectedEvent.time}
                        {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#194882] to-info p-2 rounded-lg">
                      <FaMapMarkerAlt className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs opacity-60">Joylashuv</p>
                      <p className="font-semibold text-sm">{selectedEvent.location}</p>
                    </div>
                  </div>

                  {selectedEvent.participants && (
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-[#194882] to-info p-2 rounded-lg">
                        <FaUsers className="text-white text-sm" />
                      </div>
                      <div>
                        <p className="text-xs opacity-60">Ishtirokchilar</p>
                        <p className="font-semibold text-sm">{selectedEvent.participants}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* PAST EVENT - Highlights & News Link */}
                {selectedEvent.status === 'past' && (
                  <>
                    {selectedEvent.highlights && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h5 className="font-bold text-sm mb-3 flex items-center gap-2 text-green-800">
                          <FaCheckCircle className="text-green-600" />
                          Asosiy natijalar
                        </h5>
                        <ul className="space-y-2">
                          {selectedEvent.highlights.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedEvent.organizer && (
                      <div className="text-xs text-gray-600 italic">
                        Tashkilotchi: {selectedEvent.organizer}
                      </div>
                    )}

                    {selectedEvent.newsLink && (
                      <Link
                        to={selectedEvent.newsLink}
                        onClick={() => setSelectedEvent(null)}
                        className="btn bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white w-full"
                      >
                        <FaExternalLinkAlt className="mr-2" />
                        Batafsil yangilikda
                      </Link>
                    )}
                  </>
                )}

                {/* UPCOMING EVENT - Program & Contact */}
                {selectedEvent.status === 'upcoming' && (
                  <>
                    {selectedEvent.program && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h5 className="font-bold text-sm mb-3 text-blue-800">
                          📋 Dastur
                        </h5>
                        <ul className="space-y-2">
                          {selectedEvent.program.map((item, index) => (
                            <li key={index} className="text-xs text-gray-700 pl-4">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedEvent.speakers && selectedEvent.speakers.length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <h5 className="font-bold text-sm mb-2 text-purple-800">
                          🎤 Ma'ruzachilar
                        </h5>
                        <div className="space-y-1">
                          {selectedEvent.speakers.map((speaker, index) => (
                            <p key={index} className="text-sm text-gray-700">{speaker}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvent.requirements && (
                      <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                        <p className="text-xs text-orange-800">
                          <span className="font-bold">⚠️ Eslatma:</span> {selectedEvent.requirements}
                        </p>
                      </div>
                    )}

                    {selectedEvent.registrationRequired && (
                      <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-300">
                        <p className="text-xs font-bold text-yellow-800">
                          ✋ Ro'yxatdan o'tish talab etiladi
                        </p>
                        {selectedEvent.registrationDeadline && (
                          <p className="text-xs text-yellow-700 mt-1">
                            Muddat: {new Date(selectedEvent.registrationDeadline).toLocaleDateString('uz-UZ')}
                          </p>
                        )}
                      </div>
                    )}

                    {(selectedEvent.contact || selectedEvent.responsiblePerson) && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h5 className="font-bold text-sm mb-2 text-gray-800">
                          📞 Bog'lanish
                        </h5>
                        {selectedEvent.responsiblePerson && (
                          <p className="text-xs text-gray-700 mb-1">
                            <span className="font-semibold">Mas'ul shaxs:</span> {selectedEvent.responsiblePerson}
                          </p>
                        )}
                        {selectedEvent.contact && (
                          <p className="text-sm text-gray-700 flex items-center gap-2">
                            {selectedEvent.contact.includes('@') ? (
                              <>
                                <FaEnvelope className="text-gray-500" />
                                <a href={`mailto:${selectedEvent.contact}`} className="hover:text-blue-600">
                                  {selectedEvent.contact}
                                </a>
                              </>
                            ) : (
                              <>
                                <FaPhone className="text-gray-500" />
                                <a href={`tel:${selectedEvent.contact}`} className="hover:text-blue-600">
                                  {selectedEvent.contact}
                                </a>
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Close Button */}
                <div className="pt-2">
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="btn bg-gradient-to-br from-[#194882] to-info text-white w-full hover:shadow-lg"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Upcoming Events List */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2">Yaqin voqealar</h4>
        <div className="space-y-2">
          {events
            .filter(e => e.status === 'upcoming')
            .slice(0, 3)
            .map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="w-full text-left p-2 rounded-lg hover:bg-base-200 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{event.title}</p>
                    <p className="text-xs opacity-60">
                      {new Date(event.date).toLocaleDateString('uz-UZ')} • {event.time}
                    </p>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(-20px);
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default InstitutCalendar;
