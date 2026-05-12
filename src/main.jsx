import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GlobalContextProvider } from "./context/GlobalContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { HelmetProvider } from "react-helmet-async";


createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <AuthProvider>
      <GlobalContextProvider>
        <App />
      </GlobalContextProvider>
    </AuthProvider>
  </HelmetProvider>,
);
