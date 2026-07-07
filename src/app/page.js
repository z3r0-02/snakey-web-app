"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import TermsModal from "@/components/TermsModal";
import { LanguageProvider, useTranslation } from "@/lib/LanguageContext";

function MainContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("landing"); // "landing" | "login" | "register" | "forgotPassword"
  const [showTerms, setShowTerms] = useState(false);
  const [fromExternal, setFromExternal] = useState(false);
  const { t, lang, switchLang } = useTranslation();

  useEffect(() => {
    try {
      const requested = searchParams.get("view") || "landing";
      const wantsForm = requested === "login" || requested === "register";

      const user = localStorage.getItem("user");
      if (user && !wantsForm) {
        const u = JSON.parse(user);
        if (u.email !== "host@platform.local") {
          router.replace("/game");
          return;
        }
      }

      setView(requested);
      if (wantsForm) {
        setFromExternal(true);
      }
    } catch {
      // localStorage unavailable, default to landing
      setView("landing");
    }
    setReady(true);
  }, [searchParams, router]);

  function changeView(newView) {
    if (newView === "landing") {
      router.push("/");
    } else {
      router.push(`/?view=${newView}`);
    }
  }

  function handleBack() {
    if (fromExternal) {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        if (u && u.email === "host@platform.local") {
          window.__hostSession = true;
          router.push("/game");
          return;
        }
      } catch {
      }
    }
    setFromExternal(false);
    changeView("landing");
  }

  if (!ready) return null;

  return (
    <div className={styles.landing}>
      <div className={`${styles.card} ${view !== "landing" ? styles.cardWide : styles.cardLanding}`}>
        {view === "landing" && (
          <div className={styles.fadeTransition}>
            <div style={{ marginBottom: "var(--space-xl)", display: "flex", justifyContent: "center" }}>
              <Image 
                src="/dragon_logo.png" 
                alt="Snakey Logo" 
                width={240} 
                height={80} 
                style={{ 
                  objectFit: "contain"
                }} 
                priority
              />
            </div>

            {/* Welcome Text */}
            <h1 className={styles.title}>{t("welcomeToSnakey")}</h1>
            <p className={styles.subtitle}>
              {t("welcomeSubtitle")}
            </p>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button onClick={() => changeView("login")} className={styles.btnPrimary} id="btn-login">
                <span className={styles.btnIcon}>→</span>
                {t("logIn")}
              </button>

              <button onClick={() => changeView("register")} className={styles.btnSecondary} id="btn-register">
                <span className={styles.btnIcon}>✦</span>
                {t("createAccount")}
              </button>

              <div className={styles.divider}>
                <span className={styles.dividerLine}></span>
                <span className={styles.dividerText}>{t("or")}</span>
                <span className={styles.dividerLine}></span>
              </div>

              <Link href="/host" className={styles.btnGhost} id="btn-host">
                <span className={styles.btnIcon}>🏠</span>
                {t("continueAsHost")}
              </Link>
            </div>
          </div>
        )}

        {view === "login" && (
          <div className={styles.fadeTransition}>
            <LoginForm
              onBack={handleBack}
              onRegister={() => changeView("register")}
              onForgotPassword={() => changeView("forgotPassword")}
            />
          </div>
        )}

        {view === "forgotPassword" && (
          <div className={styles.fadeTransition}>
            <ForgotPasswordForm onBack={() => changeView("login")} />
          </div>
        )}

        {view === "register" && (
          <div className={styles.fadeTransition}>
            <RegisterForm
              onBack={handleBack}
              onLogin={() => changeView("login")}
            />
          </div>
        )}

        {view === "register" && (
          <p className={styles.terms}>
            {t("termsPrefix")}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className={styles.termsLink}
            >
              {t("termsLink")}
            </button>
            .
          </p>
        )}
      </div>

      {view === "landing" && (
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            onClick={() => switchLang("en")}
            style={{ background: "none", border: "none", cursor: "pointer", opacity: lang === "en" ? 1 : 0.4, transition: "opacity 0.2s", lineHeight: 0 }}
            title="English"
            data-cy="lang-en"
          >
            <span className="fi fi-gb" style={{ fontSize: "1.4rem" }} />
          </button>
          <button
            onClick={() => switchLang("cs")}
            style={{ background: "none", border: "none", cursor: "pointer", opacity: lang === "cs" ? 1 : 0.4, transition: "opacity 0.2s", lineHeight: 0 }}
            title="Čeština"
            data-cy="lang-cs"
          >
            <span className="fi fi-cz" style={{ fontSize: "1.4rem" }} />
          </button>
        </div>
      )}

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <MainContent />
    </Suspense>
  );
}
