import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getUserSettings, saveUserSettings } from "../api";
import axios from "axios";
import "./Settings.css";

const USER_ID = 1;

const TABS = [
  { id: "profile",    label: "Profile",     icon: "👤" },
  { id: "preferences",label: "Preferences", icon: "🎨" },
  { id: "budget",     label: "Budget",      icon: "💰" },
  { id: "security",   label: "Security",    icon: "🔒" },
];

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ta", label: "Tamil",   flag: "🇮🇳" },
  { code: "hi", label: "Hindi",   flag: "🇮🇳" },
  { code: "fr", label: "French",  flag: "🇫🇷" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
];

export default function Settings() {
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState("");

  // Profile
  const [name,  setName]  = useState(localStorage.getItem("name")  || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [phone, setPhone] = useState("");

  // Preferences
  const [theme,    setTheme]    = useState(localStorage.getItem("theme") || "dark");
  const [language, setLanguage] = useState(i18n.language || "en");
  const [currency, setCurrency] = useState("INR");

  // Budget
  const [budget,      setBudget]      = useState(5000);
  const [budgetInput, setBudgetInput] = useState("5000");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    getUserSettings(USER_ID)
      .then((res) => {
        const d = res.data || {};
        if (d.budget)   { setBudget(d.budget); setBudgetInput(String(d.budget)); }
        if (d.currency)   setCurrency(d.currency);
        if (d.name)       setName(d.name);
        if (d.phone)      setPhone(d.phone);
      })
      .catch(() => {});
  }, []);

  const showSaved = (msg) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 2500);
  };

  // Save profile
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await saveUserSettings(USER_ID, {
        budget, currency, name, email, phone
      });
      localStorage.setItem("name", name);
      showSaved("Profile saved!");
    } catch { showSaved("Failed to save."); }
    finally { setSaving(false); }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      localStorage.setItem("theme", theme);
      document.querySelector(".layout")?.classList.remove("light", "dark");
      document.querySelector(".layout")?.classList.add(theme);
      i18n.changeLanguage(language);
      await saveUserSettings(USER_ID, {
        budget, currency, name, email, phone
      });
      showSaved("Preferences saved!");
    } catch { showSaved("Failed to save."); }
    finally { setSaving(false); }
  };

  // Save budget
  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (!val || val < 100) {
      showSaved("Budget must be at least ₹100");
      return;
    }
    setSaving(true);
    try {
      await saveUserSettings(USER_ID, {
        budget: val, currency, name, email, phone
      });
      setBudget(val);
      showSaved("Budget updated!");
    } catch { showSaved("Failed to save."); }
    finally { setSaving(false); }
  };

  // Update password
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showSaved("All fields are required!");
      return;
    }
    if (newPassword !== confirmPassword) {
      showSaved("New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      showSaved("Password must be at least 6 characters!");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        "http://localhost:8080/api/auth/update-password",
        {
          email,
          currentPassword,
          newPassword,
        }
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSaved("Password updated successfully!");
    } catch (err) {
      showSaved(err.response?.data || "Failed to update password!");
    } finally {
      setSaving(false);
    }
  };

  const usedPct = budget > 0 ? Math.min((budget / budget) * 100, 100) : 0;

  return (
    <div className="st-page">

      <div className="st-header">
        <h1 className="st-title">Settings</h1>
        <p className="st-sub">Manage your profile and preferences</p>
      </div>

      <div className="st-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`st-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {saved && (
        <div className={`st-toast ${
          saved.includes("Failed") || saved.includes("match") ||
          saved.includes("required") || saved.includes("least")
            ? "error" : "success"
        }`}>
          {saved.includes("Failed") || saved.includes("match") ||
           saved.includes("required") || saved.includes("least")
            ? "❌" : "✅"} {saved}
        </div>
      )}

      <div className="st-content">

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="st-section">
            <div className="st-section-header">
              <h2 className="st-section-title">Personal Information</h2>
              <p className="st-section-sub">Update your personal details</p>
            </div>
            <div className="st-avatar-row">
              <div className="st-avatar">
                {name ? name[0].toUpperCase() : "U"}
              </div>
              <div>
                <p className="st-avatar-name">{name || "Your Name"}</p>
                <p className="st-avatar-email">{email || "your@email.com"}</p>
              </div>
            </div>
            <div className="st-form">
              <div className="st-field">
                <label className="st-label">Full Name</label>
                <input className="st-input" type="text"
                  placeholder="e.g. Suryakumar"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="st-field">
                <label className="st-label">Email Address</label>
                <input className="st-input" type="email"
                  placeholder="e.g. surya@gmail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="st-field">
                <label className="st-label">Phone Number</label>
                <input className="st-input" type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button className="st-save-btn"
                onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === "preferences" && (
          <div className="st-section">
            <div className="st-section-header">
              <h2 className="st-section-title">Preferences</h2>
              <p className="st-section-sub">Customize your app experience</p>
            </div>
            <div className="st-pref-group">
              <p className="st-pref-label">Theme</p>
              <div className="st-theme-row">
                {["light", "dark"].map((t) => (
                  <button key={t}
                    className={`st-theme-btn ${theme === t ? "active" : ""}`}
                    onClick={() => setTheme(t)}>
                    <span>{t === "dark" ? "🌙" : "☀️"}</span>
                    <span>{t === "dark" ? "Dark" : "Light"}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="st-pref-group">
              <p className="st-pref-label">Language</p>
              <div className="st-lang-grid">
                {LANGUAGES.map((lang) => (
                  <button key={lang.code}
                    className={`st-lang-btn ${language === lang.code ? "active" : ""}`}
                    onClick={() => setLanguage(lang.code)}>
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="st-pref-group">
              <p className="st-pref-label">Currency</p>
              <div className="st-currency-grid">
                {CURRENCIES.map((cur) => (
                  <button key={cur.code}
                    className={`st-currency-btn ${currency === cur.code ? "active" : ""}`}
                    onClick={() => setCurrency(cur.code)}>
                    <span className="st-cur-symbol">{cur.symbol}</span>
                    <span className="st-cur-code">{cur.code}</span>
                    <span className="st-cur-label">{cur.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="st-save-btn"
              onClick={handleSavePreferences} disabled={saving}>
              {saving ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === "budget" && (
          <div className="st-section">
            <div className="st-section-header">
              <h2 className="st-section-title">Monthly Budget</h2>
              <p className="st-section-sub">Set your monthly spending limit</p>
            </div>
            <div className="st-budget-display">
              <p className="st-budget-label">Current Budget</p>
              <p className="st-budget-value">₹{budget.toLocaleString("en-IN")}</p>
              <p className="st-budget-sub">per month</p>
            </div>
            <div className="st-pref-group">
              <p className="st-pref-label">Quick Presets</p>
              <div className="st-preset-grid">
                {[3000,5000,10000,15000,20000,25000].map((val) => (
                  <button key={val}
                    className={`st-preset-btn ${parseFloat(budgetInput) === val ? "active" : ""}`}
                    onClick={() => setBudgetInput(String(val))}>
                    ₹{val.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>
            <div className="st-pref-group">
              <p className="st-pref-label">Custom Amount</p>
              <div className="st-budget-input-row">
                <span className="st-budget-prefix">₹</span>
                <input className="st-budget-input" type="number" min="100"
                  placeholder="Enter amount"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)} />
              </div>
              <p className="st-budget-hint">Minimum budget is ₹100</p>
            </div>
            <button className="st-save-btn"
              onClick={handleSaveBudget} disabled={saving}>
              {saving ? "Saving…" : "Update Budget"}
            </button>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="st-section">
            <div className="st-section-header">
              <h2 className="st-section-title">Update Password</h2>
              <p className="st-section-sub">
                Change your account password
              </p>
            </div>
            <div className="st-form">
              <div className="st-field">
                <label className="st-label">Current Password</label>
                <input className="st-input" type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="st-field">
                <label className="st-label">New Password</label>
                <input className="st-input" type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="st-field">
                <label className="st-label">Confirm New Password</label>
                <input className="st-input" type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="st-password-rules">
                <p>Password must be at least 6 characters</p>
              </div>
              <button className="st-save-btn st-save-btn--danger"
                onClick={handleUpdatePassword} disabled={saving}>
                {saving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}