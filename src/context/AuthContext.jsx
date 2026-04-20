import { createContext, useEffect, useState } from "react";
import { refreshAccessToken } from "../components/authentication/auth";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext()

export const AuthProvider = ({children}) =>{

    const [auth, setAuth] = useState({
        refreshToken: localStorage.getItem("refreshToken") || null,
        accessToken: localStorage.getItem("accessToken") || null,
      });
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem("userData")) || null)
     const [MaterialMetod, setMaterialMetod] = useState(null)

    // notifMetodist
    function lookAtActionMetodist(){
      if (!auth?.accessToken) return;
      fetch(
        `${import.meta.env.VITE_BASE_URL}/notification_app/notification-list`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth?.accessToken,
          },
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error(res.status);
          return res.json();
        })
        .then((data) => {
          setMaterialMetod(data)          
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(()=>{
        });
    }
      

  const isTokenExpired = (token) => {
      try {
        if (!token || typeof token !== 'string') {
          return true; // Token yo'q yoki noto'g'ri turda bo'lsa, muddati tugagan deb hisoblaymiz
        }
        const decoded = jwtDecode(token);
        
        const currentTime = Date.now() / 1000; // Hozirgi vaqtni sekundda olamiz
        return decoded.exp < currentTime; // Token muddati tugaganmi?
      } catch (error) {
        console.error("Error decoding token:", error);
        return true; // Agar token noto'g'ri bo'lsa, uni muddati tugagan deb hisoblaymiz
      }
  };

  // login
  const login = (data) => { 
    setAuth({refreshToken: data.refresh, accessToken: data.access});
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);

    fetch(`${import.meta.env.VITE_BASE_URL}/user-data/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + data.access,
      },
    })
    .then((res)=>{
      if(!res.ok){
        throw new Error(res);
      }
      return res.json()
    })
    .then((data)=>{      
      setUserData({userId: data.id, user_roles: data.user_roles})
      localStorage.setItem("userData", JSON.stringify({userId: data.id, user_roles: data.user_roles}))
    })
    .catch((err)=>{
      console.log(err);
      
    })
  };

  // logout
  const logout = () => {
    setAuth({ accessToken: null, refreshToken: null });
    localStorage.clear();
    setUserData(null);
  };

  // refresh
  const refresh = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    // Refresh token mavjudligini va muddati tugaganligini tekshirish
    if (!refreshToken || isTokenExpired(refreshToken)) {
      logout();
      return;
    }
  
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      if (newTokens.access) {
        setAuth((prev) => ({ ...prev, accessToken: newTokens.access }));
        localStorage.setItem("accessToken", newTokens.access);
      } else {
        logout(); // Refresh token noto‘g‘ri bo‘lsa, logout qilish
      }
    } catch (error) {
      logout();
    }
  };

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedAccessToken = localStorage.getItem("accessToken");
  
    // Tokenlarni tekshirish
    if (storedRefreshToken && !isTokenExpired(storedRefreshToken)) {
      if (storedAccessToken && !isTokenExpired(storedAccessToken)) {
        setAuth({ accessToken: storedAccessToken, refreshToken: storedRefreshToken });
      } else {
        refresh(); // Access token muddati tugagan bo‘lsa, yangilashga urinib ko‘ramiz
      }
    } else {
      logout(); // Refresh token muddati tugagan bo‘lsa, foydalanuvchini tizimdan chiqaramiz
    }
  }, []);

  return (
    <AuthContext.Provider value={{auth, login, logout, refresh, isTokenExpired, userData, MaterialMetod, lookAtActionMetodist}}>
        {children}
    </AuthContext.Provider>
  )

}