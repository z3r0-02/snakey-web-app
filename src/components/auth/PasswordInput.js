"use client";

import { useState } from "react";
import styles from "@/app/(auth)/auth.module.css";

export default function PasswordInput({ className = "", ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div className={styles.passwordWrap}>
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${className} ${styles.passwordInput}`}
      />
      <button
        type="button"
        className={styles.passwordToggle}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <circle cx="9" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3 15 15 3" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <circle cx="9" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        )}
      </button>
    </div>
  );
}
