// const BASE_URL = "http://192.168.101.174:3000/api";
// const BASE_URL = "http://192.168.100.10/api";
const BASE_URL = "https://kasb-edu.uz/api";

export const register = async (data) => {
  const response = await fetch(`${BASE_URL}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
//   return response.json();
return response;
};

export const login = async (data) => {
  const response = await fetch(`${BASE_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if(response.status == 200){
    return response.json();
  }
  // return response;
};

export const forgetPassword = async (data) => {
    const response = await fetch(`${BASE_URL}/forget-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  };
  

export const refreshAccessToken = async (refreshToken) => {
  const data = {refresh: refreshToken}
  const response = await fetch(`${BASE_URL}/login/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // body: JSON.stringify({refreshToken}),
    body: JSON.stringify(data)
  });
  
  return response.json();
};
