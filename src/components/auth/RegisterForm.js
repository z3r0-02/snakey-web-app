"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(auth)/auth.module.css";
import Select from "./Select";
import CountryCombobox from "./CountryCombobox";
import DatePicker from "./DatePicker";
import TermsModal from "../TermsModal";
import PasswordInput from "./PasswordInput";
import { useTranslation } from "@/lib/LanguageContext";
import { COUNTRIES } from "@/lib/countries";
import { isValidEmail } from "@/lib/validation";

export default function RegisterForm({ onBack, onLogin }) {
  const router = useRouter();
  const { t } = useTranslation();

  const GENDERS = [
    { value: "female", label: t("genderFemale") },
    { value: "male", label: t("genderMale") },
    { value: "undisclosed", label: t("genderUndisclosed") },
  ];
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    dob: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const [showTerms, setShowTerms] = useState(false);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function validate() {
    const errs = {};
    if (!form.firstName) errs.firstName = t("errFirstNameReq");
    if (!form.lastName) errs.lastName = t("errLastNameReq");
    if (!form.email) errs.email = t("errEmailReq") || "Email is required.";
    else if (!isValidEmail(form.email))
      errs.email = t("errEmailInvalid");
    if (!form.gender) errs.gender = t("errGenderReq");
    if (!form.dob) errs.dob = t("errDobReq");
    if (!form.country) errs.country = t("errCountryReq");
    if (!form.password) {
      errs.password = t("errPasswordReq") || "Password is required.";
    } else if (form.password.length < 8) {
      errs.password = t("errPassShort");
    } else if (!/[A-Z]/.test(form.password)) {
      errs.password = t("errPassUpper");
    } else if (!/[0-9]/.test(form.password)) {
      errs.password = t("errPassNum");
    }
    
    if (!form.confirmPassword) errs.confirmPassword = t("errConfirmReq");
    else if (form.password !== form.confirmPassword) errs.confirmPassword = t("errPassMatch");
    return errs;
  }

  const errors = { ...serverErrors, ...validate() };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  function update(field) {
    return (e) => {
      let val = e.target.value;
      if (field === "firstName" || field === "lastName") {
        if (!/^[a-zA-Z\u00C0-\u017F\s]*$/.test(val)) return;
      }
      if (serverErrors[field]) {
        setServerErrors((s) => ({ ...s, [field]: undefined }));
      }
      setForm((f) => ({ ...f, [field]: val }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        dob: true,
        country: true,
        password: true,
        confirmPassword: true,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          gender: form.gender,
          dob: form.dob,
          country: form.country,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const userData = { ...data.user, _pendingSetup: true };
        localStorage.setItem("user", JSON.stringify(userData));
        setMessage({ type: "success", text: t("registerSuccess") });
        setTimeout(() => router.push("/setup"), 800);
      } else if (res.status === 409 || (data.error && /exist/i.test(data.error))) {
        // Duplicate email — show a translated message inline under the field.
        setServerErrors((s) => ({ ...s, email: t("errEmailExists") }));
        setTouched((prev) => ({ ...prev, email: true }));
        setLoading(false);
      } else if (data.error && /email/i.test(data.error)) {
        // Any other email-related server error.
        setServerErrors((s) => ({ ...s, email: t("errEmailInvalid") }));
        setTouched((prev) => ({ ...prev, email: true }));
        setLoading(false);
      } else {
        setMessage({ type: "error", text: t("somethingWentWrong") });
        setLoading(false);
      }
    } catch {
      setMessage({ type: "error", text: t("somethingWentWrong") });
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={onBack} className={styles.backLink} type="button">
        {t("back")}
      </button>

      <div className={styles.authHeader}>
        <h1 className={styles.authTitle}>{t("createYourAccount")}</h1>
        <p className={styles.authSubtitle}>
          {t("registerSubtitle")}
        </p>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit} id="register-form" noValidate>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.label}>
              {t("firstName")}
            </label>
            <input
              id="firstName"
              type="text"
              className={`${styles.input} ${touched.firstName && errors.firstName ? styles.inputError : ""}`}
              placeholder={t("firstNamePlh")}
              value={form.firstName}
              onChange={update("firstName")}
              onBlur={handleBlur("firstName")}
              autoComplete="given-name"
            />
            {touched.firstName && errors.firstName && (
              <span className={styles.fieldError}>{errors.firstName}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.label}>
              {t("lastName")}
            </label>
            <input
              id="lastName"
              type="text"
              className={`${styles.input} ${touched.lastName && errors.lastName ? styles.inputError : ""}`}
              placeholder={t("lastNamePlh")}
              value={form.lastName}
              onChange={update("lastName")}
              onBlur={handleBlur("lastName")}
              autoComplete="family-name"
            />
            {touched.lastName && errors.lastName && (
              <span className={styles.fieldError}>{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ""}`}
            placeholder={t("emailPlaceholder")}
            value={form.email}
            onChange={update("email")}
            onBlur={handleBlur("email")}
            autoComplete="email"
          />
          {touched.email && errors.email && (
            <span className={styles.fieldError}>{errors.email}</span>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="gender" className={styles.label}>
              {t("gender")}
            </label>
            <Select
              id="gender"
              value={form.gender}
              onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
              onBlur={handleBlur("gender")}
              hasError={touched.gender && !!errors.gender}
              options={GENDERS}
              placeholder={t("genderSelect")}
            />
            {touched.gender && errors.gender && (
              <span className={styles.fieldError}>{errors.gender}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dob" className={styles.label}>
              {t("dob")}
            </label>
            <DatePicker
              id="dob"
              value={form.dob}
              onChange={(v) => setForm((f) => ({ ...f, dob: v }))}
              onBlur={handleBlur("dob")}
              hasError={touched.dob && !!errors.dob}
              max={today}
              placeholder={t("dobPlh")}
            />
            {touched.dob && errors.dob && (
              <span className={styles.fieldError}>{errors.dob}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="country" className={styles.label}>
            {t("country")}
          </label>
          <CountryCombobox
            id="country"
            value={form.country}
            onChange={(v) => {
              if (/^[a-zA-Z\u00C0-\u017F\s]*$/.test(v)) {
                setForm((f) => ({ ...f, country: v }));
              }
            }}
            onBlur={handleBlur("country")}
            hasError={touched.country && !!errors.country}
            options={COUNTRIES}
            placeholder={t("countryPlh")}
          />
          {touched.country && errors.country && (
            <span className={styles.fieldError}>{errors.country}</span>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              {t("password")}
            </label>
            <PasswordInput
              id="password"
              required
              minLength={8}
              className={`${styles.input} ${touched.password && errors.password ? styles.inputError : ""}`}
              placeholder="••••••••"
              value={form.password}
              onChange={update("password")}
              onBlur={handleBlur("password")}
              autoComplete="new-password"
            />
            {touched.password && errors.password && (
              <span className={styles.fieldError}>{errors.password}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              {t("confirmPassword")}
            </label>
            <PasswordInput
              id="confirmPassword"
              required
              minLength={8}
              className={`${styles.input} ${touched.confirmPassword && errors.confirmPassword ? styles.inputError : ""}`}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              autoComplete="new-password"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span className={styles.fieldError}>{errors.confirmPassword}</span>
            )}
          </div>
        </div>

        {message && (
          <div className={styles.messageWrapper}>
            <div
              className={`${styles.message} ${
                message.type === "success" ? styles.success : styles.error
              }`}
            >
              {message.text}
            </div>
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading}
          id="btn-submit-register"
        >
          {loading ? t("creatingAccount") : t("createAccountBtn")}
        </button>
      </form>

      <p className={styles.authFooter}>
        {t("alreadyHaveAccount")}
        <button onClick={onLogin} type="button" className={styles.authFooterLink} style={{background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer'}}>
          {t("signIn")}
        </button>
      </p>
    </>
  );
}
