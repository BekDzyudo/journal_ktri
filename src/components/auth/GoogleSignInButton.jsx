import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { getGoogleClientId, postGoogleIdToken } from "../../utils/googleAuthApi";

/**
 * @param {'signin' | 'signup'} props.flow
 * @param {boolean} [props.disabled]
 * @param {(data: object) => void | Promise<void>} props.onAuthenticated — tokens + user bilan
 * @param {(message: string) => void} [props.onError]
 */
export default function GoogleSignInButton({
  flow = "signin",
  disabled = false,
  onAuthenticated,
  onError,
}) {
  const [busy, setBusy] = useState(false);
  const clientId = getGoogleClientId();

  if (!clientId) {
    return null;
  }

  const inactive = disabled || busy;

  const handleSuccess = async (cred) => {
    const token = cred?.credential;
    if (!token) {
      onError?.("Google credential qaytmadi. Qayta urinib ko'ring.");
      return;
    }

    setBusy(true);
    try {
      const data = await postGoogleIdToken(token);
      await onAuthenticated(data);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Google orqali kirishda xatolik yuz berdi";
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        className={`flex w-full justify-center ${inactive ? "pointer-events-none opacity-60" : ""}`}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() =>
            onError?.("Google oynasi yopildi yoki kirish bekor qilindi")
          }
          context={flow === "signup" ? "signup" : "signin"}
          text={flow === "signup" ? "signup_with" : "signin_with"}
          theme="outline"
          size="large"
          width={320}
        />
      </div>
      {busy && (
        <span className="text-xs text-gray-500">Hisobingiz tekshirilmoqda...</span>
      )}
    </div>
  );
}
