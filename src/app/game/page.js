"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSnakeGame from "./useSnakeGame";
import styles from "./gameLayout.module.css";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useTranslation } from "@/lib/LanguageContext";
import GlobalFlags from "@/components/GlobalFlags";
import { GUEST_HOST_EMAIL, isHostSession } from "@/lib/constants";
import { resolveUserId } from "@/lib/user";
import AuthDropdown from "./AuthDropdown";
import GameOverlay from "./GameOverlay";
import { AllAchievementsUnlockedMsg, AchievementListItem } from "./AchievementItems";

const MAX_ATTEMPTS = 3;

function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function GamePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const LB_SECTIONS = [
    { id: "daily", label: t("lbToday"), emptyMsg: t("lbEmptyToday"), limit: 3 },
    { id: "weekly", label: t("lbWeekly"), emptyMsg: t("lbEmptyWeekly"), limit: 3 },
    { id: "overall", label: t("lbAllTime"), emptyMsg: t("lbEmptyAllTime"), limit: 10 },
  ];

  const [user, setUser] = useState(null);
  const [attempts, setAttempts] = useState({ date: new Date().toISOString().slice(0, 10), used: 0 });
  const [leaderboard, setLeaderboard] = useState({ daily: [], weekly: [], overall: [] });
  const [bestScore, setBestScore] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [globalDate, setGlobalDate] = useState(null);

  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [rewardGift, setRewardGift] = useState(null);
  const [showAllGameAchievements, setShowAllGameAchievements] = useState(false);
  const [achievementToastQueue, setAchievementToastQueue] = useState([]);
  const activeAchievementToast = achievementToastQueue[0] ?? null;
  const prevUnlockedRef = useRef(new Set());
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const [rouletteColorIndex, setRouletteColorIndex] = useState(0);
  const [rewardRevealed, setRewardRevealed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Detect newly unlocked achievements and queue a toast for each.
  useEffect(() => {
    const prev = prevUnlockedRef.current;
    const newlyUnlocked = [...unlockedAchievements].filter(id => !prev.has(id));
    if (newlyUnlocked.length > 0) {
      const newlyUnlockedAchievements = newlyUnlocked.filter((id) =>
        ACHIEVEMENTS.some((a) => a.id === id)
      );
      if (newlyUnlockedAchievements.length > 0) {
        setAchievementToastQueue((q) => [...q, ...newlyUnlockedAchievements]);
      }
    }
    prevUnlockedRef.current = new Set(unlockedAchievements);
  }, [unlockedAchievements]);

  // Dismiss the currently-showing toast after 3.5s.
  useEffect(() => {
    if (achievementToastQueue.length === 0) return;
    const timer = setTimeout(() => {
      setAchievementToastQueue((q) => q.slice(1));
    }, 3500);
    return () => clearTimeout(timer);
  }, [achievementToastQueue]);

  const attemptsLeft = MAX_ATTEMPTS - attempts.used;
  const isHost = user?.email === GUEST_HOST_EMAIL;
  const canPlay = attemptsLeft > 0;

  // --- Info panel (Game Guide + Achievements) and Leaderboard column ---
  const infoSectionRef = useRef(null);
  const achListRef = useRef(null);
  const [achListMaxHeight, setAchListMaxHeight] = useState(null);

  const leaderboardSectionRef = useRef(null);
  const allTimeListRef = useRef(null);
  const [allTimeListMaxHeight, setAllTimeListMaxHeight] = useState(null);

  useLayoutEffect(() => {
    function recompute() {
      if (window.innerWidth <= 1400) {
        setAchListMaxHeight(null);
        setAllTimeListMaxHeight(null);
        return;
      }

      const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      // Mirrors .canvasWrap's own sizing formula in gameLayout.module.css
      const boardSize = Math.min(648, window.innerWidth, window.innerHeight - 13 * remPx);
      const cap = boardSize - 58;

      const capList = (sectionRef, listRef, setMaxHeight) => {
        const section = sectionRef.current;
        const list = listRef.current;
        if (!section || !list) {
          setMaxHeight(null);
          return;
        }
        const prevMaxHeight = list.style.maxHeight;
        list.style.maxHeight = "none";
        const otherHeight = section.scrollHeight - list.scrollHeight;
        list.style.maxHeight = prevMaxHeight;
        const available = Math.max(60, cap - otherHeight);
        const result = list.scrollHeight > available ? available : null;
        setMaxHeight(result);
      };

      capList(infoSectionRef, achListRef, setAchListMaxHeight);
      capList(leaderboardSectionRef, allTimeListRef, setAllTimeListMaxHeight);
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [unlockedAchievements, leaderboard, showAllGameAchievements, mounted]);

  const handleGameOver = useCallback(
    (finalScore, crashReason) => {
      if (!user) return;

      const userId = resolveUserId(user);

      // Update local best score for this session (important for host users)
      setBestScore(prev => Math.max(prev, finalScore));

      if (isHost) {
        // Host uses local session state for attempts
        setAttempts(prev => ({ ...prev, used: prev.used + 1 }));
        return;
      }

      fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date: globalDate }),
      })
        .then(async (attemptRes) => {
          if (!attemptRes.ok) return;
          const attemptData = await attemptRes.json();
          setAttempts({ date: globalDate, used: attemptData.used });

          if (attemptData.used === 3) {
            fetch("/api/rewards", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, date: globalDate, finalScore }),
            })
              .then(async (rewardRes) => {
                if (!rewardRes.ok) return;
                const rewardData = await rewardRes.json();
                if (rewardData.success && rewardData.rewardId) {
                  setRewardGift(rewardData.rewardId);
                  setRewardRevealed(false);
                }
              })
              .catch((e) => console.error("Reward fetch error:", e));
          }
        })
        .catch((err) => console.error("Failed to update attempts:", err));

      if (finalScore > 0) {
        fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            username: user.name || user.email,
            avatar: user.avatar,
            score: finalScore,
          }),
        })
          .then(async (lbRes) => {
            if (!lbRes.ok) return;
            const lbData = await lbRes.json();
            setLeaderboard(lbData);

            const userScores = lbData.overall.filter(
              (e) => e.name === (user.name || user.email)
            );
            const best = userScores.length > 0 ? Math.max(...userScores.map((e) => e.score)) : 0;
            setBestScore(best);
          })
          .catch((err) => console.error("Failed to save score:", err));
      }

      fetch("/api/achievements/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, score: finalScore, crashReason, date: globalDate, activeColor: user?.activeSnakeColor || "default" }),
      })
        .then(async (achRes) => {
          if (!achRes.ok) return;
          const achData = await achRes.json();
          if (achData.newlyUnlocked && achData.newlyUnlocked.length > 0) {
            setUnlockedAchievements(prev => {
              const updated = new Set(prev);
              achData.newlyUnlocked.forEach(id => updated.add(id));
              return updated;
            });
          }
        })
        .catch((e) => console.error("Failed to evaluate achievements:", e));
    },
    [user, isHost, globalDate]
  );


  const userSnakeColor = user?.activeSnakeColor || "default";

  const { canvasRef, score, gameState, startGame, CANVAS_SIZE, countdown, changeDirection } = useSnakeGame({
    onGameOver: handleGameOver,
    disabled: !canPlay || !globalDate,
    globalDateStr: globalDate,
    themeId: userSnakeColor,
  });

  useEffect(() => {
    const initData = async () => {
      const u = getUser();
      if (!u) {
        router.push("/?view=login");
        return;
      }

      if (u.email === GUEST_HOST_EMAIL && !isHostSession()) {
        localStorage.removeItem("user");
        router.replace("/");
        return;
      }

      setUser(u);

      const userId = resolveUserId(u);

      const isHostUser = userId === GUEST_HOST_EMAIL;

      const applyLeaderboard = (lbRes) => {
        if (!lbRes.ok) return;
        return lbRes.json().then((lbData) => {
          setLeaderboard(lbData);
          const userScores = lbData.overall.filter((e) => e.name === (u.name || u.email));
          const best = userScores.length > 0 ? Math.max(...userScores.map((e) => e.score)) : 0;
          setBestScore(best);
        });
      };
      const leaderboardPromise = fetch("/api/leaderboard")
        .then(applyLeaderboard)
        .catch((e) => console.error("Failed to fetch leaderboard:", e));

      try {
        const achievementsPromise = isHostUser ? null : fetch(`/api/achievements?userId=${userId}`);

        const timeRes = await fetch("/api/time");
        const timeData = await timeRes.json();
        const serverToday = timeData.dateStr;
        setGlobalDate(serverToday);

        if (isHostUser) {
          setAttempts({ date: serverToday, used: 0 });
          setMounted(true);
          return;
        }

        const [attRes, achRes] = await Promise.all([
          fetch(`/api/attempts?userId=${userId}&date=${serverToday}`),
          achievementsPromise,
        ]);

        if (achRes && achRes.ok) {
          const achData = await achRes.json();
          const initialUnlocked = new Set(achData.unlocked || []);
          prevUnlockedRef.current = initialUnlocked;
          setUnlockedAchievements(initialUnlocked);
        }

        if (attRes.ok) {
          const attData = await attRes.json();
          setAttempts({ date: serverToday, used: attData.used });
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }

      setMounted(true);
    };

    initData();
  }, [router, refreshKey]);

  function handleLogout() {
    localStorage.removeItem("user");
    router.push("/");
  }

  // Open an auth form on the home page.
  function goToAuth(view) {
    router.push(`/?view=${view}`);
  }

  function handleLoginSuccess(loggedInUser) {
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setMounted(false);
    setRefreshKey((prev) => prev + 1);
  }

  if (!mounted) return null;



  return (
    <div className={styles.gamePage}>
      {activeAchievementToast && (() => {
        const ach = ACHIEVEMENTS.find((a) => a.id === activeAchievementToast);
        if (!ach) return null;
        return (
          <div className={styles.achievementToast} data-cy="achievement-toast" key={activeAchievementToast} role="alert" aria-live="polite">
            <span className={styles.achievementToastIcon}>🏅</span>
            <div>
              <div className={styles.achievementToastLabel}>
                {t("achievementUnlockedLabel")}
              </div>
              <div className={styles.achievementToastName}>
                {t(`ach_${ach.id}_name`)}
              </div>
              <div className={styles.achievementToastDesc}>
                {t(`ach_${ach.id}_desc`)}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Nav */}
      <nav className={styles.nav}>
        <span className={`${styles.navBrand} ${styles.navBrandStatic}`}>
          <Image src="/dragon_logo.png" alt="Snakey Logo" width={360} height={120} className={styles.navBrandLogo} priority />
        </span>
        <div className={styles.navLinks}>
          {isHost && <AuthDropdown onLoginSuccess={handleLoginSuccess} />}
          {!isHost && (
            <Link href="/profile" className={styles.navLink} data-cy="nav-profile">
              {t("navProfile")}
            </Link>
          )}
          <Link href="/about" className={styles.navLink}>
            {t("navAboutUs")}
          </Link>
          {!isHost && (
            <button className={styles.navLink} data-cy="nav-logout" onClick={handleLogout}>
              {t("navLogOut")}
            </button>
          )}
          <GlobalFlags />
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.infoSection} ref={infoSectionRef}>
          <div className={`${styles.lbCard} ${styles.guideCard}`}>
            <div className={styles.lbHeader}>
              <h3 className={styles.lbTitle}>
                <span>📖</span> {t("gameGuide")}
              </h3>
            </div>
            <ul className={styles.infoList}>
              <li className={styles.infoBullet}>
                <span className={`${styles.infoDot} ${styles.infoDotYellow}`} />
                <span>
                  {t("guideYellow")} <strong className={styles.infoEmph}>{t("points10")}</strong>.
                </span>
              </li>
              <li className={styles.infoBullet}>
                <span className={`${styles.infoDot} ${styles.infoDotRed}`} />
                <span>
                  {t("guideRed")} <strong className={styles.infoEmph}>{t("points30")}</strong>
                </span>
              </li>
              <li className={styles.infoBullet}>
                <span className={styles.infoDot} />
                <span>{t("guideReset")}</span>
              </li>
              <li className={styles.infoBullet}>
                <span className={styles.infoDot} />
                <span>{t("guideBorders")}</span>
              </li>
            </ul>
          </div>

          {!isHost && (
            <div className={`${styles.lbCard} ${styles.achCard} ${styles.desktopOnly}`}>
              <div className={styles.lbHeader}>
                <h3 className={styles.lbTitle}>
                  <span>🏅</span> {t("achievementsTitle")}
                </h3>
              </div>
              {(() => {
                const visible = ACHIEVEMENTS.filter(a => !unlockedAchievements.has(a.id));
                if (visible.length === 0) return (
                  <AllAchievementsUnlockedMsg nowrap />
                );
                return (
                  <ul
                    ref={achListRef}
                    className={`${styles.infoList} ${styles.achList}`}
                    style={{ gap: "0.5rem", maxHeight: achListMaxHeight ?? undefined }}
                  >
                    {visible.map(ach => (
                      <AchievementListItem key={ach.id} ach={ach} />
                    ))}
                  </ul>
                );
              })()}
            </div>
          )}
        </div>

        {/* Game Section */}
        <div className={styles.gameSection}>
          {/* Hearts for attempts */}
          <div className={styles.hearts}>
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => {
              const filled = i < attemptsLeft;
              return (
                <svg
                  key={i}
                  className={`${styles.heart} ${filled ? styles.heartFilled : styles.heartEmpty}`}
                  data-cy={filled ? "heart-filled" : "heart-empty"}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              );
            })}
          </div>
          <span className="sr-only">{attemptsLeft} attempts remaining</span>

          {/* Canvas */}
          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className={styles.canvas}
              role="img"
              aria-label={t("gameGuide") || "Snake game"}
            />

            {/* Countdown badge (3..2..1) */}
            {gameState === "starting" && (
              <div className={styles.countdownOverlay}>
                <p className={styles.countdownNumber}>{countdown}</p>
              </div>
            )}

            {/* Idle / Game Over / Reward overlay */}
            <GameOverlay
              gameState={gameState}
              score={score}
              isHost={isHost}
              bestScore={bestScore}
              globalDate={globalDate}
              canPlay={canPlay}
              startGame={startGame}
              goToAuth={goToAuth}
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

            {/* Touch D-pad (mobile only) */}
            {gameState === "playing" && (
              <div className={styles.dpad}>
                <button
                  type="button"
                  className={`${styles.dpadBtn} ${styles.dpadUp}`}
                  data-cy="dpad-up"
                  aria-label="Move snake up"
                  onTouchStart={(e) => { e.preventDefault(); changeDirection("UP"); }}
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className={`${styles.dpadBtn} ${styles.dpadLeft}`}
                  data-cy="dpad-left"
                  aria-label="Move snake left"
                  onTouchStart={(e) => { e.preventDefault(); changeDirection("LEFT"); }}
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className={`${styles.dpadBtn} ${styles.dpadRight}`}
                  data-cy="dpad-right"
                  aria-label="Move snake right"
                  onTouchStart={(e) => { e.preventDefault(); changeDirection("RIGHT"); }}
                >
                  &gt;
                </button>
                <button
                  type="button"
                  className={`${styles.dpadBtn} ${styles.dpadDown}`}
                  data-cy="dpad-down"
                  aria-label="Move snake down"
                  onTouchStart={(e) => { e.preventDefault(); changeDirection("DOWN"); }}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>

          <p className={styles.controls}>
            {t("controlsPrefix")} <span className={styles.controlsKey}>↑</span>{" "}
            <span className={styles.controlsKey}>↓</span>{" "}
            <span className={styles.controlsKey}>←</span>{" "}
            <span className={styles.controlsKey}>→</span> {t("controlsOr")}{" "}
            <span className={styles.controlsKey}>W</span>{" "}
            <span className={styles.controlsKey}>A</span>{" "}
            <span className={styles.controlsKey}>S</span>{" "}
            <span className={styles.controlsKey}>D</span> {t("controlsSuffix")}
          </p>


        </div>

        {/* Achievements — mobile only, shown after game window */}
        {!isHost && (
          <div className={`${styles.lbCard} ${styles.mobileOnly}`} style={{ width: "100%" }} id="game-achievements-section">
            <div className={styles.lbHeader}>
              <h3 className={styles.lbTitle}>
                <span>🏅</span> {t("achievementsTitle")}
              </h3>
            </div>
            {(() => {
              const visible = ACHIEVEMENTS.filter(a => !unlockedAchievements.has(a.id));
              if (visible.length === 0) {
                return <AllAchievementsUnlockedMsg />;
              }
              return (
                <>
                  <ul className={styles.infoList} style={{ gap: "0.5rem", paddingRight: "0.5rem" }}>
                    {visible.map((ach, index) => {
                      if (!showAllGameAchievements && index >= 3) return null;
                      return (
                        <AchievementListItem key={ach.id} ach={ach} />
                      );
                    })}
                  </ul>
                  {visible.length > 3 && (
                    <button
                      className={styles.gameShowMoreBtn}
                      onClick={() => {
                        if (showAllGameAchievements) {
                          document.getElementById('game-achievements-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                        setShowAllGameAchievements(!showAllGameAchievements);
                      }}
                    >
                      {showAllGameAchievements ? (t("showLess") || "Show Less") : (t("showMore") || "Show More")}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Leaderboard */}
        <div className={styles.leaderboardSection} ref={leaderboardSectionRef}>
          <h2 className={styles.lbMainTitle}>🏆 {t("lbTitle")}</h2>
          {LB_SECTIONS.map((section) => {
            const entries = (leaderboard[section.id] || []).slice(0, section.limit);
            const isOverall = section.id === "overall";
            return (
              <div key={section.id} className={styles.lbCard}>
                <div className={styles.lbHeader}>
                  <h3 className={styles.lbTitle}>
                    {section.label}
                  </h3>
                </div>
                {entries.length === 0 ? (
                  <p className={styles.lbEmpty}>{section.emptyMsg}</p>
                ) : (
                  <ul
                    ref={isOverall ? allTimeListRef : null}
                    className={isOverall ? styles.lbListScrollable : styles.lbList}
                    style={isOverall && allTimeListMaxHeight ? { maxHeight: allTimeListMaxHeight } : {}}
                  >
                    {entries.map((entry, i) => {
                      const isUser =
                        entry.name === (user?.name || user?.email);
                      return (
                        <li
                          key={`${section.id}-${entry.name}-${entry.score}-${i}`}
                          className={`${styles.lbItem} ${isUser ? styles.lbItemHighlight : ""}`}
                        >
                          {entry.avatar ? (
                            <Image
                              src={entry.avatar}
                              alt={entry.name}
                              width={24}
                              height={24}
                              className={styles.lbAvatar}
                            />
                          ) : (
                            <span className={styles.lbAvatarFallback}>
                              {entry.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className={styles.lbNameRow}>
                            <span className={`${styles.lbName} ${styles.lbNameInline}`}>{entry.name}</span>
                            {entry.title && (
                              <span className={styles.lbEntryTitle}>
                                {t(`title_${entry.title}`)}
                              </span>
                            )}
                          </div>
                          <span className={styles.lbScore}>{entry.score}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}
