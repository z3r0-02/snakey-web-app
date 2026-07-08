"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(auth)/auth.module.css";
import PasswordInput from "./PasswordInput";
import { useTranslation } from "@/lib/LanguageContext";
import { REDIRECT_DELAY_MS } from "@/lib/constants";

export default function LoginForm({ onBack, onRegister, onForgotPassword }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!username) errs.username = t("errUsernameReq");
    if (!password) errs.password = t("errPasswordReq");
    return errs;
  }

  const errors = validate();

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setTouched({ username: true, password: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage({ type: "success", text: t("loginSuccess") });
        setTimeout(() => router.push("/game"), REDIRECT_DELAY_MS);
      } else {
        setMessage({ type: "error", text: data.error });
        setLoading(false);
      }
    } catch {
      setMessage({ type: "error", text: t("somethingWentWrong") });
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={onBack} className={styles.backLink} type="button">
        {t("back")}
      </button>

      <div className={styles.authHeader}>
        <h1 className={styles.authTitle}>{t("welcomeBack")}</h1>
        <p className={styles.authSubtitle}>
          {t("signInSubtitle")}
        </p>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>
            {t("username")}
          </label>
          <input
            id="username"
            type="text"
            className={`${styles.input} ${touched.username && errors.username ? styles.inputError : ""}`}
            placeholder={t("usernamePlaceholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={handleBlur("username")}
            autoComplete="username"
          />
          {touched.username && errors.username && (
            <span className={styles.fieldError}>{errors.username}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            {t("password")}
          </label>
          <PasswordInput
            id="password"
            className={`${styles.input} ${touched.password && errors.password ? styles.inputError : ""}`}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={handleBlur("password")}
            autoComplete="current-password"
          />
          {touched.password && errors.password && (
            <span className={styles.fieldError}>{errors.password}</span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={onForgotPassword}
            className={styles.authFooterLink}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontSize: '0.8rem', cursor: 'pointer' }}
            id="btn-forgot-password"
          >
            {t("forgotPasswordLink")}
          </button>
        </div>

        {/* Always rendered to reserve space, so the card doesn't resize when a
            message appears. */}
        <div className={`${styles.messageWrapper} ${styles.messageWrapperLogin}`}>
          {message && (
            <div
              className={`${styles.message} ${
                message.type === "success" ? styles.success : styles.error
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`${styles.submitBtn} ${styles.submitBtnFlush}`}
          disabled={loading}
          id="btn-submit-login"
        >
          {loading ? t("signingIn") : t("signIn")}
        </button>
      </form>

      <p className={styles.authFooter}>
        {t("noAccount")}
        <button onClick={onRegister} type="button" className={styles.authFooterLink} style={{background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer'}}>
          {t("createOne")}
        </button>
      </p>
    </>
  );
}
