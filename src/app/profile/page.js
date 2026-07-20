"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";
import { useTranslation } from "@/lib/LanguageContext";
import GlobalFlags from "@/components/GlobalFlags";
import { COUNTRY_CODES } from "@/lib/countries";
import { ACHIEVEMENTS, THEMES } from "@/lib/achievements";
import { GUEST_HOST_EMAIL, MAX_ATTEMPTS } from "@/lib/constants";
import { resolveUserId } from "@/lib/user";
import ProfileAchievements from "./ProfileAchievements";
import ProfileEditForm from "./ProfileEditForm";
import ColorSwatch from "./ColorSwatch";

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
  const [saveError, setSaveError] = useState(null);

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
        if (u.email === GUEST_HOST_EMAIL) {
          router.replace("/game");
          return;
        }
        setUser(u);

        const userId = resolveUserId(u);

        let best = 0;
        let daysPlayed = 0;
        let attemptsToday = 0;
        let rank = null;

        const timeRes = await fetch("/api/time");
        const timeData = await timeRes.json();
        const serverToday = timeData.dateStr;

        const [attRes, lbRes, achRes] = await Promise.all([
          fetch(`/api/attempts?userId=${userId}&date=${serverToday}`),
          fetch(`/api/leaderboard?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/achievements?userId=${userId}`),
        ]);

        if (attRes.ok) {
          const attData = await attRes.json();
          attemptsToday = attData.used || 0;
          daysPlayed = attData.totalDaysPlayed || 0;
        }

        if (lbRes.ok) {
          const lbData = await lbRes.json();
          best = lbData.personalBest ?? 0;
          rank = lbData.personalRank ?? null;
        }

        if (achRes.ok) {
          const achData = await achRes.json();
          setUnlockedAchievements(new Set(achData.unlocked || []));
        }

        setStats({ best, daysPlayed, attemptsToday, rank });
        setMounted(true);
      } catch (err) {
        console.error("Failed to load profile stats:", err);
        setMounted(true);
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
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resolveUserId(user),
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
        setSaveError(t("somethingWentWrong"));
      }
    } catch (e) {
      console.error("Profile save failed:", e);
      setSaveError(t("somethingWentWrong"));
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
        body: JSON.stringify({ userId: resolveUserId(user), type, value })
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
    ...Array.from(unlockedAchievements).filter(id => THEMES[id])
  ];
  const unlockedTitles = ACHIEVEMENTS.filter(a => unlockedAchievements.has(a.id) && (a.rewardType === "title" || a.rewardType === "both")).map(a => a.rewardType === "both" ? a.rewardValue2 : a.rewardValue);

  const simpleColors = Object.keys(THEMES).filter(id => !THEMES[id].glow && !THEMES[id].pattern);
  const glowingColors = Object.keys(THEMES).filter(id => THEMES[id].glow && !THEMES[id].pattern);
  const patternedColors = Object.keys(THEMES).filter(id => THEMES[id].pattern);

  const renderSwatch = (colorId) => (
    <ColorSwatch
      key={colorId}
      colorId={colorId}
      isUnlocked={unlockedColors.includes(colorId)}
      isActive={user.activeSnakeColor === colorId}
      onEquip={equipItem}
    />
  );

  return (
    <div className={styles.profilePage}>
      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.navBrand}>
          <Image src="/dragon_logo.png" alt="Snakey Logo" width={360} height={120} className={styles.navBrandLogo} priority />
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
          <ProfileAchievements
            unlockedAchievements={unlockedAchievements}
            showAllAchievements={showAllAchievements}
            setShowAllAchievements={setShowAllAchievements}
          />
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
            {user.country && COUNTRY_CODES[user.country] && (
              <span
                className={`fi fi-${COUNTRY_CODES[user.country]} ${styles.flagInline}`}
                title={user.country}
              />
            )}
            {user.country === "Other" && (
              <span className={styles.flagEmoji} title={user.country}>
                🌍
              </span>
            )}
          </h1>
          {user.email && <p className={styles.email}>{user.email}</p>}
          <span className={`${styles.badge} ${styles.badgeUser}`}>
            {user.activeTitle ? t(`title_${user.activeTitle}`) : t("badgeMember")}
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
            <p className={styles.statValue}>{MAX_ATTEMPTS - stats.attemptsToday}</p>
            <p className={styles.statLabel}>{t("statAttemptsLeft")}</p>
          </div>
        </div>

        {/* Details */}
        <div className={`${styles.details} ${styles.profileDetails}`}>
          <div className={styles.detailsHeader}>
            <h2 className={`${styles.detailsTitle} ${styles.detailsTitleFlush}`}>{isEditing ? t("editingProfileTitle") : t("detailsTitle")}</h2>
            {!isEditing && (
              <button
                onClick={handleEditClick}
                data-cy="edit-profile-btn"
                className={styles.editBtn}
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
            <ProfileEditForm
              editForm={editForm}
              setEditForm={setEditForm}
              onSave={handleSave}
              onCancel={() => { setSaveError(null); setIsEditing(false); }}
              loading={loading}
              today={today}
              error={saveError}
            />
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
              <div className={styles.colorSection}>
                <h2 className={styles.detailsTitle}>{t("chooseColorTitle") || "Choose your colour"}</h2>
                <div className={styles.colorGroups}>
                  <div>
                    <div className={`${styles.colorGrid} ${styles.colorGridTight}`}>
                      {simpleColors.map(renderSwatch)}
                    </div>
                  </div>
                  <div>
                    <div className={`${styles.colorGrid} ${styles.colorGridTight}`}>
                      {glowingColors.map(renderSwatch)}
                    </div>
                  </div>
                  <div>
                    <div className={`${styles.colorGrid} ${styles.colorGridTight}`}>
                      {patternedColors.map(renderSwatch)}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.titleSection}>
                <h2 className={`${styles.detailsTitle} ${styles.titleSectionTitle}`}>{t("chooseTitleTitle") || "Choose your title"}</h2>
                <div className={`${styles.titleFlex} ${styles.titleFlexStart}`}>
                  {unlockedTitles.length > 0 ? unlockedTitles.map(titleId => {
                    const isActive = user.activeTitle === titleId;
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
                    <span className={styles.noTitles}>{t("noTitlesYet") || "No titles unlocked yet."}</span>
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
