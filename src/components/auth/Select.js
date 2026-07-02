"use client";

import { useState, useRef, useEffect } from "react";
import styles from "@/app/(auth)/auth.module.css";

export default function Select({ id, value, onChange, onBlur, hasError, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={styles.dropdown} ref={ref}>
      <button
        type="button"
        id={id}
        className={`${styles.dropdownTrigger} ${
          open ? styles.dropdownTriggerOpen : ""
        } ${!selected ? styles.dropdownPlaceholder : ""} ${hasError ? styles.inputError : ""}`}
        onClick={() => setOpen((o) => !o)}
        onBlur={onBlur}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg
          className={styles.dropdownChevron}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            d="M1 1.5 6 6.5 11 1.5"
          />
        </svg>
      </button>

      {open && (
        <ul className={styles.dropdownPanel} role="listbox">
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`${styles.dropdownOption} ${
                o.value === value ? styles.dropdownOptionActive : ""
              }`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
