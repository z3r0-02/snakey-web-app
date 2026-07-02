"use client";

import { useState, useRef, useEffect } from "react";
import styles from "@/app/(auth)/auth.module.css";

export default function CountryCombobox({ id, value, onChange, onBlur, hasError, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = value.trim().toLowerCase();
  // No suggestions until the user types something, and only countries that
  // *start with* what was typed (e.g. "a" -> Australia, Austria).
  const matches = q
    ? options.filter((o) => o.toLowerCase().startsWith(q)).slice(0, 8)
    : [];
  const showPanel = open && matches.length > 0;

  return (
    <div className={styles.dropdown} ref={ref}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        className={`${styles.input} ${showPanel ? styles.inputOpen : ""} ${hasError ? styles.inputError : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={onBlur}
      />

      {showPanel && (
        <ul className={styles.dropdownPanel} role="listbox">
          {matches.map((o) => (
            <li
              key={o}
              role="option"
              aria-selected={o === value}
              className={styles.dropdownOption}
              // onMouseDown (not onClick) so the input doesn't blur first
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o);
                setOpen(false);
              }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
