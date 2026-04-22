// Telefon raqamni formatlash
export const formatPhoneNumber = (value) => {
  // Faqat raqamlarni olish
  const phoneNumber = value.replace(/\D/g, '');
  
  // Agar 998 bilan boshlanmasa, qo'shish
  let formatted = phoneNumber;
  if (!phoneNumber.startsWith('998')) {
    formatted = '998' + phoneNumber;
  }
  
  // Format: +998 XX XXX XX XX
  if (formatted.length <= 3) {
    return `+${formatted}`;
  } else if (formatted.length <= 5) {
    return `+${formatted.slice(0, 3)} ${formatted.slice(3)}`;
  } else if (formatted.length <= 8) {
    return `+${formatted.slice(0, 3)} ${formatted.slice(3, 5)} ${formatted.slice(5)}`;
  } else if (formatted.length <= 10) {
    return `+${formatted.slice(0, 3)} ${formatted.slice(3, 5)} ${formatted.slice(5, 8)} ${formatted.slice(8)}`;
  } else {
    return `+${formatted.slice(0, 3)} ${formatted.slice(3, 5)} ${formatted.slice(5, 8)} ${formatted.slice(8, 10)} ${formatted.slice(10, 12)}`;
  }
};

// Telefon raqamni tozalash (faqat raqamlar)
export const cleanPhoneNumber = (value) => {
  return value.replace(/\D/g, '');
};
