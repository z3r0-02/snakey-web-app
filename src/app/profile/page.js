"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";
import { useTranslation } from "@/lib/LanguageContext";
import GlobalFlags from "@/components/GlobalFlags";
import Select from "@/components/auth/Select";
import CountryCombobox from "@/components/auth/CountryCombobox";
import DatePicker from "@/components/auth/DatePicker";
import { COUNTRIES, COUNTRY_FLAGS } from "@/lib/countries";
import { ACHIEVEMENTS, THEMES } from "@/lib/achievements";

// Profile stats are now fetched from the API instead of localStorage.

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ best: 0, daysPlayed: 0, attemptsToday: 0, rank: null });
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ gender: "", dob: "", country: "" });
  const [loading, setLoading] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const GENDERS = [
    { value: "female", label: t("genderFemale") },
    { value: "male", label: t("genderMale") },
    { value: "undisclosed", label: t("genderUndisclosed") },
  ];
  
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const initProfile = async () => {
      try {
        const raw = localStorage.getItem("user");
        const u = raw ? JSON.parse(raw) : null;
        if (!u) {
          router.push("/?view=login");
          return;
        }
        // Guests (host session) don't have a real account — no profile for them.
        if (u.email === "host@platform.local") {
          router.replace("/game");
          return;
        }
        setUser(u);

        const userId = u.id || u.username || u.email;
        const today = new Date().toISOString().slice(0, 10);
        const userName = u.name || u.email;

        let best = 0;
        let daysPlayed = 0;
        let attemptsToday = 0;
        let rank = null;

        const [attRes, lbRes] = await Promise.all([
          fetch(`/api/attempts?userId=${userId}&date=${today}`),
          fetch("/api/leaderboard")
        ]);

        if (attRes.ok) {
          const attData = await attRes.json();
          attemptsToday = attData.used || 0;
          daysPlayed = attData.totalDaysPlayed || 0;
        }

        if (lbRes.ok) {
          const lbData = await lbRes.json();
          const overall = lbData.overall || [];
          const userScores = overall.filter((e) => e.id === u.id || e.name === userName);
          best = userScores.length > 0 ? Math.max(...userScores.map((e) => e.score)) : 0;
          
          const idx = overall.findIndex((e) => e.id === u.id || e.name === userName);
          rank = idx >= 0 ? idx + 1 : null;
        }

        const achRes = await fetch(`/api/achievements?userId=${userId}`);
        if (achRes.ok) {
          const achData = await achRes.json();
          setUnlockedAchievements(new Set(achData.unlocked || []));
        }

        setStats({ best, daysPlayed, attemptsToday, rank });
        setMounted(true);
      } catch (err) {
        console.error("Failed to load profile stats:", err);
        setMounted(true); // Still mount to show UI
      }
    };
    initProfile();
  }, [router]);

  const handleEditClick = () => {
    setEditForm({
      gender: user.gender || "",
      dob: user.dob || "",
      country: user.country || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id || user.username || user.email,
          ...editForm
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
      } else {
        alert(t("somethingWentWrong"));
      }
    } catch (e) {
      alert(t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  const equipItem = async (type, value) => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/equip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id || user.username || user.email, type, value })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  }

  if (!mounted || !user) return null;

  const displayName = user.username || user.name || user.email;
  const initial = displayName.charAt(0).toUpperCase();

  // Some colors are granted directly by ID (e.g. roulette rewards), while others are tied to achievement objects.
  const unlockedColors = [
    "default",
    ...ACHIEVEMENTS.filter(a => unlockedAchievements.has(a.id) && (a.rewardType === "color" || a.rewardType === "both")).map(a => a.rewardValue),
    ...Array.from(unlockedAchievements).filter(id => THEMES[id]) // Catch standalone color unlocks
  ];
  const unlockedTitles = ACHIEVEMENTS.filter(a => unlockedAchievements.has(a.id) && (a.rewardType === "title" || a.rewardType === "both")).map(a => a.rewardType === "both" ? a.rewardValue2 : a.rewardValue);

  const simpleColors = Object.keys(THEMES).filter(id => !THEMES[id].glow && !THEMES[id].pattern);
  const glowingColors = Object.keys(THEMES).filter(id => THEMES[id].glow && !THEMES[id].pattern);
  const patternedColors = Object.keys(THEMES).filter(id => THEMES[id].pattern);

  const renderColorSwatch = (colorId) => {
    const theme = THEMES[colorId];
    if (!theme) return null;
    const isUnlocked = unlockedColors.includes(colorId);
    const isActive = user.active_snake_color === colorId;
    
    if (!isUnlocked) {
      return (
        <div
          key={colorId}
          className={styles.colorSwatch}
          style={{
            background: "transparent",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "not-allowed",
            opacity: 0.6
          }}
          title={t("locked")}
        >
          <svg width="14" height="18" viewBox="0 0 24 24" fill="#ffffff" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
            <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" />
          </svg>
        </div>
      );
    }

    return (
      <div 
        key={colorId}
        className={`${styles.colorSwatch} ${isActive ? styles.colorSwatchActive : ""}`}
        style={{ 
          background: theme.pattern === "zebra" ? `linear-gradient(135deg, ${theme.head} 50%, ${theme.body} 50%)` : theme.head,
          boxShadow: theme.glow ? `0 0 12px ${theme.pattern === "zebra" ? "rgba(0,0,0,0.8)" : (colorId === "glow_yellow" ? theme.body : theme.head)}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
        onClick={() => equipItem("color", colorId)}
        title={t(`color_${colorId}`)}
      >
        {theme.pattern === "wizard" && (
          <div style={{ width: "8px", height: "8px", background: "#fef08a", borderRadius: "50%" }} />
        )}
        {theme.pattern === "dots" && (
          <div style={{ width: "6px", height: "6px", background: "rgba(255,255,255,0.7)", borderRadius: "50%" }} />
        )}
        {theme.pattern === "lines" && (
          <div style={{ width: "16px", height: "3px", background: "rgba(255,255,255,0.7)" }} />
        )}
        {theme.pattern === "zigzag" && (
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", fontWeight: "bold", lineHeight: 1 }}>Z</div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.profilePage}>
      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.navBrand}>
          <Image src="/dragon_logo.png" alt="Snakey Logo" width={360} height={120} style={{ objectFit: "contain", width: "clamp(60px, 8vw, 100px)", height: "auto" }} priority />
        </span>
        <div className={styles.navLinks}>
          <Link href="/game" className={styles.navLink}>
            {t("navGame")}
          </Link>
          <Link href="/about" className={styles.navLink}>
            {t("navAboutUs")}
          </Link>
          <button className={styles.navLink} onClick={handleLogout}>
            {t("navLogOut")}
          </button>
          <GlobalFlags />
        </div>
      </nav>

      {/* Profile Card */}
      <div className={styles.contentWrapper}>
        <div className={styles.leftColumn}>
          {/* Achievements Section */}
          <div className={styles.achievementsCard} id="achievements-section">
            <div className={`${styles.details} ${styles.achievementsDetails}`}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 className={styles.detailsTitle} style={{ marginBottom: 0 }}>{t("achievementsTitle")}</h2>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "500" }}>
                  {Array.from(unlockedAchievements).filter(id => ACHIEVEMENTS.find(a => a.id === id)).length}/{ACHIEVEMENTS.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, overflowY: "auto", paddingRight: "0.5rem", minHeight: 0 }}>
                {ACHIEVEMENTS.map((ach, index) => {
                  const isUnlocked = unlockedAchievements.has(ach.id);
                  const opacity = isUnlocked ? 1 : 0.5;
                  const filter = isUnlocked ? "none" : "grayscale(100%)";
                  const isMobileHidden = !showAllAchievements && index >= 3;
                  
                  return (
                    <div key={ach.id} className={isMobileHidden ? styles.mobileHidden : ""} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.5rem 0.75rem", background: "rgba(19, 35, 48, 0.03)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", opacity, filter }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                          {ach.hidden && !isUnlocked ? t("hidden_achievement") : t(`ach_${ach.id}_name`)}
                        </h3>
                        {!isUnlocked && (
                          <svg width="12" height="14" viewBox="0 0 24 24" fill="#ffffff" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, flexShrink: 0, marginLeft: "0.5rem", marginTop: "0.1rem" }}>
                            <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" />
                          </svg>
                        )}
                      </div>
                      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.75rem", lineHeight: "1.3" }}>
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
                        document.getElementById('achievements-section')?.scrollIntoView({ behavior: 'smooth' });
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
        </div>

        <div className={styles.middleColumn}>
          <div className={styles.card}>
        {/* Banner + Avatar */}
        <div className={styles.banner}>
          <div className={styles.avatarWrap}>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt="Profile avatar"
                width={96}
                height={96}
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatar}>{initial}</div>
            )}
          </div>
        </div>


        {/* Info */}
        <div className={styles.info}>
          <h1 className={styles.name}>
            {displayName}
            {user.country && COUNTRY_FLAGS[user.country] && (
              <span style={{ fontSize: "1.2rem", marginLeft: "0.5rem" }} title={user.country}>
                {COUNTRY_FLAGS[user.country]}
              </span>
            )}
          </h1>
          {user.email && <p className={styles.email}>{user.email}</p>}
          <span className={`${styles.badge} ${styles.badgeUser}`}>
            {user.active_title ? t(`title_${user.active_title}`) : t("badgeMember")}
          </span>
        </div>

        {/* Stats Row */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <p className={`${styles.statValue} ${styles.statValueAccent}`}>{stats.best}</p>
            <p className={styles.statLabel}>{t("statBestScore")}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statValue}>{stats.daysPlayed}</p>
            <p className={styles.statLabel}>{t("statDaysPlayed")}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statValue}>{3 - stats.attemptsToday}</p>
            <p className={styles.statLabel}>{t("statAttemptsLeft")}</p>
          </div>
        </div>

        {/* Details */}
        <div className={`${styles.details} ${styles.profileDetails}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <h2 className={styles.detailsTitle} style={{ margin: 0 }}>{isEditing ? t("editingProfileTitle") : t("detailsTitle")}</h2>
            {!isEditing && (
              <button 
                onClick={handleEditClick}
                style={{
                  background: "rgba(19, 35, 48, 0.05)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "0.5rem",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "rgba(19, 35, 48, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "rgba(19, 35, 48, 0.05)";
                }}
                title={t("editProfileBtn")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            )}
          </div>

          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className={`${styles.detailRow} ${styles.editRow}`}>
                <span className={styles.detailLabel}>{t("gender")}</span>
                <div style={{ width: "100%", maxWidth: "220px", position: "relative", zIndex: 12 }}>
                  <Select
                    id="gender"
                    value={editForm.gender}
                    onChange={(v) => setEditForm((f) => ({ ...f, gender: v }))}
                    options={GENDERS}
                    placeholder={t("genderSelect")}
                  />
                </div>
              </div>
              <div className={`${styles.detailRow} ${styles.editRow}`}>
                <span className={styles.detailLabel}>{t("country")}</span>
                <div style={{ width: "100%", maxWidth: "220px", position: "relative", zIndex: 11 }}>
                  <CountryCombobox
                    id="country"
                    value={editForm.country}
                    onChange={(v) => {
                      if (/^[a-zA-Z\u00C0-\u017F\s]*$/.test(v)) {
                        setEditForm((f) => ({ ...f, country: v }));
                      }
                    }}
                    options={COUNTRIES}
                    placeholder={t("countryPlh")}
                  />
                </div>
              </div>
              <div className={`${styles.detailRow} ${styles.editRow}`} style={{ borderBottom: "none" }}>
                <span className={styles.detailLabel}>{t("dob")}</span>
                <div style={{ width: "100%", maxWidth: "220px", position: "relative", zIndex: 10 }}>
                  <DatePicker
                    id="dob"
                    value={editForm.dob}
                    onChange={(v) => setEditForm((f) => ({ ...f, dob: v }))}
                    max={today}
                    placeholder={t("dobPlh")}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => setIsEditing(false)} 
                  style={{ padding: "0.5rem 1rem", border: "1px solid var(--border-subtle)", background: "transparent", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", cursor: "pointer", fontSize: "0.85rem" }}
                  disabled={loading}
                >
                  {t("cancelBtn")}
                </button>
                <button 
                  onClick={handleSave} 
                  style={{ padding: "0.5rem 1rem", border: "none", background: "var(--text-accent)", color: "white", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
                  disabled={loading}
                >
                  {loading ? "..." : t("saveChangesBtn")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t("detailRank")}</span>
                <span className={styles.detailValue}>
                  {stats.rank ? `#${stats.rank}` : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t("detailDisplayName")}</span>
                <span className={styles.detailValue}>
                  {(user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : (user.name || displayName || "—")}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t("gender")}</span>
                <span className={styles.detailValue}>
                  {user.gender === "female" ? t("genderFemale") : user.gender === "male" ? t("genderMale") : user.gender === "undisclosed" ? t("genderUndisclosed") : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t("dob")}</span>
                <span className={styles.detailValue}>
                  {user.dob ? user.dob.split("-").reverse().join("/") : "—"}
                </span>
              </div>
            </>
          )}
      </div>
      </div>
      </div>

        <div className={styles.rightColumn}>
          <div className={`${styles.card} ${styles.achievementsCard}`}>
            <div className={`${styles.details} ${styles.achievementsDetails}`}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <h2 className={styles.detailsTitle}>{t("chooseColorTitle") || "Choose your colour"}</h2>
                <div style={{ paddingBottom: "0.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <div className={styles.colorGrid} style={{ marginTop: 0, padding: "0 12px", gap: "0.5rem" }}>
                      {simpleColors.map(renderColorSwatch)}
                    </div>
                  </div>
                  <div>
                    <div className={styles.colorGrid} style={{ marginTop: 0, padding: "0 12px", gap: "0.5rem" }}>
                      {glowingColors.map(renderColorSwatch)}
                    </div>
                  </div>
                  <div>
                    <div className={styles.colorGrid} style={{ marginTop: 0, padding: "0 12px", gap: "0.5rem" }}>
                      {patternedColors.map(renderColorSwatch)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <h2 className={styles.detailsTitle} style={{ margin: 0, marginBottom: "1rem" }}>{t("chooseTitleTitle") || "Choose your title"}</h2>
                <div className={styles.titleFlex} style={{ alignContent: "flex-start" }}>
                  {unlockedTitles.length > 0 ? unlockedTitles.map(titleId => {
                    const isActive = user.active_title === titleId;
                    return (
                      <button
                        key={titleId}
                        className={`${styles.titlePill} ${isActive ? styles.titlePillActive : ""}`}
                        onClick={() => equipItem("title", titleId)}
                      >
                        {t(`title_${titleId}`)}
                      </button>
                    );
                  }) : (
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{t("noTitlesYet") || "No titles unlocked yet."}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
