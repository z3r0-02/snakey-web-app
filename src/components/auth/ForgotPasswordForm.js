"use client";

import { useState } from "react";
import styles from "@/app/(auth)/auth.module.css";
import { useTranslation } from "@/lib/LanguageContext";

export default function ForgotPasswordForm({ onBack }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError = touched && !email ? t("errEmailReq") : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);

    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || t("somethingWentWrong") });
        setLoading(false);
      }
    } catch {
      setMessage({ type: "error", text: t("somethingWentWrong") });
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <>
        <button onClick={onBack} className={styles.backLink} type="button">
          {t("backToLogin")}
        </button>

        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>{t("checkInbox")}</h1>
          <p className={styles.authSubtitle}>
            {t("resetSubPrefix")}<strong>{email}</strong>{t("resetSubSuffix")}
          </p>
        </div>

        <div
          className={`${styles.message} ${styles.success}`}
          style={{ marginTop: "0.5rem" }}
        >
          {t("resetNote")}
        </div>

        <button
          type="button"
          className={`${styles.submitBtn} ${styles.submitBtnFlush}`}
          style={{ marginTop: "1.5rem" }}
          onClick={onBack}
          id="btn-back-to-login"
        >
          {t("backToLoginBtn")}
        </button>
      </>
    );
  }

  return (
    <>
      <button onClick={onBack} className={styles.backLink} type="button">
        {t("backToLogin")}
      </button>

      <div className={styles.authHeader}>
        <h1 className={styles.authTitle}>{t("forgotPasswordTitle")}</h1>
        <p className={styles.authSubtitle}>
          {t("forgotPasswordSubtitle")}
        </p>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="reset-email" className={styles.label}>
            {t("email")}
          </label>
          <input
            id="reset-email"
            type="email"
            className={`${styles.input} ${emailError ? styles.inputError : ""}`}
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            autoComplete="email"
            autoFocus
          />
          {emailError && (
            <span className={styles.fieldError}>{emailError}</span>
          )}
        </div>

        <div className={`${styles.messageWrapper} ${styles.messageWrapperLogin}`}>
          {message && (
            <div className={`${styles.message} ${styles.error}`}>
              {message.text}
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`${styles.submitBtn} ${styles.submitBtnFlush}`}
          disabled={loading}
          id="btn-send-reset-link"
        >
          {loading ? t("sending") : t("sendResetLink")}
        </button>
      </form>
    </>
  );
}
