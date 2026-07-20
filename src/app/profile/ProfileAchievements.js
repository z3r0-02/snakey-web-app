"use client";

import { useRef } from "react";
import { useTranslation } from "@/lib/LanguageContext";
import { ACHIEVEMENTS } from "@/lib/achievements";
import styles from "./profile.module.css";

export default function ProfileAchievements({
  unlockedAchievements,
  showAllAchievements,
  setShowAllAchievements,
}) {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  const unlockedCount = Array.from(unlockedAchievements).filter((id) =>
    ACHIEVEMENTS.find((a) => a.id === id)
  ).length;

  return (
    <div ref={sectionRef} className={styles.achievementsCard}>
      <div className={`${styles.details} ${styles.achievementsDetails}`}>
        <div className={styles.achHeader}>
          <h2 className={`${styles.detailsTitle} ${styles.achHeaderTitle}`}>
            {t("achievementsTitle")}
          </h2>
          <span data-cy="achievement-counter" className={styles.achCounter}>
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className={styles.achScroll}>
          {ACHIEVEMENTS.map((ach, index) => {
            const isUnlocked = unlockedAchievements.has(ach.id);
            const isMobileHidden = !showAllAchievements && index >= 3;

            return (
              <div
                key={ach.id}
                className={`${styles.achRow} ${isMobileHidden ? styles.mobileHidden : ""}`}
                style={{ opacity: isUnlocked ? 1 : 0.5, filter: isUnlocked ? "none" : "grayscale(100%)" }}
              >
                <div className={styles.achRowHead}>
                  <h3 className={styles.achRowName}>
                    {ach.hidden && !isUnlocked ? t("hidden_achievement") : t(`ach_${ach.id}_name`)}
                  </h3>
                  {!isUnlocked && (
                    <svg
                      width="12"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="#ffffff"
                      stroke="#9ca3af"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.achLockIcon}
                    >
                      <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" />
                    </svg>
                  )}
                </div>
                <p className={styles.achRowDesc}>
                  {ach.hidden && !isUnlocked ? t("hidden_achievement_desc") : t(`ach_${ach.id}_desc`)}
                </p>
              </div>
            );
          })}
          {ACHIEVEMENTS.length > 3 && (
            <button
              className={styles.mobileShowMoreBtn}
              onClick={() => {
                if (showAllAchievements) {
                  sectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }
                setShowAllAchievements(!showAllAchievements);
              }}
            >
              {showAllAchievements ? (t("showLess") || "Show Less") : (t("showMore") || "Show More")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
