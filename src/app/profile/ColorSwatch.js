"use client";

import { useTranslation } from "@/lib/LanguageContext";
import { THEMES } from "@/lib/achievements";
import styles from "./profile.module.css";

export default function ColorSwatch({ colorId, isUnlocked, isActive, onEquip }) {
  const { t } = useTranslation();
  const theme = THEMES[colorId];
  if (!theme) return null;

  if (!isUnlocked) {
    return (
      <div
        className={`${styles.colorSwatch} ${styles.colorSwatchLocked}`}
        data-cy="color-swatch-locked"
        title={t("locked")}
      >
        <svg
          width="14"
          height="18"
          viewBox="0 0 24 24"
          fill="#ffffff"
          stroke="#9ca3af"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.swatchLockIcon}
        >
          <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${styles.colorSwatch} ${styles.colorSwatchInner} ${isActive ? styles.colorSwatchActive : ""}`}
      data-cy={isActive ? "color-swatch-active" : "color-swatch"}
      style={{
        background:
          theme.pattern === "zebra"
            ? `linear-gradient(135deg, ${theme.head} 50%, ${theme.body} 50%)`
            : theme.head,
        boxShadow: theme.glow
          ? `0 0 12px ${theme.pattern === "zebra" ? "rgba(0,0,0,0.8)" : colorId === "glow_yellow" ? theme.body : theme.head}`
          : "none",
      }}
      onClick={() => onEquip("color", colorId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEquip("color", colorId);
        }
      }}
      title={t(`color_${colorId}`)}
    >
      {theme.pattern === "wizard" && <div className={styles.patternWizard} />}
      {theme.pattern === "dots" && <div className={styles.patternDots} />}
      {theme.pattern === "lines" && <div className={styles.patternLines} />}
      {theme.pattern === "zigzag" && <div className={styles.patternZigzag}>Z</div>}
    </div>
  );
}
