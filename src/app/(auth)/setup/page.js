"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/LanguageContext";
import styles from "../auth.module.css";
import { REDIRECT_DELAY_MS } from "@/lib/constants";

const AVATARS = [
  { id: "fox", src: "/avatars/fox.png", labelKey: "avatarFox" },
  { id: "panda", src: "/avatars/panda.png", labelKey: "avatarPanda" },
  { id: "owl", src: "/avatars/owl.png", labelKey: "avatarOwl" },
  { id: "cat", src: "/avatars/cat.png", labelKey: "avatarCat" },
  { id: "robot", src: "/avatars/robot.png", labelKey: "avatarRobot" },
];

export default function SetupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only allow access if user just registered (has pending setup flag)
    const raw = localStorage.getItem("user");
    // If no user data, redirect to registration
    if (!raw) {
      router.push("/?view=register");
      return;
    }
    let user;
    // If user data is corrupted, clear it and redirect to registration
    try {
      user = JSON.parse(raw);
    } catch {
      localStorage.removeItem("user");
      router.push("/?view=register");
      return;
    }
    // If user has already completed setup, redirect to game
    if (!user._pendingSetup) {
      router.push("/game");
      return;
    }
    setMounted(true);
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!selectedAvatar) {
      setMessage({ type: "error", text: t("setupErrAvatar") });
      return;
    }

    if (!username.trim()) {
      setMessage({ type: "error", text: t("errUsernameReq") });
      return;
    }

    if (username.trim().length < 3) {
      setMessage({ type: "error", text: t("setupErrUserShort") });
      return;
    }

    if (username.trim().length > 20) {
      setMessage({ type: "error", text: t("setupErrUserLong") });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setMessage({ type: "error", text: t("setupErrUserChars") });
      return;
    }

    setLoading(true);

    try {
      const raw = localStorage.getItem("user");
      const user = JSON.parse(raw);
      const avatarData = AVATARS.find((a) => a.id === selectedAvatar);
      // Send setup data to the server
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          username: username.trim(),
          avatar: avatarData.src,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const text =
          data.error === "This username is already taken."
            ? t("errUsernameTaken")
            : data.error || t("setupErrGeneric");
        setMessage({ type: "error", text });
        setLoading(false);
        return;
      }

      // Update the stored user with the response from the DB
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage({ type: "success", text: t("setupSuccess") });
      setTimeout(() => router.push("/game"), REDIRECT_DELAY_MS);
    } catch {
      setMessage({ type: "error", text: t("somethingWentWrong") });
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>{t("setupTitle")}</h1>
          <p className={styles.authSubtitle}>
            {t("setupSubtitle")}
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          {/* Avatar Grid */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t("setupChooseAvatar")}</label>
            <div className={styles.avatarGrid}>
              {AVATARS.map((avatar) => {
                const label = t(avatar.labelKey);
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    className={`${styles.avatarOption} ${
                      selectedAvatar === avatar.id ? styles.avatarOptionSelected : ""
                    }`}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    aria-label={t("setupSelectAvatarAria").replace("{name}", label)}
                    id={`avatar-${avatar.id}`}
                  >
                    <Image
                      src={avatar.src}
                      alt={label}
                      width={80}
                      height={80}
                      className={styles.avatarImg}
                    />
                    <span className={styles.avatarLabel}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username Input */}
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              {t("username")}
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              placeholder={t("setupUsernamePlh")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
              autoFocus
            />
            <span className={styles.inputHint}>
              {t("setupUsernameHint")}
            </span>
          </div>

          {message && (
            <div
              className={`${styles.message} ${
                message.type === "success" ? styles.success : styles.error
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            id="btn-complete-setup"
          >
            {loading ? t("setupBtnLoading") : t("setupBtnComplete")}
          </button>
        </form>
      </div>
    </div>
  );
}
