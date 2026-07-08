"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useTranslation } from "@/lib/LanguageContext";
import GlobalFlags from "@/components/GlobalFlags";
import { GUEST_HOST_EMAIL, setHostSession } from "@/lib/constants";

export default function About() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  function handleLogout() {
    localStorage.removeItem("user");
    if (typeof window !== "undefined") setHostSession(false);
    router.push("/");
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw && raw !== "null" && raw !== "undefined") {
        const user = JSON.parse(raw);
        if (user && (user.email || user.username)) {
          setHasSession(true);
          if (user.email === GUEST_HOST_EMAIL) {
            setHostSession(true);
          } else {
            setIsLoggedIn(true);
          }
        }
      }
    } catch {
      // If no user data, do nothing (user is not logged in).
    }
  }, []);

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <span className={`${styles.navBrand} ${styles.navBrandStatic}`}>
          <Image src="/dragon_logo.png" alt="Snakey Logo" width={360} height={120} className={styles.navBrandLogo} priority />
        </span>
        <div className={styles.navLinks}>
          {isLoggedIn && (
            <Link href="/profile" className={styles.navLink}>
              {t("navProfile")}
            </Link>
          )}
          {hasSession && (
            <Link href="/game" className={styles.navLink}>
              {t("backToGame")}
            </Link>
          )}
          {isLoggedIn && (
            <button onClick={handleLogout} className={styles.navLink} type="button">
              {t("navLogOut")}
            </button>
          )}
          <GlobalFlags />
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.profileImageWrapper}>
            <Image
              src="/profile.jpg"
              alt="Profile Photo"
              fill
              className={styles.profileImage}
              priority
            />
          </div>
          <h2 className={styles.sectionTitle}>{t("aboutTitle")}</h2>
          <p className={styles.paragraph}>
            {t("aboutIntro")}
          </p>
          <p className={styles.paragraph}>
            {t("aboutP1")}
          </p>
          <p className={styles.paragraph}>
            {t("aboutP2")}
          </p>
          <p className={styles.paragraph}>
            {t("aboutP3")}
          </p>
          <h2 className={styles.sectionTitle}>{t("builtWith")}</h2>
          
          <div className={styles.techIconsRow}>
            <img src="https://cdn.simpleicons.org/nextdotjs" alt="Next.js" />
            <img src="https://cdn.simpleicons.org/react" alt="React" />
            <img src="https://cdn.simpleicons.org/javascript" alt="JavaScript" />
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg" alt="CSS" />
            <img src="https://cdn.simpleicons.org/html5" alt="HTML5" />
            <img src="https://cdn.simpleicons.org/sqlite" alt="SQLite" />
            <img src="https://cdn.simpleicons.org/cypress" alt="Cypress" />
            <img src="https://cdn.simpleicons.org/postman" alt="Postman" />
          </div>

          <p className={styles.paragraph}>
            {t("builtWithIntro")}
          </p>
          <ul className={styles.techList}>
            <li>
              <span className={styles.techLabel}>{t("techFrontend")}</span> {t("techFrontendDesc")}
            </li>
            <li>
              <span className={styles.techLabel}>{t("techEngine")}</span> {t("techEngineDesc")}
            </li>
            <li>
              <span className={styles.techLabel}>{t("techBackend")}</span> {t("techBackendDesc")}
            </li>
            <li>
              <span className={styles.techLabel}>{t("techAuth")}</span> {t("techAuthDesc")}
            </li>
            <li>
              <span className={styles.techLabel}>{t("techQuality")}</span> {t("techQualityDesc")}
            </li>
          </ul>

          <p className={styles.paragraph} style={{ marginTop: "2rem" }}>
            {t("aboutOutro")}
          </p>

          <div className={styles.socials}>
            <a
              href="https://www.linkedin.com/in/thimylinhbui"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
              </svg>
            </a>

            <a
              href="https://github.com/z3r0-02"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
              </svg>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
