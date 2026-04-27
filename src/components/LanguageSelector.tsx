"use client";

import { useEffect, useMemo, useState } from "react";

type Language = {
  code: string;
  label: string;
  nativeLabel?: string;
};

const DEFAULT_VISIBLE_COUNT = 8;
const SOURCE_LANGUAGE = "en";
const STORAGE_KEY = "connecthub_language";

const LANGUAGES: Language[] = [
  { code: "en", label: "English", nativeLabel: "English (US)" },
  { code: "fr", label: "French", nativeLabel: "Français (France)" },
  { code: "ff", label: "Fula", nativeLabel: "Fula" },
  { code: "es", label: "Spanish", nativeLabel: "Spanish (Spain)" },
  { code: "de", label: "German", nativeLabel: "German" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
  { code: "it", label: "Italian", nativeLabel: "Italian" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "ha", label: "Hausa", nativeLabel: "Hausa" },
  { code: "yo", label: "Yoruba", nativeLabel: "Yorùbá" },
  { code: "ig", label: "Igbo", nativeLabel: "Igbo" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili" },
  { code: "zh-CN", label: "Chinese", nativeLabel: "中文" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands" },
  { code: "pl", label: "Polish", nativeLabel: "Polski" },
];

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

function getRootDomain(hostname: string) {
  if (!hostname || hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return "";
  }

  const cleanHost = hostname.replace(/^www\./, "");
  const parts = cleanHost.split(".");

  if (parts.length < 2) return "";
  return `.${parts.slice(-2).join(".")}`;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const rootDomain = getRootDomain(hostname);
  const encodedValue = encodeURIComponent(value);
  const base = `${name}=${encodedValue}; path=/; max-age=${maxAge}; SameSite=Lax`;

  document.cookie = base;

  if (hostname && hostname !== "localhost") {
    document.cookie = `${base}; domain=${hostname}`;
  }

  if (rootDomain) {
    document.cookie = `${base}; domain=${rootDomain}`;
  }
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const rootDomain = getRootDomain(hostname);
  const expired = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

  document.cookie = expired;

  if (hostname && hostname !== "localhost") {
    document.cookie = `${expired}; domain=${hostname}`;
  }

  if (rootDomain) {
    document.cookie = `${expired}; domain=${rootDomain}`;
  }
}

function readCurrentLanguage() {
  if (typeof window === "undefined") return SOURCE_LANGUAGE;

  const cookieValue = readCookie("googtrans");
  const cookieParts = cookieValue.split("/").filter(Boolean);
  const cookieLanguage = cookieParts[cookieParts.length - 1];

  if (cookieLanguage && cookieLanguage !== SOURCE_LANGUAGE) {
    return cookieLanguage;
  }

  return localStorage.getItem(STORAGE_KEY) || SOURCE_LANGUAGE;
}

export default function LanguageSelector({ dark = true }: { dark?: boolean }) {
  const [activeLanguage, setActiveLanguage] = useState(SOURCE_LANGUAGE);
  const [showAll, setShowAll] = useState(false);
  const visibleLanguages = useMemo(
    () => (showAll ? LANGUAGES : LANGUAGES.slice(0, DEFAULT_VISIBLE_COUNT)),
    [showAll]
  );

  useEffect(() => {
    setActiveLanguage(readCurrentLanguage());
  }, []);

  function changeLanguage(languageCode: string) {
    if (typeof window === "undefined") return;

    const selected = languageCode || SOURCE_LANGUAGE;
    setActiveLanguage(selected);
    localStorage.setItem(STORAGE_KEY, selected);

    if (selected === SOURCE_LANGUAGE) {
      localStorage.removeItem(STORAGE_KEY);
      clearCookie("googtrans");
    } else {
      writeCookie("googtrans", `/${SOURCE_LANGUAGE}/${selected}`, 60 * 60 * 24 * 365);
    }

    window.location.reload();
  }

  return (
    <div className={dark ? "ch-language-section ch-language-section--dark" : "ch-language-section"}>
      <div className="ch-language-inner" aria-label="Change website language">
        <div className="ch-language-list">
          {visibleLanguages.map((language) => {
            const isActive = activeLanguage === language.code;

            return (
              <button
                key={language.code}
                type="button"
                className={`ch-language-button${isActive ? " ch-language-button--active" : ""}`}
                onClick={() => changeLanguage(language.code)}
                aria-pressed={isActive}
                title={`Translate ConnectHub to ${language.label}`}
              >
                {language.nativeLabel || language.label}
              </button>
            );
          })}

          <button
            type="button"
            className="ch-language-button ch-language-button--more"
            onClick={() => setShowAll((current) => !current)}
            aria-expanded={showAll}
          >
            {showAll ? "Show fewer languages" : "More languages..."}
          </button>
        </div>
      </div>
    </div>
  );
}
