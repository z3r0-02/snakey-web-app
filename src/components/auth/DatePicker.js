"use client";

import { useState, useRef, useEffect } from "react";
import styles from "@/app/(auth)/auth.module.css";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DD" -> "DD/MM/YYYY"
function isoToText(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Parse a typed "DD/MM/YYYY" (also accepts . or - separators) into a Date,
// or null if incomplete/invalid.
function parseText(str) {
  const parts = str.split(/[^0-9]+/).filter(Boolean);
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!y || y < 1000 || m < 1 || m > 12) return null;
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > daysInMonth) return null;
  return new Date(y, m - 1, d);
}

export default function DatePicker({ id, value, onChange, onBlur, hasError, max, placeholder }) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState("days"); // "days" | "years"
  const [text, setText] = useState(isoToText(value));
  const ref = useRef(null);

  const maxDate = max ? new Date(max + "T00:00:00") : null;
  const selected = value ? new Date(value + "T00:00:00") : null;

  const init = selected || maxDate || new Date();
  const [view, setView] = useState({ y: init.getFullYear(), m: init.getMonth() });

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setPicking("days");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const startWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Mon-first
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear();
  const years = [];
  for (let y = maxYear; y >= 1900; y--) years.push(y);

  function isDisabled(d) {
    if (!maxDate) return false;
    return new Date(view.y, view.m, d) > maxDate;
  }

  function commit(date) {
    onChange(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
  }

  function pick(d) {
    if (isDisabled(d)) return;
    const date = new Date(view.y, view.m, d);
    commit(date);
    // reflect the calendar choice in the text field
    setText(`${pad(d)}/${pad(view.m + 1)}/${view.y}`);
    setOpen(false);
    setPicking("days");
  }

  function handleType(e) {
    let raw = e.target.value.replace(/[^0-9]/g, ""); // strip non-numbers
    // Auto-insert slashes
    if (raw.length > 2) raw = raw.slice(0, 2) + "/" + raw.slice(2);
    if (raw.length > 5) raw = raw.slice(0, 5) + "/" + raw.slice(5);
    raw = raw.slice(0, 10); // max length DD/MM/YYYY
    
    setText(raw);
    const parsed = parseText(raw);
    if (parsed && (!maxDate || parsed <= maxDate)) {
      commit(parsed);
      setView({ y: parsed.getFullYear(), m: parsed.getMonth() });
    } else {
      onChange(""); // incomplete/invalid -> clear the stored value
    }
  }

  const nextDisabled =
    maxDate &&
    (view.y > maxYear || (view.y === maxYear && view.m >= maxDate.getMonth()));

  function isSelected(d) {
    return (
      selected &&
      selected.getFullYear() === view.y &&
      selected.getMonth() === view.m &&
      selected.getDate() === d
    );
  }

  return (
    <div className={styles.dropdown} ref={ref}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={`${styles.input} ${styles.dpTextInput} ${
          open ? styles.inputOpen : ""
        } ${hasError ? styles.inputError : ""}`}
        placeholder={placeholder || "DD / MM / YYYY"}
        value={text}
        onChange={handleType}
        onBlur={onBlur}
      />
      <button
        type="button"
        className={styles.dpIconBtn}
        aria-label="Open calendar"
        onClick={() => setOpen((o) => !o)}
        tabIndex={-1}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect
            x="2" y="3" width="12" height="11" rx="1.5"
            fill="none" stroke="currentColor" strokeWidth="1.3"
          />
          <path
            d="M2 6.5h12M5 1.5v3M11 1.5v3"
            fill="none" stroke="currentColor" strokeWidth="1.3"
          />
        </svg>
      </button>

      {open && (
        <div className={styles.dpPanel}>
          {picking === "days" ? (
            <>
              <div className={styles.dpHeader}>
                <button
                  type="button"
                  className={styles.dpNav}
                  aria-label="Previous month"
                  onClick={() =>
                    setView((v) =>
                      v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }
                    )
                  }
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={styles.dpTitle}
                  onClick={() => setPicking("years")}
                >
                  {MONTHS[view.m]} {view.y}
                </button>
                <button
                  type="button"
                  className={styles.dpNav}
                  aria-label="Next month"
                  disabled={nextDisabled}
                  onClick={() =>
                    setView((v) =>
                      v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }
                    )
                  }
                >
                  ›
                </button>
              </div>

              <div className={styles.dpWeekdays}>
                {WEEKDAYS.map((w) => (
                  <span key={w} className={styles.dpWeekday}>
                    {w}
                  </span>
                ))}
              </div>

              <div className={styles.dpGrid}>
                {cells.map((d, i) =>
                  d === null ? (
                    <span key={`b${i}`} />
                  ) : (
                    <button
                      key={d}
                      type="button"
                      className={`${styles.dpDay} ${
                        isSelected(d) ? styles.dpDaySelected : ""
                      }`}
                      disabled={isDisabled(d)}
                      onClick={() => pick(d)}
                    >
                      {d}
                    </button>
                  )
                )}
              </div>
            </>
          ) : (
            <div className={styles.dpYears}>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`${styles.dpYear} ${
                    selected && selected.getFullYear() === y
                      ? styles.dpDaySelected
                      : ""
                  }`}
                  onClick={() => {
                    setView((v) => ({ ...v, y }));
                    setPicking("days");
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
