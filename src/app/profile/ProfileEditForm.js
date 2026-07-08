"use client";

import { useTranslation } from "@/lib/LanguageContext";
import Select from "@/components/auth/Select";
import CountryCombobox from "@/components/auth/CountryCombobox";
import DatePicker from "@/components/auth/DatePicker";
import { COUNTRIES } from "@/lib/countries";
import { GENDER_OPTIONS } from "@/lib/constants";
import { isLettersOnly } from "@/lib/validation";
import styles from "./profile.module.css";

// Inline edit form for the profile details (gender / country / date of birth).
export default function ProfileEditForm({ editForm, setEditForm, onSave, onCancel, loading, today }) {
  const { t } = useTranslation();

  const GENDERS = GENDER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));

  return (
    <div className={styles.editForm}>
      <div className={`${styles.detailRow} ${styles.editRow}`}>
        <span className={styles.detailLabel}>{t("gender")}</span>
        <div className={`${styles.editField} ${styles.editFieldTop}`}>
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
        <div className={`${styles.editField} ${styles.editFieldMid}`}>
          <CountryCombobox
            id="country"
            value={editForm.country}
            onChange={(v) => {
              if (isLettersOnly(v)) {
                setEditForm((f) => ({ ...f, country: v }));
              }
            }}
            options={COUNTRIES}
            placeholder={t("countryPlh")}
          />
        </div>
      </div>
      <div className={`${styles.detailRow} ${styles.editRow} ${styles.editRowLast}`}>
        <span className={styles.detailLabel}>{t("dob")}</span>
        <div className={`${styles.editField} ${styles.editFieldBot}`}>
          <DatePicker
            id="dob"
            value={editForm.dob}
            onChange={(v) => setEditForm((f) => ({ ...f, dob: v }))}
            max={today}
            placeholder={t("dobPlh")}
          />
        </div>
      </div>
      <div className={styles.editActions}>
        <button
          onClick={onCancel}
          data-cy="cancel-edit-btn"
          className={styles.cancelBtn}
          disabled={loading}
        >
          {t("cancelBtn")}
        </button>
        <button
          onClick={onSave}
          data-cy="save-changes-btn"
          className={styles.saveBtn}
          disabled={loading}
        >
          {loading ? "..." : t("saveChangesBtn")}
        </button>
      </div>
    </div>
  );
}
