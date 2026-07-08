"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/LanguageContext";
import { setHostSession } from "@/lib/constants";
import styles from "./AuthDropdown.module.css";

export default function AuthDropdown({ onLoginSuccess }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useLayoutEffect(() => {
    if (!showDropdown) return;
    function computePosition() {
      const btn = toggleRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const width =
        window.innerWidth <= 540
          ? window.innerWidth - 24
          : Math.min(300, window.innerWidth - 24);
      const left = Math.min(
        Math.max(rect.right - width, 12),
        window.innerWidth - width - 12
      );
      setDropdownStyle({ top: rect.bottom + 4, left, width });
    }
    computePosition();
    window.addEventListener("resize", computePosition);
    return () => window.removeEventListener("resize", computePosition);
  }, [showDropdown]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setShowDropdown(false), 100);
  };

  const goToAuth = (view) => router.push(`/?view=${view}`);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username) {
      setError("errUsernameReq");
      return;
    }
    if (!password) {
      setError("errPasswordReq");
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
        setHostSession(false);
        setShowDropdown(false);
        onLoginSuccess(data.user);
      } else {
        setError(
          data.error === "Invalid username or password."
            ? "errInvalidCreds"
            : data.error
        );
      }
    } catch {
      setError("somethingWentWrong");
    }
    setLoading(false);
  }

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={toggleRef}
        className={styles.navLink}
        data-cy="nav-login-toggle"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        {t("logIn")} ▼
      </button>
      {showDropdown && dropdownStyle && (
        <div
          className={styles.dropdown}
          data-cy="auth-dropdown"
          style={dropdownStyle}
          role="dialog"
          aria-label={t("logIn")}
        >
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="text"
              placeholder={t("username")}
              aria-label={t("username")}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className={`${styles.input} ${error && !username ? styles.inputError : ""}`}
            />
            <div className={styles.passwordWrap}>
              <input
                type="password"
                placeholder={t("password")}
                aria-label={t("password")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className={`${styles.input} ${error && !password ? styles.inputError : ""}`}
              />
            </div>

            <div className={styles.errorRow}>
              <span className={styles.errorText}>
                {error ? (t(error) !== error ? t(error) : error) : ""}
              </span>
              <button
                type="button"
                onClick={() => goToAuth("forgotPassword")}
                className={styles.linkBtn}
              >
                {t("forgotPasswordLink")}
              </button>
            </div>

            <div className={styles.actions}>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? "..." : t("logIn")}
              </button>
              <div className={styles.registerPrompt}>
                {t("noAccount") || "Don't have an account? "}{" "}
                <button
                  type="button"
                  onClick={() => goToAuth("register")}
                  className={styles.registerLink}
                >
                  {t("createOne") || "Register"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
