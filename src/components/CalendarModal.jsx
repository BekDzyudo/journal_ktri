import React from 'react';
import { createPortal } from 'react-dom';
import { useCalendar } from '../context/CalendarContext';
import InstitutCalendar from './InstitutCalendar';

function CalendarModal() {
  const { isCalendarOpen, closeCalendar } = useCalendar();

  if (!isCalendarOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] animate-fadeIn"
        onClick={closeCalendar}
      ></div>
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-transparent max-w-lg w-full pointer-events-auto animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="flex justify-end mb-2">
            <button 
              onClick={closeCalendar}
              className="btn btn-circle btn-sm bg-white hover:bg-gray-100 shadow-lg"
            >
              ✕
            </button>
          </div>
          
          {/* Calendar Component */}
          <div className="shadow-2xl">
            <InstitutCalendar />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default CalendarModal;
