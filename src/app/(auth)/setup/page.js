"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { REDIRECT_DELAY_MS } from "@/lib/constants";

const AVATARS = [
  { id: "fox", src: "/avatars/fox.png", label: "Fox" },
  { id: "panda", src: "/avatars/panda.png", label: "Panda" },
  { id: "owl", src: "/avatars/owl.png", label: "Owl" },
  { id: "cat", src: "/avatars/cat.png", label: "Cat" },
  { id: "robot", src: "/avatars/robot.png", label: "Robot" },
];

export default function SetupPage() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only allow access if user just registered (has pending setup flag)
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.push("/?view=register");
      return;
    }
    let user;
    try {
      user = JSON.parse(raw);
    } catch {
      localStorage.removeItem("user");
      router.push("/?view=register");
      return;
    }
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
      setMessage({ type: "error", text: "Please pick a profile picture." });
      return;
    }

    if (!username.trim()) {
      setMessage({ type: "error", text: "Please choose a username." });
      return;
    }

    if (username.trim().length < 3) {
      setMessage({ type: "error", text: "Username must be at least 3 characters." });
      return;
    }

    if (username.trim().length > 20) {
      setMessage({ type: "error", text: "Username must be 20 characters or less." });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setMessage({ type: "error", text: "Username can only contain letters, numbers, and underscores." });
      return;
    }

    setLoading(true);

    try {
      const raw = localStorage.getItem("user");
      const user = JSON.parse(raw);
      const avatarData = AVATARS.find((a) => a.id === selectedAvatar);

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
        setMessage({ type: "error", text: data.error || "Setup failed." });
        setLoading(false);
        return;
      }

      // Update the stored user with the response from the DB
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage({ type: "success", text: "Profile set up! Redirecting…" });
      setTimeout(() => router.push("/game"), REDIRECT_DELAY_MS);
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Set up your profile</h1>
          <p className={styles.authSubtitle}>
            Pick an avatar and choose your username
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          {/* Avatar Grid */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Choose your avatar</label>
            <div className={styles.avatarGrid}>
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`${styles.avatarOption} ${
                    selectedAvatar === avatar.id ? styles.avatarOptionSelected : ""
                  }`}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  aria-label={`Select ${avatar.label} avatar`}
                  id={`avatar-${avatar.id}`}
                >
                  <Image
                    src={avatar.src}
                    alt={avatar.label}
                    width={80}
                    height={80}
                    className={styles.avatarImg}
                  />
                  <span className={styles.avatarLabel}>{avatar.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Username Input */}
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              placeholder="Choose a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
              autoFocus
            />
            <span className={styles.inputHint}>
              3–20 characters, letters, numbers & underscores only
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
            {loading ? "Setting up…" : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
