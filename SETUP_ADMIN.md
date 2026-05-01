# Super Admin yaratish bo'yicha yo'riqnoma

## Test uchun birinchi Super Admin yaratish

Tizimni test qilish uchun birinchi Super Admin qo'lda yaratilishi kerak. Quyidagi qadamlarni bajaring:

### 1-usul: Browser Console orqali

1. Brauzerda sahifani oching (http://localhost:5173)
2. F12 bosing (Developer Tools)
3. Console tabiga o'ting
4. Quyidagi kodni nusxalab, Console ga joylashtiring va Enter bosing:

```javascript
// Birinchi Super Admin yaratish
const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');

// Super Admin mavjudligini tekshirish
const existingSuperAdmin = mockUsers.find(u => u.role === 'super_admin');

if (!existingSuperAdmin) {
  mockUsers.push({
    id: Date.now(),
    first_name: "Super",
    last_name: "Admin",
    email: "admin@ktri.uz",
    phone_number: "+998 99 123 45 67",
    password: "admin123",
    role: "super_admin",
    date_joined: new Date().toISOString(),
  });
  localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
  console.log("✅ Super Admin yaratildi!");
  console.log("📧 Email: admin@ktri.uz");
  console.log("🔑 Parol: admin123");
} else {
  console.log("ℹ️ Super Admin allaqachon mavjud");
  console.log("📧 Email:", existingSuperAdmin.email);
}
```

### 2-usul: Register sahifasi orqali

1. `/register` sahifasiga o'ting
2. Oddiy user sifatida ro'yxatdan o'ting
3. Browser Console ga o'ting (F12)
4. Quyidagi kodni ishga tushiring (email ni o'zingizni email bilan almashtiring):

```javascript
const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
const yourEmail = "sizning@email.uz"; // Bu yerga o'z email ingizni yozing

const user = mockUsers.find(u => u.email === yourEmail);
if (user) {
  user.role = "super_admin";
  localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
  console.log("✅ Siz Super Admin bo'ldingiz!");
  console.log("🔄 Sahifani yangilang va qayta kiring");
} else {
  console.log("❌ User topilmadi. Email to'g'ri ekanligini tekshiring");
}
```

## Tizimga kirish

Super Admin yaratilgandan keyin:

1. `/login` sahifasiga o'ting
2. Email va parol kiriting
3. Tizimga kirganingizdan keyin avtomatik `/dashboard/super-admin` ga yo'naltirilasiz

## Super Admin vazifalari

Super Admin quyidagi vazifalarni bajara oladi:

✅ Barcha userlarni ko'rish  
✅ Userlarni qidirish (ism, email, telefon)  
✅ Oddiy userlarni Admin qilish  
✅ Adminlardan huquqni olib qo'yish  
✅ Barcha maqolalarni ko'rish  
✅ Maqolalarni adminlarga tayinlash  
✅ Maqola statuslarini o'zgartirish  

## Muhim eslatma

⚠️ Bu faqat test rejimi (Mock Mode) uchun. Production rejimida role backend tomonidan boshqariladi.
