"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/LanguageContext";
import styles from "./GlobalFlags.module.css";

export default function GlobalFlags() {
  const pathname = usePathname();
  const { lang, switchLang } = useTranslation();

  if (pathname === "/") {
    return null;
  }

  return (
    <div className={styles.flags}>
      <button
        onClick={() => switchLang("en")}
        className={`${styles.flagBtn} ${lang === "en" ? styles.flagBtnActive : ""}`}
        aria-label="English"
        data-cy="lang-en"
      >
        <span className={`fi fi-gb ${styles.flagIcon}`} />
      </button>
      <button
        onClick={() => switchLang("cs")}
        className={`${styles.flagBtn} ${lang === "cs" ? styles.flagBtnActive : ""}`}
        title="Čeština"
        data-cy="lang-cs"
      >
        <span className={`fi fi-cz ${styles.flagIcon}`} />
      </button>
    </div>
  );
}
