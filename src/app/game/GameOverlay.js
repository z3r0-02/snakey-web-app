"use client";

import { useTranslation } from "@/lib/LanguageContext";
import RewardReveal from "./RewardReveal";
import styles from "./gameLayout.module.css";
import overlayStyles from "./GameOverlay.module.css";

export default function GameOverlay({
  gameState,
  score,
  isHost,
  bestScore,
  globalDate,
  canPlay,
  startGame,
  goToAuth,
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

  // Only shown while idle / over
  if (gameState === "playing" || gameState === "crashed" || gameState === "starting") {
    return null;
  }

  return (
    <div className={styles.overlay}>
      {gameState === "over" ? (
        rewardGift ? (
          <RewardReveal
            rewardGift={rewardGift}
            isRouletteSpinning={isRouletteSpinning}
            rouletteColorIndex={rouletteColorIndex}
            rewardRevealed={rewardRevealed}
            setIsRouletteSpinning={setIsRouletteSpinning}
            setRouletteColorIndex={setRouletteColorIndex}
            setRewardRevealed={setRewardRevealed}
            setUnlockedAchievements={setUnlockedAchievements}
            setRewardGift={setRewardGift}
          />
        ) : (
          <>
            <p className={styles.overlayTitle}>{t("gameOverTitle")}</p>
            <p className={styles.overlayScore}>
              {t("scoreLabel")}{" "}
              <span className={styles.overlayScoreValue}>{score}</span>
            </p>
            {isHost && bestScore > 0 && (
              <p className={`${styles.overlayScore} ${overlayStyles.sessionBest}`}>
                {t("sessionBest")}{" "}
                <span className={`${styles.overlayScoreValue} ${overlayStyles.sessionBestValue}`}>
                  {bestScore}
                </span>
              </p>
            )}
            {isHost && (score > 0 || bestScore > 0) && (
              <p className={styles.hostPrompt}>
                <button type="button" className={styles.hostPromptLink} onClick={() => goToAuth("login")}>
                  {t("logIn")}
                </button>{" "}
                {t("hostPromptOr")}{" "}
                <button type="button" className={styles.hostPromptLink} onClick={() => goToAuth("register")}>
                  {t("register")}
                </button>{" "}
                {t("hostPromptSuffix")}
              </p>
            )}
          </>
        )
      ) : (
        <p className={styles.overlayTitle}>🐍 Snake</p>
      )}

      {gameState !== "starting" && (!rewardGift || rewardRevealed) &&
        (!globalDate ? (
          <button className={styles.playBtn} disabled id="btn-play">
            {t("loadingMap")}
          </button>
        ) : canPlay ? (
          <button className={styles.playBtn} onClick={startGame} id="btn-play">
            {gameState === "over" ? t("playAgainBtn") : t("startBtn")}
          </button>
        ) : (
          <div className={styles.noAttempts}>
            <p>{t("noAttemptsToday")}</p>
            <p className={styles.noAttemptsHighlight}>{t("noAttemptsTomorrow")}</p>
          </div>
        ))}
    </div>
  );
}
