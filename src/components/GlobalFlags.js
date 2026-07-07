"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/LanguageContext";

export default function GlobalFlags() {
  const pathname = usePathname();
  const { lang, switchLang } = useTranslation();

  if (pathname === "/") {
    return null;
  }

  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <button
        onClick={() => switchLang("en")}
        style={{ background: "none", border: "none", cursor: "pointer", opacity: lang === "en" ? 1 : 0.4, transition: "opacity 0.2s", lineHeight: 0 }}
        aria-label="English"
        data-cy="lang-en"
      >
        <span className="fi fi-gb" style={{ fontSize: "1.1rem" }} />
      </button>
      <button
        onClick={() => switchLang("cs")}
        style={{ background: "none", border: "none", cursor: "pointer", opacity: lang === "cs" ? 1 : 0.4, transition: "opacity 0.2s", lineHeight: 0 }}
        title="Čeština"
        data-cy="lang-cs"
      >
        <span className="fi fi-cz" style={{ fontSize: "1.1rem" }} />
      </button>
    </div>
  );
}
