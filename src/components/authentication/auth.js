const apiBase = () =>
  (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

export const register = async (data) => {
  const response = await fetch(`${apiBase()}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
//   return response.json();
return response;
};

export const login = async (data) => {
  const response = await fetch(`${apiBase()}/auth/login/`, {
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
    const response = await fetch(`${apiBase()}/auth/forgot-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  };
  

export const refreshAccessToken = async (refreshToken) => {
  const body = { refresh: refreshToken };
  const endpoints = [
    "/auth/login/refresh/",
    "/auth/token/refresh/",
    "/token/refresh/",
    "/login/refresh/",
  ];

  let lastPayload = {};
  for (const endpoint of endpoints) {
    const response = await fetch(`${apiBase()}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    if (response.ok) return payload;

    lastPayload = payload;
    if (response.status !== 404) break;
  }

  const err = new Error(lastPayload?.detail || lastPayload?.code || "Refresh failed");
  err.payload = lastPayload;
  throw err;
};
