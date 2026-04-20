import React, { createContext, useContext, useState } from 'react';

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const openCalendar = () => setIsCalendarOpen(true);
  const closeCalendar = () => setIsCalendarOpen(false);
  const toggleCalendar = () => setIsCalendarOpen(prev => !prev);

  return (
    <CalendarContext.Provider 
      value={{ 
        isCalendarOpen, 
        openCalendar, 
        closeCalendar, 
        toggleCalendar 
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within CalendarProvider');
  }
  return context;
};
