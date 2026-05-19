import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GlobalContextProvider } from "./context/GlobalContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getGoogleClientId } from "./utils/googleAuthApi.js";

const googleClientId = getGoogleClientId();

const appTree = (
  <AuthProvider>
    <GlobalContextProvider>
      <App />
    </GlobalContextProvider>
  </AuthProvider>
);

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId} locale="uz">
        {appTree}
      </GoogleOAuthProvider>
    ) : (
      appTree
    )}
  </HelmetProvider>,
);
