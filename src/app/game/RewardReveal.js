"use client";

import { THEMES, GLOWING_COLORS } from "@/lib/achievements";
import { useTranslation } from "@/lib/LanguageContext";
import styles from "./GameOverlay.module.css";

// The end-of-day reward roulette: a wrapped gift the player clicks to spin
// through the glowing colours before landing on (and unlocking) one.
export default function RewardReveal({
  rewardGift,
  isRouletteSpinning,
  rouletteColorIndex,
  rewardRevealed,
  setIsRouletteSpinning,
  setRouletteColorIndex,
  setRewardRevealed,
  setUnlockedAchievements,
  setRewardGift,
}) {
  const { t } = useTranslation();

  const spin = () => {
    setIsRouletteSpinning(true);
    let ticks = 0;
    const maxTicks = 30;
    const interval = setInterval(() => {
      ticks++;
      setRouletteColorIndex((prev) => (prev + 1) % GLOWING_COLORS.length);
      if (ticks >= maxTicks) {
        clearInterval(interval);
        setIsRouletteSpinning(false);
        setRewardRevealed(true);
        setUnlockedAchievements((prev) => {
          const updated = new Set(prev);
          updated.add(rewardGift);
          return updated;
        });
      }
    }, 100);
  };

  if (isRouletteSpinning) {
    return (
      <div className={styles.rewardBox}>
        <h2 className={styles.spinTitle}>{t("spinningReward")}</h2>
        <div
          className={styles.spinSwatch}
          style={{
            background: THEMES[GLOWING_COLORS[rouletteColorIndex]].head,
            border: `2px solid ${THEMES[GLOWING_COLORS[rouletteColorIndex]].body}`,
          }}
        />
      </div>
    );
  }

  if (!rewardRevealed) {
    return (
      <div className={styles.rewardBox}>
        <div className={styles.giftIcon} onClick={spin}>
          🎁
        </div>
        <p className={styles.giftHint}>{t("clickToOpen")}</p>
      </div>
    );
  }

  return (
    <div className={styles.rewardBoxRevealed}>
      <h2 className={styles.revealTitle}>{t("rewardUnlocked")}</h2>
      <div
        className={styles.revealSwatch}
        style={{
          background: THEMES[rewardGift]?.head,
          border: `2px solid ${THEMES[rewardGift]?.body}`,
          boxShadow: `0 0 20px ${THEMES[rewardGift]?.head}`,
        }}
      />
      <p className={styles.revealName}>{t(`color_${rewardGift}`)}</p>
      <button className={styles.awesomeBtn} onClick={() => setRewardGift(null)}>
        {t("awesomeBtn")}
      </button>
    </div>
  );
}
