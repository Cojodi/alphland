import React from "react";
import CookieConsentBanner from "react-cookie-consent";
import Link from "next/link";

const CookieConsent: React.FC = () => {
  return (
    <CookieConsentBanner
      location="bottom"
      buttonText="Accept All"
      declineButtonText="Decline"
      enableDeclineButton
      cookieName="alphland-cookie-consent"
      style={{
        background: "rgba(0, 0, 0, 0.95)",
        padding: "20px",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        zIndex: 9999,
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      }}
      buttonStyle={{
        background: "#10b981",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "600",
        padding: "12px 24px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "#9ca3af",
        fontSize: "14px",
        fontWeight: "500",
        padding: "12px 24px",
        borderRadius: "8px",
        border: "1px solid rgba(156, 163, 175, 0.3)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      expires={365}
      overlay
      overlayStyle={{
        background: "rgba(0, 0, 0, 0.3)",
        zIndex: 9998,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "900px",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#ffffff",
          }}
        >
          🍪 Cookie Notice
        </div>
        <div
          style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#d1d5db",
          }}
        >
          We use essential cookies to maintain your session and keep you logged
          in. We also use privacy-friendly analytics (Plausible) that
          doesn&apos;t use cookies or track personal data. By clicking
          &quot;Accept All&quot;, you consent to our use of cookies.{" "}
          <Link
            href="/privacy"
            style={{
              color: "#10b981",
              textDecoration: "underline",
              fontWeight: "500",
            }}
          >
            Learn more in our Privacy Policy
          </Link>
        </div>
      </div>
    </CookieConsentBanner>
  );
};

export default CookieConsent;
