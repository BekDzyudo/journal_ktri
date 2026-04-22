import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GlobalContextProvider } from "./context/GlobalContext.jsx";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext.jsx";
import { HelmetProvider } from "react-helmet-async";
import NotFound from "./pages/not-found/NotFound.jsx";

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <AuthProvider>
      <GlobalContextProvider>
        <App />
        <ToastContainer position="bottom-right" />
      </GlobalContextProvider>
    </AuthProvider>
  </HelmetProvider>,
);
