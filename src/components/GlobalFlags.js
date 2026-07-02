"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/LanguageContext";

export default function GlobalFlags() {
  const pathname = usePathname();
  const { lang, switchLang } = useTranslation();

  // Don't show on the main landing page, because it already has its own flags
  if (pathname === "/") {
    return null;
  }

  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <button 
        onClick={() => switchLang("en")} 
        style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", opacity: lang === "en" ? 1 : 0.4, transition: "opacity 0.2s" }}
        aria-label="English"
      >
        🇬🇧
      </button>
      <button 
        onClick={() => switchLang("cs")} 
        style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", opacity: lang === "cs" ? 1 : 0.4, transition: "opacity 0.2s" }}
        title="Čeština"
      >
        🇨🇿
      </button>
    </div>
  );
}
