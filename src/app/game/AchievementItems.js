"use client";

import { useTranslation } from "@/lib/LanguageContext";
import styles from "./AchievementItems.module.css";

// "All achievements unlocked" placeholder shown when nothing is left to earn.
export function AllAchievementsUnlockedMsg({ nowrap = false }) {
  const { t } = useTranslation();
  return (
    <div className={`${styles.allUnlocked} ${nowrap ? styles.allUnlockedNowrap : ""}`}>
      ✨ {t("allUnlocked") || "All achievements unlocked!"} ✨
    </div>
  );
}

// A single locked/available achievement row in the game-page lists.
export function AchievementListItem({ ach }) {
  const { t } = useTranslation();
  return (
    <li className={styles.achItem}>
      <span className={styles.achDot} />
      <div className={styles.achText}>
        <strong className={styles.achName}>
          {ach.hidden ? t("hidden_achievement") : t(`ach_${ach.id}_name`)}
        </strong>
        <span className={styles.achDesc}>
          {ach.hidden ? t("hidden_achievement_desc") : t(`ach_${ach.id}_desc`)}
        </span>
      </div>
    </li>
  );
}
