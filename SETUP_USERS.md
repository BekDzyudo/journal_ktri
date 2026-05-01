# Test Foydalanuvchilarini Yaratish

## Mock rejimda test foydalanuvchilari

Browser console ga quyidagi kodni nusxalang va Enter bosing:

```javascript
// Test foydalanuvchilarini yaratish
const testUsers = [
  {
    email: 'user@test.uz',
    password: '12345678',
    first_name: 'Ali',
    last_name: 'Valiyev',
    phone_number: '+998901234567',
    role: 'user',
    is_verified: true,
    date_joined: new Date().toISOString()
  },
  {
    email: 'admin@test.uz',
    password: '12345678',
    first_name: 'Sardor',
    last_name: 'Karimov',
    phone_number: '+998901234568',
    role: 'admin',
    is_verified: true,
    date_joined: new Date().toISOString()
  },
  {
    email: 'superadmin@test.uz',
    password: '12345678',
    first_name: 'Jamshid',
    last_name: 'Toshmatov',
    phone_number: '+998901234569',
    role: 'superadmin',
    is_verified: true,
    date_joined: new Date().toISOString()
  }
];

// LocalStorage ga saqlash
localStorage.setItem('mockUsers', JSON.stringify(testUsers));
console.log('✅ Test foydalanuvchilari yaratildi!');
console.log('USER:', testUsers[0].email, '| Parol:', testUsers[0].password);
console.log('ADMIN:', testUsers[1].email, '| Parol:', testUsers[1].password);
console.log('SUPERADMIN:', testUsers[2].email, '| Parol:', testUsers[2].password);
```

## Kirish ma'lumotlari:

### 1. Oddiy foydalanuvchi (User):
- **Email:** `user@test.uz`
- **Parol:** `12345678`
- **Ko'rinish:** Faqat o'z maqolalarini ko'radi

### 2. Taqrizchi (Admin):
- **Email:** `admin@test.uz`
- **Parol:** `12345678`
- **Ko'rinish:** Unga tayinlangan maqolalarni baholaydi

### 3. Super Admin:
- **Email:** `superadmin@test.uz`
- **Parol:** `12345678`
- **Ko'rinish:** Barcha maqolalar, foydalanuvchilar, adminlarni boshqaradi

## Qo'lda foydalanuvchi qo'shish:

```javascript
// Joriy foydalanuvchilarni olish
const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');

// Yangi foydalanuvchi qo'shish
users.push({
  email: 'yangi@test.uz',
  password: 'parol123',
  first_name: 'Yangi',
  last_name: 'User',
  phone_number: '+998901234570',
  role: 'admin', // yoki 'user' yoki 'superadmin'
  is_verified: true,
  date_joined: new Date().toISOString()
});

// Saqlash
localStorage.setItem('mockUsers', JSON.stringify(users));
console.log('✅ Yangi foydalanuvchi qo\'shildi!');
```

## Mavjud foydalanuvchiga admin huquqi berish:

```javascript
const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
const userIndex = users.findIndex(u => u.email === 'user@test.uz');
if (userIndex !== -1) {
  users[userIndex].role = 'admin'; // yoki 'superadmin'
  localStorage.setItem('mockUsers', JSON.stringify(users));
  console.log('✅ Foydalanuvchi roli o\'zgartirildi!');
}
```

## Barcha foydalanuvchilarni ko'rish:

```javascript
const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
console.table(users.map(u => ({
  Email: u.email,
  Ism: u.first_name,
  Familiya: u.last_name,
  Rol: u.role
})));
```

## Qadamlar:

1. Brauzerda saytni oching: `http://localhost:5173`
2. Browser console ni oching (F12 tugmasi)
3. Yuqoridagi test foydalanuvchilarini yaratish kodini nusxalab console ga kiriting
4. Enter bosing
5. `/login` sahifasiga o'ting
6. Kerakli foydalanuvchi bilan kiring:
   - User panel uchun: `user@test.uz`
   - Admin panel uchun: `admin@test.uz`
   - SuperAdmin panel uchun: `superadmin@test.uz`
7. `/admin` yoki `/dashboard` sahifasiga o'ting

## Eslatma:

- Bu ko‘rsatma **oldingi mahalliy (localStorage) test** uchun qoldirilgan bo‘lishi mumkin — loyiha endi faqat **haqiqiy backend API** bilan ishlaydi (`VITE_BASE_URL`).
- Backendda mos test hisoblarni o‘zingiz yarating yoki Swagger orqali ro‘yxatdan o‘ting.
