"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSnakeGame from "./useSnakeGame";
import styles from "./gameLayout.module.css";
import { ACHIEVEMENTS, THEMES, GLOWING_COLORS } from "@/lib/achievements";
import { useTranslation } from "@/lib/LanguageContext";
import GlobalFlags from "@/components/GlobalFlags";

const MAX_ATTEMPTS = 3;

function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function AllAchievementsUnlockedMsg({ t, extraStyle }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 0.5rem", color: "var(--text-accent)", fontWeight: 600, textAlign: "center", fontSize: "0.9rem", ...extraStyle }}>
      ✨ {t("allUnlocked") || "All achievements unlocked!"} ✨
    </div>
  );
}

function AchievementListItem({ ach, t, styles }) {
  return (
    <li
      className={styles.infoBullet}
      style={{
        alignItems: "flex-start",
        padding: "0.5rem 0.75rem",
        background: "rgba(19, 35, 48, 0.03)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <span className={styles.infoDot} style={{ background: "var(--border-subtle)", marginTop: "0.4rem" }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <strong style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          {ach.hidden ? t("hidden_achievement") : t(`ach_${ach.id}_name`)}
        </strong>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          {ach.hidden ? t("hidden_achievement_desc") : t(`ach_${ach.id}_desc`)}
        </span>
      </div>
    </li>
  );
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
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const dropdownTimeoutRef = useRef(null);
  const authToggleRef = useRef(null);
  const [authDropdownStyle, setAuthDropdownStyle] = useState(null);

  useLayoutEffect(() => {
    if (!showAuthDropdown) return;
    function computePosition() {
      const btn = authToggleRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const width =
        window.innerWidth <= 540
          ? window.innerWidth - 24
          : Math.min(300, window.innerWidth - 24);
      const left = Math.min(
        Math.max(rect.right - width, 12),
        window.innerWidth - width - 12
      );
      setAuthDropdownStyle({ top: rect.bottom + 4, left, width });
    }
    computePosition();
    window.addEventListener("resize", computePosition);
    return () => window.removeEventListener("resize", computePosition);
  }, [showAuthDropdown]);

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

  // Dismiss (pop) the currently-showing toast after 3.5s.
  useEffect(() => {
    if (achievementToastQueue.length === 0) return;
    const timer = setTimeout(() => {
      setAchievementToastQueue((q) => q.slice(1));
    }, 3500);
    return () => clearTimeout(timer);
  }, [achievementToastQueue]);

  const handleMouseEnterAuth = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setShowAuthDropdown(true);
  };

  const handleMouseLeaveAuth = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setShowAuthDropdown(false);
    }, 100);
  };
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const attemptsLeft = MAX_ATTEMPTS - attempts.used;
  const isHost = user?.email === "host@platform.local";
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

      const userId = user.id || user.username || user.email;

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
        body: JSON.stringify({ userId, score: finalScore, crashReason, date: globalDate, activeColor: user?.active_snake_color || "default" }),
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


  const userSnakeColor = user?.active_snake_color || "default";

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

      if (u.email === "host@platform.local" && !window.__hostSession) {
        localStorage.removeItem("user");
        router.replace("/");
        return;
      }

      setUser(u);
      
      const userId = u.id || u.username || u.email;

      const isHostUser = userId === "host@platform.local";

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

  if (!mounted) return null;



  return (
    <div className={styles.gamePage}>
      {activeAchievementToast && (() => {
        const ach = ACHIEVEMENTS.find((a) => a.id === activeAchievementToast);
        if (!ach) return null;
        return (
          <div className={styles.achievementToast} data-cy="achievement-toast" key={activeAchievementToast}>
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
        <span className={styles.navBrand} style={{ pointerEvents: "none" }}>
          <Image src="/dragon_logo.png" alt="Snakey Logo" width={360} height={120} style={{ objectFit: "contain", width: "clamp(60px, 8vw, 100px)", height: "auto", pointerEvents: "none" }} priority />
        </span>
        <div className={styles.navLinks}>
          {isHost && (
            <div 
              style={{ position: "relative" }} 
              onMouseEnter={handleMouseEnterAuth}
              onMouseLeave={handleMouseLeaveAuth}
            >
              <button
                ref={authToggleRef}
                className={styles.navLink}
                data-cy="nav-login-toggle"
                onClick={() => setShowAuthDropdown(!showAuthDropdown)}
              >
                {t("logIn")} ▼
              </button>
              {showAuthDropdown && authDropdownStyle && (
                <div className={styles.authDropdown} data-cy="auth-dropdown" style={authDropdownStyle}>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setLoginError("");
                      
                      if (!loginUsername) {
                        setLoginError("errUsernameReq");
                        return;
                      }
                      if (!loginPassword) {
                        setLoginError("errPasswordReq");
                        return;
                      }

                      setLoginLoading(true);
                      try {
                        const res = await fetch("/api/auth/login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ username: loginUsername, password: loginPassword })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          localStorage.setItem("user", JSON.stringify(data.user));
                          window.__hostSession = false;
                          setUser(data.user);
                          setShowAuthDropdown(false);
                          setMounted(false);
                          setRefreshKey((prev) => prev + 1);
                        } else {
                          setLoginError(data.error === "Invalid username or password." ? "errInvalidCreds" : data.error);
                        }
                      } catch {
                        setLoginError("somethingWentWrong");
                      }
                      setLoginLoading(false);
                    }}
                    style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  >
                    <input 
                      type="text" 
                      placeholder={t("username")} 
                      value={loginUsername}
                      onChange={(e) => { setLoginUsername(e.target.value); setLoginError(""); }}
                      style={{ 
                        padding: "0.6rem 0.75rem", 
                        borderRadius: "var(--radius-sm)", 
                        border: `1px solid ${loginError && !loginUsername ? "#ef4444" : "var(--border-default)"}`, 
                        background: "var(--bg-primary)", 
                        color: "var(--text-primary)", 
                        width: "100%",
                        fontSize: "0.9rem",
                        transition: "border-color 0.2s"
                      }}
                    />
                    <div style={{ position: "relative", width: "100%" }}>
                      <input 
                        type="password" 
                        placeholder={t("password")} 
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                        style={{ 
                          padding: "0.6rem 0.75rem", 
                          borderRadius: "var(--radius-sm)", 
                          border: `1px solid ${loginError && !loginPassword ? "#ef4444" : "var(--border-default)"}`, 
                          background: "var(--bg-primary)", 
                          color: "var(--text-primary)", 
                          width: "100%",
                          fontSize: "0.9rem",
                          transition: "border-color 0.2s"
                        }}
                      />
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", minHeight: "18px" }}>
                      <span style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: "500", maxWidth: "60%", lineHeight: 1.2 }}>
                        {loginError ? (t(loginError) !== loginError ? t(loginError) : loginError) : ""}
                      </span>
                      <button type="button" onClick={() => goToAuth("forgotPassword")} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer", padding: 0, textDecoration: "underline", marginLeft: "auto" }}>
                        {t("forgotPasswordLink")}
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.25rem" }}>
                      <button type="submit" disabled={loginLoading} style={{ background: "var(--gradient-primary)", color: "var(--on-accent)", padding: "0.6rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontWeight: "600", width: "100%", transition: "transform 0.1s" }} onMouseDown={(e) => e.currentTarget.style.transform="scale(0.98)"} onMouseUp={(e) => e.currentTarget.style.transform="scale(1)"} onMouseLeave={(e) => e.currentTarget.style.transform="scale(1)"}>
                        {loginLoading ? "..." : t("logIn")}
                      </button>
                      <div style={{ fontSize: "0.85rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        {t("noAccount") || "Don't have an account? "}{" "}
                        <button type="button" onClick={() => goToAuth("register")} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: "inherit", fontFamily: "inherit" }}>
                          {t("createOne") || "Register"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
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
                <span className={styles.infoDot} style={{ background: "#f59e0b" }} />
                <span>
                  {t("guideYellow")} <strong className={styles.infoEmph}>{t("points10")}</strong>.
                </span>
              </li>
              <li className={styles.infoBullet}>
                <span className={styles.infoDot} style={{ background: "#ef4444" }} />
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
                  <AllAchievementsUnlockedMsg t={t} extraStyle={{ whiteSpace: "nowrap" }} />
                );
                return (
                  <ul
                    ref={achListRef}
                    className={`${styles.infoList} ${styles.achList}`}
                    style={{ gap: "0.5rem", maxHeight: achListMaxHeight ?? undefined }}
                  >
                    {visible.map(ach => (
                      <AchievementListItem key={ach.id} ach={ach} t={t} styles={styles} />
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

          {/* Canvas */}
          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className={styles.canvas}
            />

            {/* Countdown badge (3..2..1) */}
            {gameState === "starting" && (
              <div className={styles.countdownOverlay}>
                <p className={styles.countdownNumber}>{countdown}</p>
              </div>
            )}

            {/* Idle / Game Over Overlay */}
            {gameState !== "playing" && gameState !== "crashed" && gameState !== "starting" && (
              <div className={styles.overlay}>
                {gameState === "over" ? (
                  rewardGift ? (
                    isRouletteSpinning ? (
                        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <h2 style={{ color: "#f8fafc", fontSize: "2rem", fontWeight: 800, marginBottom: "1.5rem" }}>{t("spinningReward")}</h2>
                          <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: THEMES[GLOWING_COLORS[rouletteColorIndex]].head, border: `2px solid ${THEMES[GLOWING_COLORS[rouletteColorIndex]].body}` }} />
                        </div>
                    ) : !rewardRevealed ? (
                        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div 
                            style={{ cursor: "pointer", fontSize: "5rem", transition: "transform 0.2s ease" }}
                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            onClick={() => {
                               setIsRouletteSpinning(true);
                               let ticks = 0;
                               const maxTicks = 30;
                               const interval = setInterval(() => {
                                  ticks++;
                                  setRouletteColorIndex(prev => (prev + 1) % GLOWING_COLORS.length);
                                  if (ticks >= maxTicks) {
                                     clearInterval(interval);
                                     setIsRouletteSpinning(false);
                                     setRewardRevealed(true);
                                     setUnlockedAchievements(prev => {
                                        const updated = new Set(prev);
                                        updated.add(rewardGift);
                                        return updated;
                                     });
                                  }
                               }, 100);
                            }}
                          >🎁</div>
                          <p style={{ color: "var(--accent-primary)", fontWeight: 600, fontSize: "1.1rem", marginTop: "1rem" }}>{t("clickToOpen")}</p>
                        </div>
                    ) : (
                        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", animation: "fadeInUp 0.5s ease-out" }}>
                          <h2 style={{ color: "var(--accent-primary)", fontSize: "2rem", fontWeight: 800, marginBottom: "1.5rem" }}>{t("rewardUnlocked")}</h2>
                          <div style={{ 
                            width: "80px", height: "80px", borderRadius: "16px", 
                            background: THEMES[rewardGift]?.head, 
                            border: `2px solid ${THEMES[rewardGift]?.body}`,
                            boxShadow: `0 0 20px ${THEMES[rewardGift]?.head}` 
                          }} />
                          <p style={{ marginTop: "1.5rem", fontWeight: "bold", fontSize: "1.3rem", color: "#f8fafc", textTransform: "uppercase", letterSpacing: "1px" }}>{t(`color_${rewardGift}`)}</p>
                          <button className={styles.playBtn} style={{ marginTop: "2rem", padding: "0.8rem 2rem", fontSize: "1.1rem" }} onClick={() => setRewardGift(null)}>{t("awesomeBtn")}</button>
                        </div>
                    )
                  ) : (
                    <>
                      <p className={styles.overlayTitle}>{t("gameOverTitle")}</p>
                      <p className={styles.overlayScore}>
                        {t("scoreLabel")} <span className={styles.overlayScoreValue}>{score}</span>
                      </p>
                      {isHost && bestScore > 0 && (
                        <p className={styles.overlayScore} style={{ fontSize: "1.2rem", color: "#9ca3af", marginTop: "-0.5rem", marginBottom: "1.5rem" }}>
                          {t("sessionBest")} <span className={styles.overlayScoreValue} style={{ fontSize: "1.2rem" }}>{bestScore}</span>
                        </p>
                      )}
                      {isHost && (score > 0 || bestScore > 0) && (
                        <p className={styles.hostPrompt}>
                          <button type="button" className={styles.hostPromptLink} onClick={() => goToAuth("login")}>{t("logIn")}</button>{" "}
                          {t("hostPromptOr")}{" "}
                          <button type="button" className={styles.hostPromptLink} onClick={() => goToAuth("register")}>{t("register")}</button>{" "}
                          {t("hostPromptSuffix")}
                        </p>
                      )}
                    </>
                  )
                ) : (
                  <p className={styles.overlayTitle}>🐍 Snake</p>
                )}

                {gameState !== "starting" && (!rewardGift || rewardRevealed) && (
                  !globalDate ? (
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
                      <p className={styles.noAttemptsHighlight}>
                        {t("noAttemptsTomorrow")}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Touch D-pad (mobile only) */}
            {gameState === "playing" && (
              <div className={styles.dpad}>
                <button
                  type="button"
                  className={`${styles.dpadBtn} ${styles.dpadUp}`}
                  data-cy="dpad-up"
                  aria-label={t("controlsPrefix")}
                  onTouchStart={(e) => { e.preventDefault(); changeDirection("UP"); }}
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className={`${styles.dpadBtn} ${styles.dpadLeft}`}
                  data-cy="dpad-left"
                  aria-label={t("controlsPrefix")}
                  onTouchStart={(e) => { e.preventDefault(); changeDirection("LEFT"); }}
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className={`${styles.dpadBtn} ${styles.dpadRight}`}
                  data-cy="dpad-right"
                  aria-label={t("controlsPrefix")}
                  onTouchStart={(e) => { e.preventDefault(); changeDirection("RIGHT"); }}
                >
                  &gt;
                </button>
                <button
                  type="button"
                  className={`${styles.dpadBtn} ${styles.dpadDown}`}
                  data-cy="dpad-down"
                  aria-label={t("controlsPrefix")}
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
                return <AllAchievementsUnlockedMsg t={t} />;
              }
              return (
                <>
                  <ul className={styles.infoList} style={{ gap: "0.5rem", paddingRight: "0.5rem" }}>
                    {visible.map((ach, index) => {
                      if (!showAllGameAchievements && index >= 3) return null;
                      return (
                        <AchievementListItem key={ach.id} ach={ach} t={t} styles={styles} />
                      );
                    })}
                  </ul>
                  {visible.length > 3 && (
                    <button
                      style={{ display: "block", width: "100%", padding: "0.5rem", margin: "0.5rem 0", background: "rgba(19,35,48,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
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
                          <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", flex: 1, gap: "0.5rem" }}>
                            <span className={styles.lbName} style={{ flex: "none" }}>{entry.name}</span>
                            {entry.title && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
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
