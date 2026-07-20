"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import pageStyles from "@/app/page.module.css";
import styles from "@/app/(auth)/auth.module.css";
import PasswordInput from "@/components/auth/PasswordInput";
import { useTranslation } from "@/lib/LanguageContext";
import { PASSWORD_ERROR_LOCALE_KEYS, RESET_TOKEN_ERROR_LOCALE_KEYS } from "@/lib/validation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const displayMessage = message ?? (!token ? { type: "error", text: t("errNoToken") } : null);

  // After a successful reset, count down and auto-redirect to login.
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      router.push("/?view=login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, router]);

  function validate() {
    const errs = {};
    if (!password) errs.password = t("errPasswordReq") || "Password is required.";
    else if (password.length < 8) errs.password = t("errPassShort");
    else if (!/[A-Z]/.test(password)) errs.password = t("errPassUpper");
    else if (!/[0-9]/.test(password)) errs.password = t("errPassNum");
    if (!confirm) errs.confirm = t("errConfirmReq") || "Please confirm your password.";
    else if (password && confirm && password !== confirm) errs.confirm = t("errPassMatch");
    return errs;
  }

  const errors = validate();

  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setTouched({ password: true, confirm: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        // Server-side password re-check or token validation failed
        const localeKey = PASSWORD_ERROR_LOCALE_KEYS[data.error] || RESET_TOKEN_ERROR_LOCALE_KEYS[data.error];
        const text = localeKey ? t(localeKey) : data.error || t("somethingWentWrong");
        setMessage({ type: "error", text });
        setLoading(false);
      }
    } catch {
      setMessage({ type: "error", text: t("somethingWentWrong") });
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className={pageStyles.fadeTransition}
        style={{ display: "flex", flexDirection: "column", minHeight: "440px" }}
      >
        <div aria-hidden="true" style={{ height: "22px", marginBottom: "var(--space-md)" }} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className={styles.successIcon}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M5 12.5 10 17.5 19 7"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className={styles.authHeader} style={{ textAlign: "center", marginBottom: 0 }}>
            <h1 className={styles.authTitle}>{t("resetSuccessTitle")}</h1>
            <p className={styles.authSubtitle}>
              {t("resetSuccessSubtitle")}
            </p>
          </div>

          <button
            type="button"
            className={`${styles.submitBtn} ${styles.submitBtnFlush}`}
            style={{ marginTop: "1.5rem" }}
            onClick={() => router.push("/?view=login")}
            id="btn-go-to-login"
          >
            {t("goToLoginBtn")}
          </button>

          <p className={styles.countdownNote}>
            {t("redirectingLogin").replace("{countdown}", countdown)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.fadeTransition}>
      <div aria-hidden="true" style={{ height: "22px", marginBottom: "var(--space-md)" }} />

      <div className={styles.authHeader}>
        <h1 className={styles.authTitle}>{t("setNewPassTitle")}</h1>
        <p className={styles.authSubtitle}>
          {t("setNewPassSubtitle")}
        </p>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="new-password" className={styles.label}>
            {t("newPassLabel")}
          </label>
          <PasswordInput
            id="new-password"
            className={`${styles.input} ${touched.password && errors.password ? styles.inputError : ""}`}
            placeholder={t("newPassPlh")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={handleBlur("password")}
            autoComplete="new-password"
            autoFocus
          />
          {touched.password && errors.password && (
            <span className={styles.fieldError}>{errors.password}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirm-password" className={styles.label}>
            {t("confirmPassword")}
          </label>
          <PasswordInput
            id="confirm-password"
            className={`${styles.input} ${touched.confirm && errors.confirm ? styles.inputError : ""}`}
            placeholder={t("confirmPassPlh")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={handleBlur("confirm")}
            autoComplete="new-password"
          />
          {touched.confirm && errors.confirm && (
            <span className={styles.fieldError}>{errors.confirm}</span>
          )}
          <span
            aria-hidden="true"
            style={{ padding: "0.25rem 0 0", fontSize: "0.8rem", alignSelf: "flex-end", visibility: "hidden", userSelect: "none" }}
          >
            Forgot password?
          </span>
        </div>

        <div className={`${styles.messageWrapper} ${styles.messageWrapperLogin}`}>
          {displayMessage && (
            <div className={`${styles.message} ${displayMessage.type === "success" ? styles.success : styles.error}`}>
              {displayMessage.text}
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`${styles.submitBtn} ${styles.submitBtnFlush}`}
          disabled={loading || !token}
          id="btn-reset-password"
        >
          {loading ? t("resetBtnLoading") : t("resetBtn")}
        </button>
      </form>

      <p className={styles.authFooter}>
        {t("rememberIt")}{" "}
        <Link href="/?view=login" className={styles.authFooterLink}>
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={pageStyles.landing}>
      <div className={`${pageStyles.card} ${pageStyles.cardWide}`}>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
