"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./TermsModal.module.css";
import { useTranslation } from "@/lib/LanguageContext";

export default function TermsModal({ onClose }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!mounted) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 400); // Wait for the 0.4s animation to finish
  };

  return createPortal(
    <div className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`} onClick={handleClose}>
      <div className={`${styles.modal} ${isClosing ? styles.modalClosing : ""}`} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className={styles.closeBtn} aria-label="Close">
          ✕
        </button>

        <h1 className={styles.title}>{t("termsModalTitle")}</h1>
        <p className={styles.updated}>{t("termsUpdated")}</p>

        <section className={styles.section}>
          <h2 className={styles.heading}>{t("termsH1")}</h2>
          <p>
            {t("termsP1")}
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>{t("termsH2")}</h2>
          <p>
            {t("termsP2")}
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>{t("termsH3")}</h2>
          <p>
            {t("termsP3")}
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>{t("termsH4")}</h2>
          <p>
            {t("termsP4")}
          </p>
        </section>
      </div>
    </div>,
    document.body
  );
}
