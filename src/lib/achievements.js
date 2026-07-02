export const ACHIEVEMENTS = [
  {
    id: "first_game",
    rewardType: "title",
    rewardValue: "novice"
  },
  {
    id: "baby_steps",
    rewardType: "color",
    rewardValue: "light_blue"
  },
  {
    id: "magical_3",
    rewardType: "color",
    rewardValue: "pink_glow"
  },
  {
    id: "confused_potato",
    rewardType: "title",
    rewardValue: "confused_potato",
    hidden: true
  },
  {
    id: "nope_border",
    rewardType: "color",
    rewardValue: "red",
    hidden: true
  },
  {
    id: "damn_good",
    rewardType: "both",
    rewardValue: "black", // color
    rewardValue2: "one_true_king" // title
  },
  {
    id: "five_days",
    rewardType: "title",
    rewardValue: "enjoyer"
  },
  {
    id: "wizard",
    rewardType: "both",
    rewardValue: "glowing_pattern", // color
    rewardValue2: "wizard" // title
  },
  {
    id: "try_harder",
    rewardType: "color",
    rewardValue: "brown"
  },
  {
    id: "cheating",
    rewardType: "both",
    rewardValue: "yellow", // color
    rewardValue2: "snake_master" // title
  },
  {
    id: "10_days",
    rewardType: "color",
    rewardValue: "orange"
  },
  {
    id: "20_days",
    rewardType: "both",
    rewardValue: "glow_yellow",
    rewardValue2: "the_dedicated"
  },
  {
    id: "holy_500",
    rewardType: "color",
    rewardValue: "zebra"
  },
  {
    id: "danger_lover",
    rewardType: "title",
    rewardValue: "the_challenger",
    hidden: true
  },
  {
    id: "cannibal",
    rewardType: "both",
    rewardValue: "blue_glow",
    rewardValue2: "the_cannibal",
    hidden: true
  }
];

export const THEMES = {
  default: { head: "#4ade80", body: "#22c55e", glow: false, pattern: null },
  light_blue: { head: "#38bdf8", body: "#0ea5e9", glow: false, pattern: null },
  pink_glow: { head: "#f472b6", body: "#ec4899", glow: true, pattern: null },
  red: { head: "#f87171", body: "#ef4444", glow: false, pattern: null },
  black: { head: "#3f3f46", body: "#18181b", glow: false, pattern: null },
  brown: { head: "#a16207", body: "#713f12", glow: false, pattern: null },
  yellow: { head: "#fde047", body: "#eab308", glow: false, pattern: null },
  orange: { head: "#f97316", body: "#ea580c", glow: false, pattern: null },
  zebra: { head: "#ffffff", body: "#18181b", glow: true, pattern: "zebra" },
  blue_glow: { head: "#60a5fa", body: "#2563eb", glow: true, pattern: null },
  glowing_pattern: { head: "#c084fc", body: "#a855f7", glow: true, pattern: "wizard" },
  glow_cyan: { head: "#22d3ee", body: "#06b6d4", glow: true, pattern: "dots" },
  glow_magenta: { head: "#f472b6", body: "#db2777", glow: true, pattern: "lines" },
  glow_lime: { head: "#a3e635", body: "#65a30d", glow: true, pattern: "zigzag" },
  glow_orange: { head: "#fb923c", body: "#ea580c", glow: true, pattern: "dots" },
  glow_white: { head: "#e2e8f0", body: "#94a3b8", glow: true, pattern: "lines" },
  glow_yellow: { head: "#fef08a", body: "#eab308", glow: true, pattern: "zigzag" },
  glow_purple: { head: "#d8b4fe", body: "#9333ea", glow: true, pattern: "dots" },
  glow_coral: { head: "#fb7185", body: "#e11d48", glow: true, pattern: "lines" },
  glow_mint: { head: "#6ee7b7", body: "#059669", glow: true, pattern: "zigzag" },
  glow_ice: { head: "#bae6fd", body: "#0284c7", glow: true, pattern: "dots" }
};

export const GLOWING_COLORS = [
  "glow_cyan", "glow_magenta", "glow_lime", "glow_orange", "glow_white",
  "glow_yellow", "glow_purple", "glow_coral", "glow_mint", "glow_ice"
];
